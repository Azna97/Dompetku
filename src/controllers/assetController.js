const crypto = require("crypto");
const finance = require("../services/financeService");
const { ensure, buildCrudController } = require("./resourceControllerFactory");

const allowedAssetTypes = ["cash_equivalent", "gold", "investment", "property", "vehicle", "business", "gadget", "other"];

function validatePayload(body) {
  ensure(body.id, "ID aset wajib ada.");
  ensure(body.name?.trim(), "Nama aset wajib diisi.");
  ensure(body.walletId, "Dompet aset wajib dipilih.");
  ensure(allowedAssetTypes.includes(body.type), "Jenis aset tidak valid.");
  ensure(Number(body.currentValue || 0) >= 0, "Nilai aset tidak boleh negatif.");
  ensure(Number(body.purchaseValue || 0) >= 0, "Nilai beli aset tidak boleh negatif.");
}

module.exports = buildCrudController("Aset", {
  validateCreate: (req) => validatePayload(req.body),
  validateUpdate: (req) => validatePayload({ ...req.body, id: req.params.id }),
  create: (req) => finance.db.transaction(async () => {
    await finance.db.prepare(`
      INSERT INTO assets (id, user_id, wallet_id, name, type, account_name, current_value, purchase_value, acquired_date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.body.id,
      req.authUser.id,
      req.body.walletId,
      req.body.name.trim(),
      req.body.type,
      (req.body.accountName || "").trim(),
      Number(req.body.currentValue || 0),
      Number(req.body.purchaseValue || 0),
      req.body.acquiredDate || "",
      req.body.note || ""
    );
    return finance.db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(
      crypto.randomUUID(),
      req.body.id,
      Number(req.body.currentValue || 0),
      new Date().toISOString().slice(0, 10)
    );
  })(),
  update: (req) => finance.db.transaction(async () => {
    const result = await finance.db.prepare(`
      UPDATE assets
      SET wallet_id = ?, name = ?, type = ?, account_name = ?, current_value = ?, purchase_value = ?, acquired_date = ?, note = ?
      WHERE id = ? AND user_id = ?
    `).run(
      req.body.walletId,
      req.body.name.trim(),
      req.body.type,
      (req.body.accountName || "").trim(),
      Number(req.body.currentValue || 0),
      Number(req.body.purchaseValue || 0),
      req.body.acquiredDate || "",
      req.body.note || "",
      req.params.id,
      req.authUser.id
    );
    if (result.changes) {
      await finance.db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(
        crypto.randomUUID(),
        req.params.id,
        Number(req.body.currentValue || 0),
        new Date().toISOString().slice(0, 10)
      );
    }
    return result;
  })(),
  remove: (req) => finance.db.prepare("DELETE FROM assets WHERE id = ? AND user_id = ?").run(req.params.id, req.authUser.id)
});
