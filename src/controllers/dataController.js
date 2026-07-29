const crypto = require("crypto");
const { db } = require("../services/coreService");
const { publicUser, writeAuditLog } = require("../services/authService");
const { getFullState, resetUserData } = require("../services/stateService");

function ensure(condition, message, status = 400) {
  if (!condition) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

async function exportData(req, res, next) {
  try {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: publicUser(req.authUser),
      data: await getFullState(req.authUser.id)
    };
    await writeAuditLog({ userId: req.authUser.id, action: "data_export", detail: "Export data JSON", req });
    res.json(payload);
  } catch (error) { next(error); }
}

async function importData(req, res, next) {
  try {
    const payload = req.body?.payload;
    const importedData = payload?.data;
    ensure(importedData && Array.isArray(importedData.wallets) && Array.isArray(importedData.categories) && Array.isArray(importedData.transactions) && Array.isArray(importedData.debts), "Format file import tidak valid.");

    await db.transaction(async () => {
      await resetUserData(req.authUser.id);

      for (const wallet of importedData.wallets) {
        await db.prepare("INSERT INTO wallets (id, user_id, name, balance) VALUES (?, ?, ?, ?)").run(
          wallet.id || crypto.randomUUID(),
          req.authUser.id,
          wallet.name || "Wallet",
          Number(wallet.balance || 0)
        );
      }

      for (const category of importedData.categories) {
        await db.prepare("INSERT INTO categories (id, user_id, name, type) VALUES (?, ?, ?, ?)").run(
          category.id || crypto.randomUUID(),
          req.authUser.id,
          category.name || "Kategori",
          ["income", "expense"].includes(category.type) ? category.type : "expense"
        );
      }

      for (const asset of importedData.assets || []) {
        const assetId = asset.id || crypto.randomUUID();
        await db.prepare(`
          INSERT INTO assets (id, user_id, wallet_id, name, type, account_name, current_value, purchase_value, acquired_date, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          assetId,
          req.authUser.id,
          asset.walletId || null,
          asset.name || "Aset",
          ["cash_equivalent", "gold", "investment", "property", "vehicle", "business", "gadget", "other"].includes(asset.type) ? asset.type : "other",
          asset.accountName || "",
          Number(asset.currentValue || 0),
          Number(asset.purchaseValue || 0),
          asset.acquiredDate || "",
          asset.note || ""
        );
        const historyItems = Array.isArray(asset.history) && asset.history.length
          ? asset.history
          : [{ id: crypto.randomUUID(), value: Number(asset.currentValue || 0), recordDate: new Date().toISOString().slice(0, 10) }];
        for (const history of historyItems) {
          await db.prepare("INSERT INTO asset_history (id, asset_id, value, record_date) VALUES (?, ?, ?, ?)").run(
            history.id || crypto.randomUUID(),
            assetId,
            Number(history.value || 0),
            history.recordDate || new Date().toISOString().slice(0, 10)
          );
        }
      }

      for (const budget of importedData.budgets || []) {
        await db.prepare("INSERT INTO budgets (id, user_id, category_id, amount, month, carry_over_enabled, note) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          budget.id || crypto.randomUUID(),
          req.authUser.id,
          budget.categoryId || null,
          Number(budget.amount || 0),
          /^\d{4}-\d{2}$/.test(budget.month || "") ? budget.month : new Date().toISOString().slice(0, 7),
          budget.carryOverEnabled === false ? 0 : 1,
          budget.note || ""
        );
      }

      for (const target of importedData.savingsTargets || []) {
        await db.prepare("INSERT INTO savings_targets (id, user_id, month, amount, note) VALUES (?, ?, ?, ?, ?)").run(
          target.id || crypto.randomUUID(),
          req.authUser.id,
          /^\d{4}-\d{2}$/.test(target.month || "") ? target.month : new Date().toISOString().slice(0, 7),
          Number(target.amount || 0),
          target.note || ""
        );
      }

      for (const transaction of importedData.transactions) {
        await db.prepare(`
          INSERT INTO transactions (id, user_id, type, wallet_id, category_id, from_wallet_id, to_wallet_id, amount, date, description, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          transaction.id || crypto.randomUUID(),
          req.authUser.id,
          ["income", "expense", "transfer"].includes(transaction.type) ? transaction.type : "expense",
          transaction.walletId || null,
          transaction.categoryId || null,
          transaction.fromWalletId || null,
          transaction.toWalletId || null,
          Number(transaction.amount || 0),
          transaction.date || new Date().toISOString().slice(0, 10),
          transaction.description || "Transaksi Import",
          transaction.note || ""
        );
      }

      for (const debt of importedData.debts) {
        const debtId = debt.id || crypto.randomUUID();
        await db.prepare("INSERT INTO debts (id, user_id, type, wallet_id, transaction_id, name, amount, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
          debtId,
          req.authUser.id,
          ["debt", "receivable"].includes(debt.type) ? debt.type : "debt",
          debt.walletId || null,
          debt.transactionId || null,
          debt.name || "Data Import",
          Number(debt.amount || 0),
          debt.date || new Date().toISOString().slice(0, 10),
          debt.note || ""
        );
        for (const payment of debt.payments || []) {
          await db.prepare("INSERT INTO debt_payments (id, debt_id, wallet_id, transaction_id, amount, date) VALUES (?, ?, ?, ?, ?, ?)").run(
            payment.id || crypto.randomUUID(),
            debtId,
            payment.walletId || null,
            payment.transactionId || null,
            Number(payment.amount || 0),
            payment.date || new Date().toISOString().slice(0, 10)
          );
        }
      }
    })();

    await writeAuditLog({ userId: req.authUser.id, action: "data_import", detail: "Import data JSON", req });
    res.json({ ok: true });
  } catch (error) { next(error); }
}

module.exports = { exportData, importData };
