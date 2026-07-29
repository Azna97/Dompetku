const path = require("path");
const fs = require("fs");
const os = require("os");
let Database;
try {
  Database = require("better-sqlite3");
} catch (_) {
  Database = null;
}
const { createDatabaseAdapter, runSqlFile } = require("./databaseService");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PORT = 3000;
const HOST = process.env.HOST || "0.0.0.0";

function isRealPostgresUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (
    url.includes("db.xxxx.supabase.co") ||
    url.includes("[PASSWORD]") ||
    url.includes("<PASSWORD>") ||
    url.includes("xxxx")
  ) {
    return false;
  }
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

const DATABASE_URL = isRealPostgresUrl(process.env.DATABASE_URL) ? process.env.DATABASE_URL : "";
const IS_POSTGRES = Boolean(DATABASE_URL);
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.VERCEL_ENV);

function getWritableDir(dirName) {
  if (IS_VERCEL) {
    const tmpPath = path.join(os.tmpdir(), dirName);
    try { fs.mkdirSync(tmpPath, { recursive: true }); } catch (e) {}
    return tmpPath;
  }
  try {
    const targetPath = path.join(ROOT_DIR, dirName);
    fs.mkdirSync(targetPath, { recursive: true });
    const testFile = path.join(targetPath, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    return targetPath;
  } catch (err) {
    const tmpPath = path.join(os.tmpdir(), dirName);
    try { fs.mkdirSync(tmpPath, { recursive: true }); } catch (e) {}
    return tmpPath;
  }
}

const DB_DIR = getWritableDir("data");
const BACKUP_DIR = getWritableDir("backups");
const PRIMARY_DB_PATH = path.join(DB_DIR, "finance.db");
const FALLBACK_DB_PATH = path.join(DB_DIR, "finance.local.db");
const SESSION_COOKIE = "dompetku_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;
const BACKUP_INTERVAL_MS = Math.max(Number(process.env.DB_BACKUP_INTERVAL_HOURS || 12), 1) * 60 * 60 * 1000;
const MAX_BACKUP_FILES = Math.max(Number(process.env.DB_BACKUP_KEEP || 14), 3);

function canWriteToDatabase(dbPath) {
  if (!Database) return true;
  try {
    const probeDb = new Database(dbPath);
    probeDb.exec(`
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS __dompetku_write_probe (id INTEGER);
      DROP TABLE __dompetku_write_probe;
      ROLLBACK;
    `);
    probeDb.close();
    return true;
  } catch {
    return false;
  }
}

function resolveDatabasePath() {
  if (IS_VERCEL) {
    return PRIMARY_DB_PATH;
  }
  if (!fs.existsSync(PRIMARY_DB_PATH)) {
    return PRIMARY_DB_PATH;
  }

  if (canWriteToDatabase(PRIMARY_DB_PATH)) {
    return PRIMARY_DB_PATH;
  }

  try {
    const shouldRefreshFallback = !fs.existsSync(FALLBACK_DB_PATH)
      || fs.statSync(FALLBACK_DB_PATH).mtimeMs < fs.statSync(PRIMARY_DB_PATH).mtimeMs;

    if (shouldRefreshFallback) {
      fs.copyFileSync(PRIMARY_DB_PATH, FALLBACK_DB_PATH);
    }
    return FALLBACK_DB_PATH;
  } catch {
    return PRIMARY_DB_PATH;
  }
}

const DB_PATH = IS_POSTGRES ? "postgres" : resolveDatabasePath();
const db = createDatabaseAdapter({ databaseUrl: DATABASE_URL, sqlitePath: DB_PATH });

async function createSqliteBaseTables() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
      wallet_id TEXT,
      category_id TEXT,
      from_wallet_id TEXT,
      to_wallet_id TEXT,
      amount REAL NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('debt', 'receivable')),
      wallet_id TEXT,
      transaction_id TEXT,
      name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      month TEXT NOT NULL,
      carry_over_enabled INTEGER NOT NULL DEFAULT 1,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      wallet_id TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      account_name TEXT DEFAULT '',
      current_value REAL NOT NULL DEFAULT 0,
      purchase_value REAL NOT NULL DEFAULT 0,
      acquired_date TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS asset_history (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      record_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS savings_targets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      month TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id TEXT PRIMARY KEY,
      debt_id TEXT NOT NULL,
      wallet_id TEXT,
      transaction_id TEXT,
      amount REAL NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      ip_address TEXT DEFAULT '',
      success INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_wallets_user_created ON wallets(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_categories_user_created ON categories(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_debts_user_date ON debts(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
    CREATE INDEX IF NOT EXISTS idx_assets_user_type ON assets(user_id, type);
    CREATE INDEX IF NOT EXISTS idx_asset_history_asset_date ON asset_history(asset_id, record_date);
    CREATE INDEX IF NOT EXISTS idx_savings_targets_user_month ON savings_targets(user_id, month);
    CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_date ON debt_payments(debt_id, date);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON login_attempts(email, created_at);
  `);
}

async function ensureColumn(tableName, columnName, definition) {
  if (db.kind !== "sqlite") return;
  const columns = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some((column) => column.name === columnName)) {
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
}

async function runSqliteMigrations() {
  await ensureColumn("wallets", "user_id", "user_id TEXT");
  await ensureColumn("categories", "user_id", "user_id TEXT");
  await ensureColumn("transactions", "user_id", "user_id TEXT");
  await ensureColumn("debts", "user_id", "user_id TEXT");
  await ensureColumn("debts", "wallet_id", "wallet_id TEXT");
  await ensureColumn("debts", "transaction_id", "transaction_id TEXT");
  await ensureColumn("budgets", "user_id", "user_id TEXT");
  await ensureColumn("budgets", "carry_over_enabled", "carry_over_enabled INTEGER NOT NULL DEFAULT 1");
  await ensureColumn("assets", "user_id", "user_id TEXT");
  await ensureColumn("assets", "wallet_id", "wallet_id TEXT");
  await ensureColumn("assets", "account_name", "account_name TEXT DEFAULT ''");
  await ensureColumn("savings_targets", "user_id", "user_id TEXT");
  await ensureColumn("debt_payments", "wallet_id", "wallet_id TEXT");
  await ensureColumn("debt_payments", "transaction_id", "transaction_id TEXT");
}

async function initializeDatabase() {
  if (db.kind === "postgres") {
    await runSqlFile(db, path.join(ROOT_DIR, "supabase_schema.sql"));
    return;
  }
  await createSqliteBaseTables();
  await runSqliteMigrations();
}

function getTimestampForFilename() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "-",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ].join("");
}

function listBackupFiles() {
  if (db.kind === "postgres") return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith(".db"))
    .map((file) => {
      const fullPath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(fullPath);
      return { file, size: stats.size, createdAt: stats.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function cleanupOldBackups() {
  listBackupFiles().slice(MAX_BACKUP_FILES).forEach((backup) => {
    fs.unlinkSync(path.join(BACKUP_DIR, backup.file));
  });
}

function createDatabaseBackup(trigger = "manual") {
  if (db.kind === "postgres") {
    const error = new Error("Backup manual file database hanya tersedia untuk mode SQLite. Gunakan backup Supabase untuk database online.");
    error.status = 400;
    throw error;
  }
  if (db.raw && typeof db.raw.pragma === "function") {
    try {
      db.raw.pragma("wal_checkpoint(TRUNCATE)");
    } catch (_) {}
  }
  const filename = `dompetku-backup-${getTimestampForFilename()}-${trigger}.db`;
  const destination = path.join(BACKUP_DIR, filename);
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, destination);
  } else {
    fs.writeFileSync(destination, "");
  }
  cleanupOldBackups();
  return { file: filename, path: destination };
}

function getLocalNetworkUrls(port = PORT) {
  const urls = [];
  Object.values(os.networkInterfaces()).forEach((entries) => {
    (entries || []).forEach((entry) => {
      if (entry.family === "IPv4" && !entry.internal) {
        urls.push(`http://${entry.address}:${port}`);
      }
    });
  });
  return Array.from(new Set(urls)).sort();
}

function startBackupScheduler() {
  if (IS_VERCEL || db.kind === "postgres") {
    return;
  }
  try {
    const startupBackup = createDatabaseBackup("startup");
    console.log(`Backup startup dibuat: ${startupBackup.file}`);
  } catch (error) {
    console.error("Gagal membuat backup startup:", error);
  }

  setInterval(() => {
    try {
      const backup = createDatabaseBackup("auto");
      console.log(`Backup otomatis dibuat: ${backup.file}`);
    } catch (error) {
      console.error("Gagal membuat backup otomatis:", error);
    }
  }, BACKUP_INTERVAL_MS);
}

module.exports = {
  ROOT_DIR,
  PORT,
  HOST,
  DB_PATH,
  BACKUP_DIR,
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  BACKUP_INTERVAL_MS,
  IS_POSTGRES,
  db,
  initializeDatabase,
  listBackupFiles,
  createDatabaseBackup,
  getLocalNetworkUrls,
  startBackupScheduler
};

