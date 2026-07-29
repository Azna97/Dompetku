const finance = require("../services/financeService");
const { ensure, buildCrudController } = require("./resourceControllerFactory");

module.exports = buildCrudController("Transaksi", {
  validateCreate: (req) => ensure(req.body.id && req.body.type && req.body.date && req.body.description?.trim(), "Data transaksi tidak lengkap."),
  validateUpdate: (req) => ensure(req.body.type && req.body.date && req.body.description?.trim(), "Data transaksi tidak lengkap."),
  create: (req) => finance.db.prepare(`
    INSERT INTO transactions (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.body.id,
    req.authUser.id,
    req.body.type,
    req.body.walletId || null,
    req.body.categoryId || null,
    req.body.fromWalletId || null,
    req.body.toWalletId || null,
    Number(req.body.amount || 0),
    req.body.date,
    req.body.description.trim(),
    (req.body.note || "").trim()
  ),
  update: (req) => finance.db.prepare(`
    UPDATE transactions
    SET type = ?, wallet_id = ?, category_id = ?, from_wallet_id = ?, to_wallet_id = ?, amount = ?, date = ?, description = ?, note = ?
    WHERE id = ? AND user_id = ?
  `).run(
    req.body.type,
    req.body.walletId || null,
    req.body.categoryId || null,
    req.body.fromWalletId || null,
    req.body.toWalletId || null,
    Number(req.body.amount || 0),
    req.body.date,
    req.body.description.trim(),
    (req.body.note || "").trim(),
    req.params.id,
    req.authUser.id
  ),
  remove: (req) => finance.db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(req.params.id, req.authUser.id)
});
