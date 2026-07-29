const express = require("express");
const authController = require("../controllers/authController");
const stateController = require("../controllers/stateController");
const systemController = require("../controllers/systemController");
const dataController = require("../controllers/dataController");
const walletController = require("../controllers/walletController");
const categoryController = require("../controllers/categoryController");
const assetController = require("../controllers/assetController");
const budgetController = require("../controllers/budgetController");
const savingsTargetController = require("../controllers/savingsTargetController");
const transactionController = require("../controllers/transactionController");
const debtController = require("../controllers/debtController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authController.me);
router.post("/auth/logout", authController.logout);

router.use(requireAuth);

router.get("/state", stateController.getState);
router.get("/auth/security", authController.getSecurity);
router.put("/auth/profile", authController.updateProfile);
router.put("/auth/password", authController.updatePassword);
router.post("/auth/delete-account", authController.deleteAccount);
router.get("/system/info", systemController.getSystemInfo);
router.post("/system/backup", systemController.createBackup);
router.get("/data/export", dataController.exportData);
router.post("/data/import", dataController.importData);
router.post("/wallets", walletController.create);
router.put("/wallets/:id", walletController.update);
router.delete("/wallets/:id", walletController.remove);
router.post("/categories", categoryController.create);
router.put("/categories/:id", categoryController.update);
router.delete("/categories/:id", categoryController.remove);
router.post("/assets", assetController.create);
router.put("/assets/:id", assetController.update);
router.delete("/assets/:id", assetController.remove);
router.post("/budgets", budgetController.create);
router.put("/budgets/:id", budgetController.update);
router.delete("/budgets/:id", budgetController.remove);
router.post("/savings-targets", savingsTargetController.create);
router.put("/savings-targets/:id", savingsTargetController.update);
router.delete("/savings-targets/:id", savingsTargetController.remove);
router.post("/transactions", transactionController.create);
router.put("/transactions/:id", transactionController.update);
router.delete("/transactions/:id", transactionController.remove);
router.post("/debts", debtController.create);
router.put("/debts/:id", debtController.update);
router.delete("/debts/:id", debtController.remove);
router.post("/debts/:id/payments", debtController.createDebtPayment);
router.put("/debts/:debtId/payments/:paymentId", debtController.updateDebtPayment);
router.delete("/debts/:debtId/payments/:paymentId", debtController.deleteDebtPayment);

module.exports = router;
