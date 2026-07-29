const finance = require("../services/financeService");
const { ensure, buildCrudController } = require("./resourceControllerFactory");

module.exports = buildCrudController("Budget", {
  validateCreate: (req) => ensure(
    req.body.id
    && req.body.categoryId
    && /^\d{4}-\d{2}$/.test(req.body.month || "")
    && Number(req.body.amount) > 0,
    "Data budget tidak valid."
  ),
  validateUpdate: (req) => ensure(
    req.body.categoryId
    && /^\d{4}-\d{2}$/.test(req.body.month || "")
    && Number(req.body.amount) > 0,
    "Data budget tidak valid."
  ),
  create: (req) => finance.db.prepare(
    "INSERT INTO budgets (id, user_id, category_id, amount, month, carry_over_enabled, note) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    req.body.id,
    req.authUser.id,
    req.body.categoryId,
    Number(req.body.amount || 0),
    req.body.month,
    req.body.carryOverEnabled === false ? 0 : 1,
    (req.body.note || "").trim()
  ),
  update: (req) => finance.db.prepare(
    "UPDATE budgets SET category_id = ?, amount = ?, month = ?, carry_over_enabled = ?, note = ? WHERE id = ? AND user_id = ?"
  ).run(
    req.body.categoryId,
    Number(req.body.amount || 0),
    req.body.month,
    req.body.carryOverEnabled === false ? 0 : 1,
    (req.body.note || "").trim(),
    req.params.id,
    req.authUser.id
  ),
  remove: (req) => finance.db.prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?").run(req.params.id, req.authUser.id)
});
