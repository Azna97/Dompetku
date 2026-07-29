const crypto = require("crypto");
const {
  db,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  IS_POSTGRES
} = require("./coreService");

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, passwordHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(passwordHash, "hex"));
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce((acc, pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function setSessionCookie(res, sessionId) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS
  });
}

async function createSession(res, userId) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString();
  await db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(sessionId, userId, expiresAt);
  setSessionCookie(res, sessionId);
}

async function clearSession(req, res) {
  if (req.sessionId) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").run(req.sessionId);
  }
  res.clearCookie(SESSION_COOKIE);
}

async function getAuthUserBySessionId(sessionId) {
  if (!sessionId) return null;
  const session = await db.prepare(`
    SELECT sessions.id, sessions.user_id AS userId, sessions.expires_at AS expiresAt, users.name, users.email
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ?
  `).get(sessionId);
  if (!session) return null;
  if (new Date(session.expiresAt) <= new Date()) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  return { id: session.userId, name: session.name, email: session.email };
}

async function cleanupExpiredSessions() {
  await db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
}

async function writeAuditLog({ userId = null, action, detail = "", req }) {
  await db.prepare("INSERT INTO audit_logs (id, user_id, action, detail, ip_address) VALUES (?, ?, ?, ?, ?)").run(
    crypto.randomUUID(),
    userId,
    action,
    detail,
    getClientIp(req)
  );
}

async function recordLoginAttempt({ email, req, success }) {
  await db.prepare("INSERT INTO login_attempts (id, email, ip_address, success) VALUES (?, ?, ?, ?)").run(
    crypto.randomUUID(),
    email.trim().toLowerCase(),
    getClientIp(req),
    success ? 1 : 0
  );
}

async function isLoginBlocked({ email, req }) {
  const sql = IS_POSTGRES
    ? `
      SELECT COUNT(*) AS count
      FROM login_attempts
      WHERE email = ? AND ip_address = ? AND success = 0 AND created_at >= NOW() - INTERVAL '15 minutes'
    `
    : `
      SELECT COUNT(*) AS count
      FROM login_attempts
      WHERE email = ? AND ip_address = ? AND success = 0 AND created_at >= datetime('now', '-15 minutes')
    `;
  const result = await db.prepare(sql).get(email.trim().toLowerCase(), getClientIp(req));
  return Number(result.count || 0) >= 5;
}

module.exports = {
  hashPassword,
  verifyPassword,
  parseCookies,
  setSessionCookie,
  createSession,
  clearSession,
  getAuthUserBySessionId,
  cleanupExpiredSessions,
  publicUser,
  getClientIp,
  writeAuditLog,
  recordLoginAttempt,
  isLoginBlocked
};
