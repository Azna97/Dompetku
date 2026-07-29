const finance = require("../services/financeService");
const { ensure, buildCrudController } = require("./resourceControllerFactory");

module.exports = buildCrudController("Kategori", {
  validateCreate: (req) => ensure(req.body.id && req.body.name?.trim() && ["income", "expense"].includes(req.body.type), "Data kategori tidak valid."),
  validateUpdate: (req) => ensure(req.body.name?.trim() && ["income", "expense"].includes(req.body.type), "Data kategori tidak valid."),
  create: (req) => finance.db.prepare("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)").run(
    req.body.id,
    req.authUser.id,
    req.body.name.trim(),
    req.body.type
  ),
  update: (req) => finance.db.prepare("UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?").run(
    req.body.name.trim(),
    req.body.type,
    req.params.id,
    req.authUser.id
  ),
  remove: (req) => finance.db.transaction(async () => {
    await finance.db.prepare("DELETE FROM transactions WHERE user_id = ? AND category_id = ?").run(req.authUser.id, req.params.id);
    await finance.db.prepare("DELETE FROM budgets WHERE user_id = ? AND category_id = ?").run(req.authUser.id, req.params.id);
    return finance.db.prepare("DELETE FROM categories WHERE id = ? AND user_id = ?").run(req.params.id, req.authUser.id);
  })()
});
