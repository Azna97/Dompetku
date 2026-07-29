const crypto = require("crypto");
const { db } = require("./coreService");

function getPreviousDate(dateValue, dayOffset) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() - dayOffset);
  return date.toISOString().slice(0, 10);
}

async function resetUserData(userId) {
  await db.transaction(async () => {
    await db.prepare("DELETE FROM debt_payments WHERE debt_id IN (SELECT id FROM debts WHERE user_id = ?)").run(userId);
    await db.prepare("DELETE FROM asset_history WHERE asset_id IN (SELECT id FROM assets WHERE user_id = ?)").run(userId);
    await db.prepare("DELETE FROM transactions WHERE user_id = ?").run(userId);
    await db.prepare("DELETE FROM debts WHERE user_id = ?").run(userId);
    await db.prepare("DELETE FROM budgets WHERE user_id = ?").run(userId);
    await db.prepare("DELETE FROM assets WHERE user_id = ?").run(userId);
    await db.prepare("DELETE FROM categories WHERE user_id = ?").run(userId);
    await db.prepare("DELETE FROM wallets WHERE user_id = ?").run(userId);
    await db.prepare("DELETE FROM savings_targets WHERE user_id = ?").run(userId);
  })();
}

async function seedUserData(userId) {
  const now = new Date().toISOString().slice(0, 10);
  const ids = {
    walletCash: crypto.randomUUID(),
    walletBank: crypto.randomUUID(),
    catSalary: crypto.randomUUID(),
    catFreelance: crypto.randomUUID(),
    catFood: crypto.randomUUID(),
    catTransport: crypto.randomUUID(),
    catBills: crypto.randomUUID(),
    trxIncome: crypto.randomUUID(),
    trxExpense: crypto.randomUUID(),
    assetGold: crypto.randomUUID(),
    assetInvestment: crypto.randomUUID(),
    debt: crypto.randomUUID(),
    receivable: crypto.randomUUID(),
    payDebt: crypto.randomUUID(),
    payRecv: crypto.randomUUID()
  };

  await db.transaction(async () => {
    await db.prepare("INSERT INTO wallets (id, user_id, name, balance) VALUES (?, ?, ?, ?)").run(ids.walletCash, userId, "Cash", 3620000);
    await db.prepare("INSERT INTO wallets (id, user_id, name, balance) VALUES (?, ?, ?, ?)").run(ids.walletBank, userId, "Bank Utama", 4300000);
    await db.prepare("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)").run(ids.catSalary, userId, "Gaji", "income");
    await db.prepare("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)").run(ids.catFreelance, userId, "Freelance", "income");
    await db.prepare("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)").run(ids.catFood, userId, "Makan", "expense");
    await db.prepare("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)").run(ids.catTransport, userId, "Transport", "expense");
    await db.prepare("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)").run(ids.catBills, userId, "Tagihan", "expense");
    await db.prepare(`
      INSERT INTO transactions
      (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ids.trxIncome, userId, "income", ids.walletBank, ids.catSalary, null, null, 8500000, now, "Pemasukan Gaji Bulanan", "Transfer perusahaan");
    await db.prepare(`
      INSERT INTO transactions
      (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ids.trxExpense, userId, "expense", ids.walletCash, ids.catFood, null, null, 120000, now, "Makan siang kantor", "");
    await db.prepare(`
      INSERT INTO assets (id, user_id, wallet_id, name, type, account_name, current_value, purchase_value, acquired_date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ids.assetGold, userId, ids.walletBank, "Emas Antam 10gr", "gold", "Tabungan Emas", 12650000, 11800000, now, "Aset lindung nilai jangka panjang");
    await db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), ids.assetGold, 11800000, getPreviousDate(now, 120));
    await db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), ids.assetGold, 12200000, getPreviousDate(now, 60));
    await db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), ids.assetGold, 12650000, now);
    await db.prepare(`
      INSERT INTO assets (id, user_id, wallet_id, name, type, account_name, current_value, purchase_value, acquired_date, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ids.assetInvestment, userId, ids.walletBank, "Reksa Dana Pasar Uang", "investment", "Bibit", 8450000, 8000000, now, "Likuid untuk dana cadangan");
    await db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), ids.assetInvestment, 8000000, getPreviousDate(now, 120));
    await db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), ids.assetInvestment, 8200000, getPreviousDate(now, 60));
    await db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(crypto.randomUUID(), ids.assetInvestment, 8450000, now);
    await db.prepare("INSERT INTO debts (id, user_id, type, wallet_id, name, amount, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(ids.debt, userId, "debt", ids.walletBank, "Pinjaman Kakak", 2000000, now, "Cicilan 4 bulan");
    await db.prepare("INSERT INTO debts (id, user_id, type, wallet_id, name, amount, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(ids.receivable, userId, "receivable", ids.walletCash, "Piutang Teman", 1500000, now, "Pinjam modal");
    await db.prepare("INSERT INTO debt_payments (id, debt_id, amount, date) VALUES (?, ?, ?, ?)").run(ids.payDebt, ids.debt, 500000, now);
    await db.prepare("INSERT INTO debt_payments (id, debt_id, amount, date) VALUES (?, ?, ?, ?)").run(ids.payRecv, ids.receivable, 300000, now);
  })();
}

async function getFullState(userId) {
  const wallets = await db.prepare("SELECT id, name, balance FROM wallets WHERE user_id = ? ORDER BY created_at ASC").all(userId);
  const categories = await db.prepare("SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY created_at ASC").all(userId);
  const assetsRaw = await db.prepare(`
    SELECT id, wallet_id AS walletId, name, type, account_name AS accountName, current_value AS currentValue, purchase_value AS purchaseValue, acquired_date AS acquiredDate, note
    FROM assets
    WHERE user_id = ?
    ORDER BY current_value DESC, created_at ASC
  `).all(userId);
  const assets = [];
  for (const asset of assetsRaw) {
    const history = await db.prepare(`
      SELECT id, value, record_date AS recordDate
      FROM asset_history
      WHERE asset_id = ?
      ORDER BY record_date ASC, created_at ASC
    `).all(asset.id);
    assets.push({ ...asset, history });
  }
  const budgets = await db.prepare(`
    SELECT id, category_id AS categoryId, amount, month, carry_over_enabled AS carryOverEnabled, note
    FROM budgets
    WHERE user_id = ?
    ORDER BY month DESC, created_at ASC
  `).all(userId);
  const savingsTargets = await db.prepare(`
    SELECT id, month, amount, note
    FROM savings_targets
    WHERE user_id = ?
    ORDER BY month DESC, created_at ASC
  `).all(userId);
  const transactions = await db.prepare(`
    SELECT id, type, wallet_id AS walletId, category_id AS categoryId, from_wallet_id AS fromWalletId,
      to_wallet_id AS toWalletId, amount, date, description, note
    FROM transactions
    WHERE user_id = ?
    ORDER BY date DESC, created_at DESC
  `).all(userId);
  const debtsRaw = await db.prepare(`
    SELECT id, type, wallet_id AS walletId, transaction_id AS transactionId, name, amount, date, note
    FROM debts
    WHERE user_id = ?
    ORDER BY date DESC, created_at DESC
  `).all(userId);
  const debts = [];
  for (const debt of debtsRaw) {
    const payments = await db.prepare(`
      SELECT debt_payments.id, debt_payments.amount, debt_payments.date, debt_payments.wallet_id AS walletId, debt_payments.transaction_id AS transactionId
      FROM debt_payments
      JOIN debts ON debts.id = debt_payments.debt_id
      WHERE debt_payments.debt_id = ? AND debts.user_id = ?
      ORDER BY debt_payments.date ASC, debt_payments.created_at ASC
    `).all(debt.id, userId);
    debts.push({ ...debt, payments });
  }
  return { wallets, categories, assets, budgets, savingsTargets, transactions, debts };
}

async function getOwnedRecord(table, id, userId) {
  return db.prepare(`SELECT id FROM ${table} WHERE id = ? AND user_id = ?`).get(id, userId);
}

module.exports = {
  resetUserData,
  seedUserData,
  getFullState,
  getOwnedRecord
};

