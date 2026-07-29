const finance = require("../services/financeService");
const { ensure, buildCrudController } = require("./resourceControllerFactory");

module.exports = buildCrudController("Wallet", {
  validateCreate: (req) => ensure(req.body.id && req.body.name?.trim(), "Nama wallet wajib diisi."),
  validateUpdate: (req) => ensure(req.body.name?.trim(), "Nama wallet wajib diisi."),
  create: (req) => finance.db.prepare("INSERT INTO wallets (id, user_id, name, balance) VALUES (?, ?, ?, ?)").run(
    req.body.id,
    req.authUser.id,
    req.body.name.trim(),
    Number(req.body.balance || 0)
  ),
  update: (req) => finance.db.prepare("UPDATE wallets SET name = ?, balance = ? WHERE id = ? AND user_id = ?").run(
    req.body.name.trim(),
    Number(req.body.balance || 0),
    req.params.id,
    req.authUser.id
  ),
  remove: (req) => finance.db.transaction(async () => {
    await finance.db.prepare("DELETE FROM transactions WHERE user_id = ? AND (wallet_id = ? OR from_wallet_id = ? OR to_wallet_id = ?)").run(
      req.authUser.id,
      req.params.id,
      req.params.id,
      req.params.id
    );
    return finance.db.prepare("DELETE FROM wallets WHERE id = ? AND user_id = ?").run(req.params.id, req.authUser.id);
  })()
});
