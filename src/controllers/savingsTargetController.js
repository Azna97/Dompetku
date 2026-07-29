const finance = require("../services/financeService");
const { ensure, buildCrudController } = require("./resourceControllerFactory");

module.exports = buildCrudController("Target tabungan", {
  validateCreate: (req) => ensure(
    req.body.id && /^\d{4}-\d{2}$/.test(req.body.month || "") && Number(req.body.amount) > 0,
    "Data target tabungan tidak valid."
  ),
  validateUpdate: (req) => ensure(
    /^\d{4}-\d{2}$/.test(req.body.month || "") && Number(req.body.amount) > 0,
    "Data target tabungan tidak valid."
  ),
  create: (req) => finance.db.prepare(
    "INSERT INTO savings_targets (id, user_id, month, amount, note) VALUES (?, ?, ?, ?, ?)"
  ).run(
    req.body.id,
    req.authUser.id,
    req.body.month,
    Number(req.body.amount || 0),
    (req.body.note || "").trim()
  ),
  update: (req) => finance.db.prepare(
    "UPDATE savings_targets SET month = ?, amount = ?, note = ? WHERE id = ? AND user_id = ?"
  ).run(
    req.body.month,
    Number(req.body.amount || 0),
    (req.body.note || "").trim(),
    req.params.id,
    req.authUser.id
  ),
  remove: (req) => finance.db.prepare("DELETE FROM savings_targets WHERE id = ? AND user_id = ?").run(req.params.id, req.authUser.id)
});
