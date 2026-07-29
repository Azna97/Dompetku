const {
  PORT,
  BACKUP_INTERVAL_MS,
  IS_POSTGRES,
  listBackupFiles,
  createDatabaseBackup,
  getLocalNetworkUrls
} = require("../services/coreService");
const { writeAuditLog } = require("../services/authService");

function getSystemInfo(req, res) {
  res.json({
    localUrls: [`http://localhost:${PORT}`, ...getLocalNetworkUrls(PORT)],
    backups: listBackupFiles().slice(0, 8),
    backupIntervalHours: BACKUP_INTERVAL_MS / (60 * 60 * 1000),
    databaseMode: IS_POSTGRES ? "postgres" : "sqlite"
  });
}

async function createBackup(req, res, next) {
  try {
    const backup = createDatabaseBackup("manual");
    await writeAuditLog({ userId: req.authUser.id, action: "database_backup", detail: `Backup manual ${backup.file}`, req });
    res.status(201).json({ ok: true, backup, backups: listBackupFiles().slice(0, 8) });
  } catch (error) { next(error); }
}

module.exports = { getSystemInfo, createBackup };
