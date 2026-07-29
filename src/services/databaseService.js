const fs = require("fs");
const path = require("path");
const { AsyncLocalStorage } = require("async_hooks");
const { Pool } = require("pg");

let BetterSqlite3;
try {
  BetterSqlite3 = require("better-sqlite3");
} catch (_) {
  BetterSqlite3 = null;
}

let initSqlJs;
try {
  initSqlJs = require("sql.js");
} catch (_) {
  initSqlJs = null;
}

let sqlJsPromise = null;
function getSqlJs() {
  if (!sqlJsPromise && initSqlJs) {
    sqlJsPromise = initSqlJs();
  }
  return sqlJsPromise;
}

const txStorage = new AsyncLocalStorage();

function convertQuestionMarks(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function coerceDatabaseValue(key, value) {
  const numericKeys = new Set([
    "amount",
    "balance",
    "value",
    "current_value",
    "currentValue",
    "purchase_value",
    "purchaseValue"
  ]);
  const integerKeys = new Set(["success", "carry_over_enabled", "carryOverEnabled"]);
  if (value === null || value === undefined) return value;
  if (numericKeys.has(key)) return Number(value || 0);
  if (integerKeys.has(key)) return Number(value || 0);
  return value;
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return row;
  const aliases = {
    userid: "userId",
    expiresat: "expiresAt",
    transactionid: "transactionId",
    walletid: "walletId",
    categoryid: "categoryId",
    fromwalletid: "fromWalletId",
    towalletid: "toWalletId",
    accountname: "accountName",
    currentvalue: "currentValue",
    purchasevalue: "purchaseValue",
    acquireddate: "acquiredDate",
    recorddate: "recordDate",
    carryoverenabled: "carryOverEnabled",
    createdat: "createdAt",
    ipaddress: "ipAddress"
  };
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key] = coerceDatabaseValue(key, value);
  });
  Object.entries(row).forEach(([key, value]) => {
    const normalizedValue = coerceDatabaseValue(key, value);
    if (aliases[key] && normalized[aliases[key]] === undefined) {
      normalized[aliases[key]] = coerceDatabaseValue(aliases[key], normalizedValue);
    }
    if (key.includes("_")) {
      const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
      if (normalized[camelKey] === undefined) normalized[camelKey] = coerceDatabaseValue(camelKey, normalizedValue);
    }
  });
  return normalized;
}

function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

function createSqlJsAdapter(dbPath) {
  let sqlite = null;

  async function ensureSqlite() {
    if (!sqlite) {
      const SQL = await getSqlJs();
      if (!SQL) {
        throw new Error("Neither better-sqlite3 nor sql.js is available.");
      }
      if (fs.existsSync(dbPath)) {
        try {
          const fileBuffer = fs.readFileSync(dbPath);
          sqlite = new SQL.Database(fileBuffer);
        } catch (err) {
          console.warn("Failed to load existing sqlite db, creating new one:", err);
          sqlite = new SQL.Database();
        }
      } else {
        sqlite = new SQL.Database();
      }
    }
    return sqlite;
  }

  function saveDb() {
    if (!sqlite) return;
    try {
      const data = sqlite.export();
      const buffer = Buffer.from(data);
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error("Failed to save sqlite db to disk:", e);
    }
  }

  return {
    kind: "sqlite",
    get raw() { return sqlite; },
    prepare(sql) {
      return {
        async run(...params) {
          const db = await ensureSqlite();
          db.run(sql, params);
          saveDb();
          const changes = db.getRowsModified() || 0;
          return { changes, lastInsertRowid: 0 };
        },
        async get(...params) {
          const db = await ensureSqlite();
          const stmt = db.prepare(sql);
          stmt.bind(params);
          let row = undefined;
          if (stmt.step()) {
            row = stmt.getAsObject();
          }
          stmt.free();
          return normalizeRow(row);
        },
        async all(...params) {
          const db = await ensureSqlite();
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return normalizeRows(rows);
        }
      };
    },
    async exec(sql) {
      const db = await ensureSqlite();
      db.exec(sql);
      saveDb();
    },
    transaction(fn) {
      return async (...args) => {
        const db = await ensureSqlite();
        db.exec("BEGIN");
        try {
          const result = await fn(...args);
          db.exec("COMMIT");
          saveDb();
          return result;
        } catch (err) {
          try { db.exec("ROLLBACK"); } catch (_) {}
          throw err;
        }
      };
    },
    async close() {
      if (sqlite) {
        saveDb();
        sqlite.close();
        sqlite = null;
      }
    }
  };
}

function createSqliteAdapter(dbPath) {
  if (BetterSqlite3) {
    try {
      const sqlite = new BetterSqlite3(dbPath);
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");

      return {
        kind: "sqlite",
        raw: sqlite,
        prepare(sql) {
          const statement = sqlite.prepare(sql);
          return {
            async run(...params) {
              const result = statement.run(...params);
              return { changes: result.changes || 0, lastInsertRowid: result.lastInsertRowid };
            },
            async get(...params) {
              return normalizeRow(statement.get(...params));
            },
            async all(...params) {
              return normalizeRows(statement.all(...params));
            }
          };
        },
        async exec(sql) {
          sqlite.exec(sql);
        },
        transaction(fn) {
          return async (...args) => {
            if (txStorage.getStore()) return fn(...args);
            return txStorage.run(sqlite, () => fn(...args));
          };
        },
        async close() {
          sqlite.close();
        }
      };
    } catch (err) {
      console.warn("BetterSqlite3 failed, falling back to sql.js:", err);
    }
  }
  return createSqlJsAdapter(dbPath);
}

function createPostgresAdapter(databaseUrl) {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false }
  });

  async function query(sql, params = []) {
    const client = txStorage.getStore() || pool;
    const result = await client.query(convertQuestionMarks(sql), params);
    return result;
  }

  return {
    kind: "postgres",
    pool,
    prepare(sql) {
      return {
        async run(...params) {
          const result = await query(sql, params);
          return { changes: result.rowCount || 0, rowCount: result.rowCount || 0 };
        },
        async get(...params) {
          const result = await query(sql, params);
          return normalizeRow(result.rows[0]);
        },
        async all(...params) {
          const result = await query(sql, params);
          return normalizeRows(result.rows);
        }
      };
    },
    async exec(sql) {
      await query(sql);
    },
    transaction(fn) {
      return async (...args) => {
        if (txStorage.getStore()) return fn(...args);
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const result = await txStorage.run(client, () => fn(...args));
          await client.query("COMMIT");
          return result;
        } catch (error) {
          try { await client.query("ROLLBACK"); } catch (_) {}
          throw error;
        } finally {
          client.release();
        }
      };
    },
    async close() {
      await pool.end();
    }
  };
}

function createDatabaseAdapter({ databaseUrl, sqlitePath }) {
  if (databaseUrl) return createPostgresAdapter(databaseUrl);
  return createSqliteAdapter(sqlitePath);
}

async function runSqlFile(db, filePath) {
  const sql = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  await db.exec(sql);
}

module.exports = {
  createDatabaseAdapter,
  runSqlFile
};






