const crypto = require("crypto");
const finance = require("../services/financeService");
const { ensure, buildCrudController } = require("./resourceControllerFactory");

function buildDebtTransaction(debtLike, userId, existingTransactionId) {
  return {
    id: existingTransactionId || crypto.randomUUID(),
    userId,
    type: debtLike.type === "receivable" ? "expense" : "income",
    walletId: debtLike.walletId || null,
    amount: Number(debtLike.amount || 0),
    date: debtLike.date,
    description: debtLike.type === "receivable" ? `Piutang Keluar - ${debtLike.name}` : `Hutang Masuk - ${debtLike.name}`,
    note: debtLike.note || ""
  };
}

const debtCrud = buildCrudController("Data hutang/piutang", {
  validateCreate: (req) => ensure(req.body.id && req.body.name?.trim() && req.body.date && req.body.walletId && ["debt", "receivable"].includes(req.body.type), "Data hutang/piutang tidak valid."),
  validateUpdate: (req) => ensure(req.body.name?.trim() && req.body.date && req.body.walletId && ["debt", "receivable"].includes(req.body.type), "Data hutang/piutang tidak valid."),
  create: (req) => finance.db.transaction(async () => {
    const transaction = buildDebtTransaction({
      type: req.body.type,
      walletId: req.body.walletId,
      amount: req.body.amount,
      date: req.body.date,
      name: req.body.name.trim(),
      note: (req.body.note || "").trim()
    }, req.authUser.id);
    await finance.db.prepare(`
      INSERT INTO transactions (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(transaction.id, transaction.userId, transaction.type, transaction.walletId, null, null, null, transaction.amount, transaction.date, transaction.description, transaction.note);
    return finance.db.prepare("INSERT INTO debts (id, user_id, type, wallet_id, transaction_id, name, amount, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      req.body.id,
      req.authUser.id,
      req.body.type,
      req.body.walletId,
      transaction.id,
      req.body.name.trim(),
      Number(req.body.amount || 0),
      req.body.date,
      (req.body.note || "").trim()
    );
  })(),
  update: (req) => finance.db.transaction(async () => {
    const existing = await finance.db.prepare("SELECT transaction_id AS transactionId FROM debts WHERE id = ? AND user_id = ?").get(req.params.id, req.authUser.id);
    ensure(existing, "Data hutang/piutang tidak ditemukan.", 404);
    const transaction = buildDebtTransaction({
      type: req.body.type,
      walletId: req.body.walletId,
      amount: req.body.amount,
      date: req.body.date,
      name: req.body.name.trim(),
      note: (req.body.note || "").trim()
    }, req.authUser.id, existing.transactionId);
    if (existing.transactionId) {
      await finance.db.prepare(`
        UPDATE transactions
        SET type = ?, wallet_id = ?, amount = ?, date = ?, description = ?, note = ?
        WHERE id = ? AND user_id = ?
      `).run(transaction.type, transaction.walletId, transaction.amount, transaction.date, transaction.description, transaction.note, existing.transactionId, req.authUser.id);
    } else {
      await finance.db.prepare(`
        INSERT INTO transactions (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(transaction.id, transaction.userId, transaction.type, transaction.walletId, null, null, null, transaction.amount, transaction.date, transaction.description, transaction.note);
    }
    return finance.db.prepare("UPDATE debts SET type = ?, wallet_id = ?, transaction_id = ?, name = ?, amount = ?, date = ?, note = ? WHERE id = ? AND user_id = ?").run(
      req.body.type,
      req.body.walletId,
      transaction.id,
      req.body.name.trim(),
      Number(req.body.amount || 0),
      req.body.date,
      (req.body.note || "").trim(),
      req.params.id,
      req.authUser.id
    );
  })(),
  remove: (req) => finance.db.transaction(async () => {
    const debt = await finance.db.prepare("SELECT transaction_id AS transactionId FROM debts WHERE id = ? AND user_id = ?").get(req.params.id, req.authUser.id);
    ensure(debt, "Data hutang/piutang tidak ditemukan.", 404);
    if (debt.transactionId) {
      await finance.db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(debt.transactionId, req.authUser.id);
    }
    const paymentTransactions = await finance.db.prepare(`
      SELECT debt_payments.transaction_id AS transactionId
      FROM debt_payments
      JOIN debts ON debts.id = debt_payments.debt_id
      WHERE debt_payments.debt_id = ? AND debts.user_id = ?
    `).all(req.params.id, req.authUser.id);
    for (const item of paymentTransactions) {
      if (item.transactionId) {
        await finance.db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(item.transactionId, req.authUser.id);
      }
    }
    return finance.db.prepare("DELETE FROM debts WHERE id = ? AND user_id = ?").run(req.params.id, req.authUser.id);
  })()
});

function buildPaymentTransaction(debt, userId, payload, existingTransactionId) {
  return {
    id: existingTransactionId || crypto.randomUUID(),
    userId,
    type: debt.type === "receivable" ? "income" : "expense",
    walletId: payload.walletId || null,
    amount: Number(payload.amount || 0),
    date: payload.date,
    description: debt.type === "receivable" ? `Terima Piutang - ${debt.name}` : `Bayar Hutang - ${debt.name}`,
    note: debt.note || ""
  };
}

async function createDebtPayment(req, res, next) {
  try {
    const debt = await finance.db.prepare("SELECT id, type, name, note FROM debts WHERE id = ? AND user_id = ?").get(req.params.id, req.authUser.id);
    ensure(debt, "Data hutang/piutang tidak ditemukan.", 404);
    ensure(req.body.id && req.body.date && req.body.walletId, "Data pembayaran tidak valid.");
    await finance.db.transaction(async () => {
      const transaction = buildPaymentTransaction(debt, req.authUser.id, req.body);
      await finance.db.prepare(`
        INSERT INTO transactions (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(transaction.id, transaction.userId, transaction.type, transaction.walletId, null, null, null, transaction.amount, transaction.date, transaction.description, transaction.note);
      await finance.db.prepare("INSERT INTO debt_payments (id, debt_id, wallet_id, transaction_id, amount, date) VALUES (?, ?, ?, ?, ?, ?)").run(
        req.body.id,
        req.params.id,
        req.body.walletId,
        transaction.id,
        Number(req.body.amount || 0),
        req.body.date
      );
    })();
    res.status(201).json({ ok: true });
  } catch (error) { next(error); }
}

async function updateDebtPayment(req, res, next) {
  try {
    const debt = await finance.db.prepare("SELECT id, type, name, note FROM debts WHERE id = ? AND user_id = ?").get(req.params.debtId, req.authUser.id);
    ensure(debt, "Data hutang/piutang tidak ditemukan.", 404);
    ensure(req.body.date && req.body.walletId, "Data pembayaran tidak valid.");
    const result = await finance.db.transaction(async () => {
      const payment = await finance.db.prepare("SELECT id, transaction_id AS transactionId FROM debt_payments WHERE id = ? AND debt_id = ?").get(req.params.paymentId, req.params.debtId);
      ensure(payment, "Riwayat pembayaran tidak ditemukan.", 404);
      const paymentUpdate = await finance.db.prepare("UPDATE debt_payments SET wallet_id = ?, amount = ?, date = ? WHERE id = ? AND debt_id = ?").run(
        req.body.walletId,
        Number(req.body.amount || 0),
        req.body.date,
        req.params.paymentId,
        req.params.debtId
      );
      const transaction = buildPaymentTransaction(debt, req.authUser.id, req.body, payment.transactionId);
      if (payment.transactionId) {
        await finance.db.prepare(`
          UPDATE transactions
          SET type = ?, wallet_id = ?, amount = ?, date = ?, description = ?, note = ?
          WHERE id = ? AND user_id = ?
        `).run(transaction.type, transaction.walletId, transaction.amount, transaction.date, transaction.description, transaction.note, payment.transactionId, req.authUser.id);
      } else {
        await finance.db.prepare(`
          INSERT INTO transactions (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(transaction.id, transaction.userId, transaction.type, transaction.walletId, null, null, null, transaction.amount, transaction.date, transaction.description, transaction.note);
        await finance.db.prepare("UPDATE debt_payments SET transaction_id = ? WHERE id = ? AND debt_id = ?").run(transaction.id, req.params.paymentId, req.params.debtId);
      }
      return paymentUpdate;
    })();
    ensure(result.changes, "Riwayat pembayaran tidak ditemukan.", 404);
    res.json({ ok: true });
  } catch (error) { next(error); }
}

async function deleteDebtPayment(req, res, next) {
  try {
    ensure(await finance.getOwnedRecord("debts", req.params.debtId, req.authUser.id), "Data hutang/piutang tidak ditemukan.", 404);
    const result = await finance.db.transaction(async () => {
      const payment = await finance.db.prepare("SELECT transaction_id AS transactionId FROM debt_payments WHERE id = ? AND debt_id = ?").get(req.params.paymentId, req.params.debtId);
      ensure(payment, "Riwayat pembayaran tidak ditemukan.", 404);
      if (payment.transactionId) {
        await finance.db.prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?").run(payment.transactionId, req.authUser.id);
      }
      return finance.db.prepare("DELETE FROM debt_payments WHERE id = ? AND debt_id = ?").run(req.params.paymentId, req.params.debtId);
    })();
    ensure(result.changes, "Riwayat pembayaran tidak ditemukan.", 404);
    res.json({ ok: true });
  } catch (error) { next(error); }
}

module.exports = { ...debtCrud, createDebtPayment, updateDebtPayment, deleteDebtPayment };
