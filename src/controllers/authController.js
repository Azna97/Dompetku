const crypto = require("crypto");
const { db, SESSION_COOKIE } = require("../services/coreService");
const {
  hashPassword,
  verifyPassword,
  createSession,
  clearSession,
  publicUser,
  writeAuditLog,
  recordLoginAttempt,
  isLoginBlocked
} = require("../services/authService");
const { seedUserData, resetUserData } = require("../services/stateService");

function ensure(condition, message, status = 400) {
  if (!condition) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    ensure(name?.trim() && email?.trim() && password?.length >= 6, "Nama, email, dan password minimal 6 karakter wajib diisi.");
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    ensure(!exists, "Email sudah terdaftar.");
    const userId = crypto.randomUUID();
    const { salt, hash } = hashPassword(password);
    await db.transaction(async () => {
      await db.prepare("INSERT INTO users (id, name, email, password_hash, salt) VALUES (?, ?, ?, ?, ?)").run(userId, name.trim(), normalizedEmail, hash, salt);
      await seedUserData(userId);
    })();
    await createSession(res, userId);
    await writeAuditLog({ userId, action: "register", detail: "Akun dibuat", req });
    res.status(201).json({ user: publicUser({ id: userId, name: name.trim(), email: normalizedEmail }) });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    ensure(email?.trim() && password, "Email dan password wajib diisi.");
    ensure(!(await isLoginBlocked({ email, req })), "Terlalu banyak percobaan login. Coba lagi 15 menit lagi.", 429);
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
      await recordLoginAttempt({ email, req, success: false });
      ensure(false, "Email atau password salah.", 401);
    }
    await recordLoginAttempt({ email, req, success: true });
    await createSession(res, user.id);
    await writeAuditLog({ userId: user.id, action: "login", detail: "Login berhasil", req });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
}

function me(req, res) {
  if (!req.authUser) return res.status(401).json({ error: "Belum login." });
  res.json({ user: publicUser(req.authUser) });
}

async function logout(req, res, next) {
  try {
    if (req.authUser) await writeAuditLog({ userId: req.authUser.id, action: "logout", detail: "Logout manual", req });
    await clearSession(req, res);
    res.json({ ok: true });
  } catch (error) { next(error); }
}

async function getSecurity(req, res, next) {
  try {
    const logs = await db.prepare(`
      SELECT id, action, detail, ip_address AS ipAddress, created_at AS createdAt
      FROM audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.authUser.id);
    res.json({ logs });
  } catch (error) { next(error); }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    ensure(name?.trim() && email?.trim(), "Nama dan email wajib diisi.");
    const normalizedEmail = email.trim().toLowerCase();
    const emailOwner = await db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(normalizedEmail, req.authUser.id);
    ensure(!emailOwner, "Email sudah dipakai akun lain.");
    await db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name.trim(), normalizedEmail, req.authUser.id);
    req.authUser = { ...req.authUser, name: name.trim(), email: normalizedEmail };
    await writeAuditLog({ userId: req.authUser.id, action: "profile_update", detail: "Profil diperbarui", req });
    res.json({ user: publicUser(req.authUser) });
  } catch (error) { next(error); }
}

async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    ensure(currentPassword && newPassword && newPassword.length >= 6, "Password lama dan password baru minimal 6 karakter wajib diisi.");
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.authUser.id);
    ensure(user && verifyPassword(currentPassword, user.salt, user.password_hash), "Password lama tidak sesuai.", 401);
    const { salt, hash } = hashPassword(newPassword);
    await db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?").run(hash, salt, req.authUser.id);
    await writeAuditLog({ userId: req.authUser.id, action: "password_change", detail: "Password diganti", req });
    res.json({ ok: true });
  } catch (error) { next(error); }
}

async function deleteAccount(req, res, next) {
  try {
    ensure(req.body.password, "Password wajib diisi untuk hapus akun.");
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.authUser.id);
    ensure(user && verifyPassword(req.body.password, user.salt, user.password_hash), "Password salah.", 401);
    await db.transaction(async () => {
      await writeAuditLog({ userId: req.authUser.id, action: "account_delete", detail: "Akun dihapus permanen", req });
      await resetUserData(req.authUser.id);
      await db.prepare("DELETE FROM sessions WHERE user_id = ?").run(req.authUser.id);
      await db.prepare("DELETE FROM audit_logs WHERE user_id = ?").run(req.authUser.id);
      await db.prepare("DELETE FROM users WHERE id = ?").run(req.authUser.id);
    })();
    res.clearCookie(SESSION_COOKIE);
    res.json({ ok: true });
  } catch (error) { next(error); }
}

module.exports = { register, login, me, logout, getSecurity, updateProfile, updatePassword, deleteAccount };
