const UI_STORAGE_KEY = "dompetku-ui-state";

const todayISO = new Date().toISOString().slice(0, 10);
const currentMonth = todayISO.slice(0, 7);

const defaultUiState = {
  theme: "dark",
  activeView: "dashboard",
  sidebarCollapsed: false,
  showAmounts: true,
  filters: {
    dashboard: {
      balanceMode: "running",
      mode: "month",
      month: currentMonth,
      start: "",
      end: "",
    },
    transactions: {
      dateMode: "all",
      month: currentMonth,
      start: "",
      end: "",
      category: "all",
      type: "all",
      wallet: "all",
      search: "",
    },
    assets: {
      type: "all",
    },
    budgeting: {
      month: currentMonth,
    },
    debts: {
      status: "all",
    },
  },
};

const defaultDataState = {
  wallets: [],
  categories: [],
  assets: [],
  budgets: [],
  savingsTargets: [],
  transactions: [],
  debts: [],
};

function loadUiState() {
  const saved = localStorage.getItem(UI_STORAGE_KEY);
  if (!saved) {
    return structuredClone(defaultUiState);
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(defaultUiState),
      ...parsed,
      filters: {
        ...structuredClone(defaultUiState.filters),
        ...(parsed.filters || {}),
        dashboard: {
          ...structuredClone(defaultUiState.filters.dashboard),
          ...(parsed.filters?.dashboard || {}),
        },
        transactions: {
          ...structuredClone(defaultUiState.filters.transactions),
          ...(parsed.filters?.transactions || {}),
        },
        assets: {
          ...structuredClone(defaultUiState.filters.assets),
          ...(parsed.filters?.assets || {}),
        },
        budgeting: {
          ...structuredClone(defaultUiState.filters.budgeting),
          ...(parsed.filters?.budgeting || {}),
        },
        debts: {
          ...structuredClone(defaultUiState.filters.debts),
          ...(parsed.filters?.debts || {}),
        },
      },
    };
  } catch {
    localStorage.removeItem(UI_STORAGE_KEY);
    return structuredClone(defaultUiState);
  }
}

let state = {
  ...loadUiState(),
  ...structuredClone(defaultDataState),
  authUser: null,
  systemInfo: null,
  isLoading: false,
  activeTransactionDetailId: null,
  activeDebtActionId: null,
  activeDebtDetailId: null,
};

let calculatorExpression = "";
let confirmModalResolver = null;

const pageTitleMap = {
  dashboard: "Dashboard",
  wallet: "Wallet",
  assets: "Aset",
  transactions: "Transaksi",
  categories: "Kategori",
  budgeting: "Budgeting",
  debts: "Hutang Piutang",
  profile: "Profil & Akun",
};

const elements = {
  body: document.body,
  authShell: document.getElementById("authShell"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  registerName: document.getElementById("registerName"),
  registerEmail: document.getElementById("registerEmail"),
  registerPassword: document.getElementById("registerPassword"),
  authStatus: document.getElementById("authStatus"),
  sidebarNav: document.getElementById("sidebarNav"),
  sidebarCollapseToggle: document.getElementById("sidebarCollapseToggle"),
  pageTitle: document.getElementById("pageTitle"),
  themeToggle: document.getElementById("themeToggle"),
  openProfileModal: document.getElementById("openProfileModal"),
  logoutButton: document.getElementById("logoutButton"),
  userDisplayName: document.getElementById("userDisplayName"),
  userEmailDisplay: document.getElementById("userEmailDisplay"),
  userAvatar: document.getElementById("userAvatar"),
  dashboardVisibilityToggle: document.getElementById("dashboardVisibilityToggle"),
  dashboardBalanceMode: document.getElementById("dashboardBalanceMode"),
  walletVisibilityToggle: document.getElementById("walletVisibilityToggle"),
  dashboardRangeType: document.getElementById("dashboardRangeType"),
  dashboardMonth: document.getElementById("dashboardMonth"),
  dashboardStart: document.getElementById("dashboardStart"),
  dashboardEnd: document.getElementById("dashboardEnd"),
  dashboardStats: document.getElementById("dashboardStats"),
  dashboardInsights: document.getElementById("dashboardInsights"),
  transactionChart: document.getElementById("transactionChart"),
  categoryChart: document.getElementById("categoryChart"),
  walletGrid: document.getElementById("walletGrid"),
  assetTypeFilter: document.getElementById("assetTypeFilter"),
  assetSummary: document.getElementById("assetSummary"),
  assetCompositionChart: document.getElementById("assetCompositionChart"),
  assetHistoryChart: document.getElementById("assetHistoryChart"),
  assetList: document.getElementById("assetList"),
  transactionsTableBody: document.getElementById("transactionsTableBody"),
  transactionCategoryFilter: document.getElementById("transactionCategoryFilter"),
  transactionDateMode: document.getElementById("transactionDateMode"),
  transactionMonth: document.getElementById("transactionMonth"),
  transactionWalletFilter: document.getElementById("transactionWalletFilter"),
  transactionTypeFilter: document.getElementById("transactionTypeFilter"),
  transactionStart: document.getElementById("transactionStart"),
  transactionEnd: document.getElementById("transactionEnd"),
  transactionSearch: document.getElementById("transactionSearch"),
  incomeCategoryList: document.getElementById("incomeCategoryList"),
  expenseCategoryList: document.getElementById("expenseCategoryList"),
  budgetMonthFilter: document.getElementById("budgetMonthFilter"),
  budgetSummary: document.getElementById("budgetSummary"),
  budgetInsights: document.getElementById("budgetInsights"),
  budgetList: document.getElementById("budgetList"),
  debtSummary: document.getElementById("debtSummary"),
  debtList: document.getElementById("debtList"),
  debtFilterBar: document.getElementById("debtFilterBar"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  confirmModalTitle: document.getElementById("confirmModalTitle"),
  confirmModalMessage: document.getElementById("confirmModalMessage"),
  confirmModalCancel: document.getElementById("confirmModalCancel"),
  confirmModalConfirm: document.getElementById("confirmModalConfirm"),
  transactionDetailContent: document.getElementById("transactionDetailContent"),
  walletForm: document.getElementById("walletForm"),
  walletId: document.getElementById("walletId"),
  walletName: document.getElementById("walletName"),
  walletBalance: document.getElementById("walletBalance"),
  walletModalTitle: document.getElementById("walletModalTitle"),
  assetForm: document.getElementById("assetForm"),
  assetId: document.getElementById("assetId"),
  assetWalletId: document.getElementById("assetWalletId"),
  assetName: document.getElementById("assetName"),
  assetType: document.getElementById("assetType"),
  assetAccountName: document.getElementById("assetAccountName"),
  assetCurrentValue: document.getElementById("assetCurrentValue"),
  assetPurchaseValue: document.getElementById("assetPurchaseValue"),
  assetAcquiredDate: document.getElementById("assetAcquiredDate"),
  assetNote: document.getElementById("assetNote"),
  assetModalTitle: document.getElementById("assetModalTitle"),
  categoryForm: document.getElementById("categoryForm"),
  categoryId: document.getElementById("categoryId"),
  categoryName: document.getElementById("categoryName"),
  categoryType: document.getElementById("categoryType"),
  categoryModalTitle: document.getElementById("categoryModalTitle"),
  budgetForm: document.getElementById("budgetForm"),
  budgetId: document.getElementById("budgetId"),
  budgetMonth: document.getElementById("budgetMonth"),
  budgetCategory: document.getElementById("budgetCategory"),
  budgetAmount: document.getElementById("budgetAmount"),
  budgetCarryOver: document.getElementById("budgetCarryOver"),
  budgetNote: document.getElementById("budgetNote"),
  budgetModalTitle: document.getElementById("budgetModalTitle"),
  savingsTargetForm: document.getElementById("savingsTargetForm"),
  savingsTargetId: document.getElementById("savingsTargetId"),
  savingsTargetMonth: document.getElementById("savingsTargetMonth"),
  savingsTargetAmount: document.getElementById("savingsTargetAmount"),
  savingsTargetNote: document.getElementById("savingsTargetNote"),
  savingsTargetModalTitle: document.getElementById("savingsTargetModalTitle"),
  flowTransactionForm: document.getElementById("flowTransactionForm"),
  flowTransactionId: document.getElementById("flowTransactionId"),
  flowType: document.getElementById("flowType"),
  flowDate: document.getElementById("flowDate"),
  flowAmount: document.getElementById("flowAmount"),
  flowWallet: document.getElementById("flowWallet"),
  flowCategory: document.getElementById("flowCategory"),
  flowDescription: document.getElementById("flowDescription"),
  flowNote: document.getElementById("flowNote"),
  transferForm: document.getElementById("transferForm"),
  transferId: document.getElementById("transferId"),
  transferFromWallet: document.getElementById("transferFromWallet"),
  transferToWallet: document.getElementById("transferToWallet"),
  transferDate: document.getElementById("transferDate"),
  transferAmount: document.getElementById("transferAmount"),
  transferDescription: document.getElementById("transferDescription"),
  transactionModalTitle: document.getElementById("transactionModalTitle"),
  debtForm: document.getElementById("debtForm"),
  debtId: document.getElementById("debtId"),
  debtType: document.getElementById("debtType"),
  debtName: document.getElementById("debtName"),
  debtAmount: document.getElementById("debtAmount"),
  debtWalletId: document.getElementById("debtWalletId"),
  debtWalletLabel: document.getElementById("debtWalletLabel"),
  debtDate: document.getElementById("debtDate"),
  debtNote: document.getElementById("debtNote"),
  debtModalTitle: document.getElementById("debtModalTitle"),
  paymentForm: document.getElementById("paymentForm"),
  paymentMode: document.getElementById("paymentMode"),
  paymentId: document.getElementById("paymentId"),
  paymentDebtId: document.getElementById("paymentDebtId"),
  paymentWalletId: document.getElementById("paymentWalletId"),
  paymentWalletLabel: document.getElementById("paymentWalletLabel"),
  paymentAmount: document.getElementById("paymentAmount"),
  paymentDate: document.getElementById("paymentDate"),
  paymentModalTitle: document.getElementById("paymentModalTitle"),
  paymentSubmitButton: document.getElementById("paymentSubmitButton"),
  debtDetailContent: document.getElementById("debtDetailContent"),
  profileForm: document.getElementById("profileForm"),
  profileName: document.getElementById("profileName"),
  profileEmail: document.getElementById("profileEmail"),
  passwordForm: document.getElementById("passwordForm"),
  currentPassword: document.getElementById("currentPassword"),
  newPassword: document.getElementById("newPassword"),
  confirmPassword: document.getElementById("confirmPassword"),
  securityPanel: document.getElementById("securityPanel"),
  securityActivityList: document.getElementById("securityActivityList"),
  systemInfoPanel: document.getElementById("systemInfoPanel"),
  exportDataButton: document.getElementById("exportDataButton"),
  exportExcelButton: document.getElementById("exportExcelButton"),
  exportPdfButton: document.getElementById("exportPdfButton"),
  importDataInput: document.getElementById("importDataInput"),
  importDataButton: document.getElementById("importDataButton"),
  backupNowButton: document.getElementById("backupNowButton"),
  deleteAccountForm: document.getElementById("deleteAccountForm"),
  deleteAccountPassword: document.getElementById("deleteAccountPassword"),
  profileStatus: document.getElementById("profileStatus"),
  calculatorDisplay: document.getElementById("calculatorDisplay"),
  calculatorGrid: document.getElementById("calculatorGrid"),
};

function persistUiState() {
  const uiState = {
    theme: state.theme,
    activeView: state.activeView,
    sidebarCollapsed: state.sidebarCollapsed,
    showAmounts: state.showAmounts,
    filters: state.filters,
  };
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(uiState));
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || "Permintaan gagal.");
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

function clearAppData() {
  state.authUser = null;
  state.wallets = [];
  state.categories = [];
  state.assets = [];
  state.budgets = [];
  state.savingsTargets = [];
  state.transactions = [];
  state.debts = [];
  state.systemInfo = null;
  state.isLoading = false;
  state.activeTransactionDetailId = null;
  state.activeDebtActionId = null;
  state.activeDebtDetailId = null;
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => modal.classList.add("hidden"));
  elements.modalBackdrop.classList.add("hidden");
  if (confirmModalResolver) {
    const resolver = confirmModalResolver;
    confirmModalResolver = null;
    resolver(false);
  }
}

async function loadStateFromApi() {
  state.isLoading = true;
  render();
  try {
    const data = await apiRequest("/api/state");
    state = {
      ...state,
      ...data,
      isLoading: false,
    };
  } catch (error) {
    state.isLoading = false;
    throw error;
  }
}

async function loadAuthUser() {
  try {
    const data = await apiRequest("/api/auth/me");
    state.authUser = data ? data.user : null;
  } catch (error) {
    if (error?.status === 401) {
      state.authUser = null;
      return null;
    }
    throw error;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatAmount(value) {
  return state.showAmounts ? formatCurrency(value) : "Rp ******";
}

function parseAmountInput(value) {
  if (typeof value === "number") return value;
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");
  const amount = Number(normalized || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatAmountInputValue(value) {
  const amount = parseAmountInput(value);
  if (!amount) return "";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(amount);
}

function setAmountInputValue(input, value) {
  if (!input) return;
  input.value = formatAmountInputValue(value);
}

function setupAmountInputFormatters() {
  const inputs = [
    elements.walletBalance,
    elements.assetCurrentValue,
    elements.assetPurchaseValue,
    elements.budgetAmount,
    elements.savingsTargetAmount,
    elements.flowAmount,
    elements.transferAmount,
    elements.debtAmount,
    elements.paymentAmount,
  ].filter(Boolean);

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      const cursorWasAtEnd = input.selectionStart === input.value.length;
      input.value = formatAmountInputValue(input.value);
      if (cursorWasAtEnd) input.setSelectionRange(input.value.length, input.value.length);
    });
    input.addEventListener("blur", () => {
      input.value = formatAmountInputValue(input.value);
    });
  });
}
const assetTypeMeta = {
  cash_equivalent: { label: "Kas & Setara Kas", icon: "💵", tone: "primary" },
  gold: { label: "Emas", icon: "🪙", tone: "warning" },
  investment: { label: "Investasi", icon: "📈", tone: "success" },
  property: { label: "Properti", icon: "🏠", tone: "primary" },
  vehicle: { label: "Kendaraan", icon: "🚗", tone: "danger" },
  business: { label: "Bisnis", icon: "🏢", tone: "success" },
  gadget: { label: "Gadget", icon: "📱", tone: "primary" },
  other: { label: "Lainnya", icon: "📦", tone: "primary" },
};

function createAnimatedMetric(value, format = "currency", className = "stat-value") {
  const displayValue = format === "currency" ? formatAmount(value) : state.showAmounts ? `${Math.round(Number(value || 0))}%` : "******";

  return `
    <div class="${className} animated-number" data-format="${format}" data-value="${Number(value || 0)}">
      ${displayValue}
    </div>
  `;
}

function getVisibilityIcon() {
  if (state.showAmounts) {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 3l18 18"></path>
      <path d="M10.6 6.3A11.5 11.5 0 0 1 12 6c6.4 0 10 6 10 6a18.7 18.7 0 0 1-4.1 4.8"></path>
      <path d="M6.7 6.8C3.9 8.7 2 12 2 12a18.2 18.2 0 0 0 7.3 5.7"></path>
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
    </svg>
  `;
}

function normalizeDate(dateValue) {
  return dateValue || todayISO;
}

function getWalletById(id) {
  return state.wallets.find((item) => item.id === id);
}

function getCategoryById(id) {
  return state.categories.find((item) => item.id === id);
}

function getAssetById(id) {
  return state.assets.find((item) => item.id === id);
}

function getAssetTypeMeta(type) {
  return assetTypeMeta[type] || assetTypeMeta.other;
}

function isDateBetween(dateValue, start, end) {
  if (start && dateValue < start) return false;
  if (end && dateValue > end) return false;
  return true;
}

function getWalletComputedBalance(walletId) {
  const wallet = getWalletById(walletId);
  if (!wallet) return 0;
  return state.transactions.reduce((total, item) => {
    if (item.type === "income" && item.walletId === walletId) return total + item.amount;
    if (item.type === "expense" && item.walletId === walletId) return total - item.amount;
    if (item.type === "transfer" && item.fromWalletId === walletId) return total - item.amount;
    if (item.type === "transfer" && item.toWalletId === walletId) return total + item.amount;
    return total;
  }, wallet.balance || 0);
}

function getWalletTotalBalance() {
  return state.wallets.reduce((sum, wallet) => sum + getWalletComputedBalance(wallet.id), 0);
}

function getDashboardTransactions() {
  const filters = state.filters.dashboard;
  if (filters.mode === "month") {
    return state.transactions.filter((item) => item.date.startsWith(filters.month));
  }
  return state.transactions.filter((item) => isDateBetween(item.date, filters.start, filters.end));
}

function getLastDateOfMonth(monthValue) {
  if (!monthValue) return todayISO;
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month, 0).toISOString().slice(0, 10);
}

function getDashboardBalanceCutoff() {
  const filters = state.filters.dashboard;
  if (filters.mode === "month") {
    return getLastDateOfMonth(filters.month || currentMonth);
  }
  return filters.end || todayISO;
}

function getDashboardPeriodNet(transactions) {
  return transactions.reduce((acc, item) => {
    if (item.type === "income") acc += item.amount;
    if (item.type === "expense") acc -= item.amount;
    return acc;
  }, 0);
}

function getBalanceUpToDate(cutoffDate) {
  return state.wallets.reduce((sum, wallet) => {
    const walletTransactions = state.transactions.reduce((total, item) => {
      if (item.date > cutoffDate) return total;
      if (item.type === "income" && item.walletId === wallet.id) return total + item.amount;
      if (item.type === "expense" && item.walletId === wallet.id) return total - item.amount;
      if (item.type === "transfer" && item.fromWalletId === wallet.id) return total - item.amount;
      if (item.type === "transfer" && item.toWalletId === wallet.id) return total + item.amount;
      return total;
    }, 0);
    return sum + (wallet.balance || 0) + walletTransactions;
  }, 0);
}

function getFilteredTransactions() {
  const filters = state.filters.transactions;
  return state.transactions
    .filter((item) => {
      if (filters.dateMode === "month") {
        return item.date.startsWith(filters.month || currentMonth);
      }
      if (filters.dateMode === "custom") {
        return isDateBetween(item.date, filters.start, filters.end);
      }
      return true;
    })
    .filter((item) => filters.type === "all" || item.type === filters.type)
    .filter((item) => {
      if (filters.wallet === "all") return true;
      if (item.type === "transfer") {
        return item.fromWalletId === filters.wallet || item.toWalletId === filters.wallet;
      }
      return item.walletId === filters.wallet;
    })
    .filter((item) => {
      if (filters.category === "all") return true;
      if (item.type === "transfer") return filters.category === "transfer";
      return item.categoryId === filters.category;
    })
    .filter((item) => {
      const query = (filters.search || "").trim().toLowerCase();
      if (!query) return true;
      const walletLabel = item.type === "transfer" ? `${getWalletById(item.fromWalletId)?.name || ""} ${getWalletById(item.toWalletId)?.name || ""}` : getWalletById(item.walletId)?.name || "";
      const categoryLabel = item.type === "transfer" ? "transfer" : getCategoryById(item.categoryId)?.name || "";
      const haystack = [item.description || "", item.note || "", walletLabel, categoryLabel, item.date].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getFilteredAssets() {
  const filters = state.filters.assets;
  return state.assets.filter((item) => filters.type === "all" || item.type === filters.type).sort((a, b) => Number(b.currentValue || 0) - Number(a.currentValue || 0));
}

function getBudgetMonthValue() {
  return state.filters.budgeting.month || currentMonth;
}

function getExpenseCategories() {
  return state.categories.filter((item) => item.type === "expense");
}

function getBudgetUsageByCategory(month, categoryId) {
  return state.transactions.filter((item) => item.type === "expense" && item.categoryId === categoryId && item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
}

function getPreviousMonth(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const previous = new Date(year, month - 2, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

function getBudgetForMonthAndCategory(month, categoryId) {
  return state.budgets.find((item) => item.month === month && item.categoryId === categoryId) || null;
}

function getBudgetCarryOverAmount(month, categoryId, seen = new Set()) {
  const key = `${month}:${categoryId}`;
  if (seen.has(key)) return 0;
  seen.add(key);
  const previousMonth = getPreviousMonth(month);
  const previousBudget = getBudgetForMonthAndCategory(previousMonth, categoryId);
  if (!previousBudget || !previousBudget.carryOverEnabled) return 0;
  const previousCarry = getBudgetCarryOverAmount(previousMonth, categoryId, seen);
  const previousSpent = getBudgetUsageByCategory(previousMonth, categoryId);
  const previousLeftover = Number(previousBudget.amount || 0) + previousCarry - previousSpent;
  return previousLeftover > 0 ? previousLeftover : 0;
}

function getBudgetEffectiveAmount(budget) {
  return Number(budget.amount || 0) + getBudgetCarryOverAmount(budget.month, budget.categoryId);
}

function getSavingsTargetForMonth(month) {
  return state.savingsTargets.find((item) => item.month === month) || null;
}

function formatTransactionGroupDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(`${date}T00:00:00`))
    .toUpperCase();
}

function getTransactionTypeLabel(type) {
  if (type === "income") return "Pemasukan";
  if (type === "expense") return "Pengeluaran";
  return "Transfer";
}

function getTransactionVisualMeta(item) {
  if (item.type === "income") {
    return {
      icon: "+",
      toneClass: "income",
      amountClass: "text-success",
      prefix: "+",
    };
  }
  if (item.type === "expense") {
    return {
      icon: "-",
      toneClass: "expense",
      amountClass: "text-danger",
      prefix: "-",
    };
  }
  return {
    icon: "<->",
    toneClass: "transfer",
    amountClass: "text-soft",
    prefix: "",
  };
}

function createTransactionInlineDetail(item) {
  const amountClass = item.type === "expense" ? "text-danger" : item.type === "income" ? "text-success" : "text-soft";
  const rows =
    item.type === "transfer"
      ? [
          ["Dari", getWalletById(item.fromWalletId)?.name || "-"],
          ["Ke", getWalletById(item.toWalletId)?.name || "-"],
          ["Waktu", item.date],
          ["Catatan", item.description || "-"],
        ]
      : [
          ["Wallet", getWalletById(item.walletId)?.name || "-"],
          ["Kategori", getCategoryById(item.categoryId)?.name || "-"],
          ["Waktu", item.date],
          ["Catatan", item.note || item.description || "-"],
        ];

  return `
    <div class="transaction-inline-detail grid gap-4">
      <div class="transaction-inline-grid">
        ${rows
          .map(
            ([label, value]) => `
          <div class="transaction-inline-row">
            <span class="transaction-inline-label">${label}</span>
            <strong class="transaction-inline-value ${label === "Catatan" ? "is-note" : ""} ${label === "Jumlah" ? amountClass : ""}">${value}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="transaction-inline-actions">
        <button class="ghost-btn transaction-detail-btn" data-edit-transaction="${item.id}" type="button">Ubah</button>
        <button class="ghost-btn transaction-detail-btn danger-text" data-delete-transaction="${item.id}" type="button">Hapus</button>
      </div>
    </div>
  `;
}

function createStatCard(label, value, tone) {
  return `
    <article class="stat-card ${tone} rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <p class="eyebrow">${label}</p>
      ${createAnimatedMetric(value, "currency", "stat-value")}
    </article>
  `;
}

function createTransactionChart(transactions) {
  if (!transactions.length) {
    return `<div class="empty-state">Belum ada transaksi pada rentang ini.</div>`;
  }

  const grouped = {};
  transactions.forEach((item) => {
    grouped[item.date] = (grouped[item.date] || 0) + (item.type === "expense" ? -item.amount : item.amount);
  });
  const entries = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(...entries.map(([, value]) => Math.abs(value)), 1);
  const barWidth = 60;
  const gap = 20;
  const height = 220;
  const baseLine = 110;
  const svgWidth = Math.max(entries.length * (barWidth + gap) + 40, 320);

  return `
    <svg class="chart-svg" viewBox="0 0 ${svgWidth} ${height + 20}" preserveAspectRatio="xMidYMid meet">
      <line x1="12" y1="${baseLine}" x2="${svgWidth - 12}" y2="${baseLine}" stroke="var(--line)"></line>
      ${entries
        .map(([date, value], index) => {
          const x = 20 + index * (barWidth + gap);
          const barHeight = (Math.abs(value) / max) * 90;
          const y = value >= 0 ? baseLine - barHeight : baseLine;
          const color = value >= 0 ? "var(--success)" : "var(--danger)";
          return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="14" fill="${color}" opacity="0.85"></rect>
          <text x="${x + barWidth / 2}" y="${height}" text-anchor="middle" class="bar-label">${date.slice(5)}</text>
        `;
        })
        .join("")}
    </svg>
  `;
}

function createCategoryChart(transactions) {
  const expenseTransactions = transactions.filter((item) => item.type === "expense");
  if (!expenseTransactions.length) {
    return `<div class="empty-state">Belum ada pengeluaran untuk divisualisasikan.</div>`;
  }

  const totals = {};
  expenseTransactions.forEach((item) => {
    const category = getCategoryById(item.categoryId)?.name || "Tanpa Kategori";
    totals[category] = (totals[category] || 0) + item.amount;
  });

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const palette = ["#4cc9f0", "#38b67a", "#f8b84e", "#ef5350", "#7bdff2", "#97f9f9"];
  let offset = 0;

  return `
    <div style="display:grid;grid-template-columns:200px 1fr;gap:18px;align-items:center;width:100%;">
      <svg viewBox="0 0 180 180" style="width:180px;height:180px;">
        <circle cx="90" cy="90" r="60" fill="transparent" stroke="rgba(255,255,255,0.08)" stroke-width="18"></circle>
        ${entries
          .map(([, value], index) => {
            const ratio = value / total;
            const length = ratio * 377;
            const dash = `${length} ${377 - length}`;
            const segment = `
            <circle cx="90" cy="90" r="60" fill="transparent" stroke="${palette[index % palette.length]}" stroke-width="18"
              stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)" />
          `;
            offset += length;
            return segment;
          })
          .join("")}
        <text x="90" y="86" text-anchor="middle" fill="var(--muted)" font-size="12">Pengeluaran</text>
        <text x="90" y="108" text-anchor="middle" fill="var(--text)" font-size="16" font-weight="700">${entries.length} Kategori</text>
      </svg>
      <div class="stack-list">
        ${entries
          .map(
            ([label, value], index) => `
          <div class="list-item">
            <div class="card-actions">
              <span style="width:12px;height:12px;border-radius:999px;background:${palette[index % palette.length]};display:inline-block;"></span>
              <strong>${label}</strong>
            </div>
            <span>${Math.round((value / total) * 100)}%</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function createAssetCompositionChart(assets) {
  if (!assets.length) {
    return `<div class="empty-state">Belum ada aset untuk divisualisasikan.</div>`;
  }

  const totals = {};
  assets.forEach((asset) => {
    const label = getAssetTypeMeta(asset.type).label;
    totals[label] = (totals[label] || 0) + Number(asset.currentValue || 0);
  });

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const palette = ["#4cc9f0", "#38b67a", "#f8b84e", "#ef5350", "#7bdff2", "#97f9f9", "#7aa2ff", "#c0f36b"];
  let offset = 0;

  return `
    <div style="display:grid;grid-template-columns:200px 1fr;gap:18px;align-items:center;width:100%;">
      <svg viewBox="0 0 180 180" style="width:180px;height:180px;">
        <circle cx="90" cy="90" r="60" fill="transparent" stroke="rgba(255,255,255,0.08)" stroke-width="18"></circle>
        ${entries
          .map(([, value], index) => {
            const ratio = value / total;
            const length = ratio * 377;
            const dash = `${length} ${377 - length}`;
            const segment = `
            <circle cx="90" cy="90" r="60" fill="transparent" stroke="${palette[index % palette.length]}" stroke-width="18"
              stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 90 90)" />
          `;
            offset += length;
            return segment;
          })
          .join("")}
        <text x="90" y="86" text-anchor="middle" fill="var(--muted)" font-size="12">Portfolio</text>
        <text x="90" y="108" text-anchor="middle" fill="var(--text)" font-size="16" font-weight="700">${entries.length} Jenis</text>
      </svg>
      <div class="stack-list">
        ${entries
          .map(
            ([label, value], index) => `
          <div class="list-item">
            <div class="card-actions">
              <span style="width:12px;height:12px;border-radius:999px;background:${palette[index % palette.length]};display:inline-block;"></span>
              <strong>${label}</strong>
            </div>
            <span>${Math.round((value / total) * 100)}%</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function createAssetHistoryChart(assets) {
  const totalsByDate = {};
  assets.forEach((asset) => {
    (asset.history || []).forEach((point) => {
      totalsByDate[point.recordDate] = (totalsByDate[point.recordDate] || 0) + Number(point.value || 0);
    });
  });

  const entries = Object.entries(totalsByDate).sort((a, b) => a[0].localeCompare(b[0]));
  if (!entries.length) {
    return `<div class="empty-state">Histori nilai aset akan muncul setelah aset diperbarui dari waktu ke waktu.</div>`;
  }

  const width = Math.max(entries.length * 110, 320);
  const height = 220;
  const paddingX = 24;
  const paddingY = 24;
  const min = Math.min(...entries.map(([, value]) => value));
  const max = Math.max(...entries.map(([, value]) => value));
  const range = Math.max(max - min, 1);
  const points = entries.map(([date, value], index) => {
    const x = paddingX + index * ((width - paddingX * 2) / Math.max(entries.length - 1, 1));
    const y = height - paddingY - ((value - min) / range) * (height - paddingY * 2);
    return { date, value, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height + 28}" preserveAspectRatio="xMidYMid meet">
      <path d="${path}" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points
        .map(
          (point) => `
        <circle cx="${point.x}" cy="${point.y}" r="5.5" fill="var(--panel-strong)" stroke="var(--primary)" stroke-width="3"></circle>
        <text x="${point.x}" y="${height + 18}" text-anchor="middle" class="bar-label">${point.date.slice(5)}</text>
      `,
        )
        .join("")}
    </svg>
  `;
}

function createDebtSummaryCard(title, items) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const paid = items.reduce((sum, item) => sum + item.payments.reduce((acc, payment) => acc + payment.amount, 0), 0);
  return `
    <article class="panel rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <p class="eyebrow">${title}</p>
      ${createAnimatedMetric(total, "currency", "money")}
      <p class="mt-3 text-sm font-medium text-slate-300">Terbayar ${formatAmount(paid)} dari ${items.length} data.</p>
    </article>
  `;
}

function getDebtPaidAmount(item) {
  return item.payments.reduce((sum, payment) => sum + payment.amount, 0);
}

function getDebtRemainingAmount(item) {
  return Math.max(item.amount - getDebtPaidAmount(item), 0);
}

function getFilteredDebts() {
  const status = state.filters?.debts?.status || "all";
  return state.debts.filter((item) => {
    const remaining = getDebtRemainingAmount(item);
    const isPaid = remaining <= 0;
    const isOverdue = remaining > 0 && item.date < todayISO;

    if (status === "all") return true;
    if (status === "debt") return item.type === "debt";
    if (status === "receivable") return item.type === "receivable";
    if (status === "paid") return isPaid;
    if (status === "unpaid") return !isPaid;
    if (status === "overdue") return isOverdue;
    return true;
  });
}

function createInsightCard(label, value, caption) {
  return `
    <article class="stat-card rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <p class="eyebrow">${label}</p>
      <div class="stat-value" style="font-size:1.2rem;">${value}</div>
      <p style="color:var(--muted);margin-top:10px;">${caption}</p>
    </article>
  `;
}

function createInsightMetricCard(label, value, format, caption) {
  return `
    <article class="stat-card rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <p class="eyebrow">${label}</p>
      ${createAnimatedMetric(value, format, "stat-value")}
      <p style="color:var(--muted);margin-top:10px;">${caption}</p>
    </article>
  `;
}

function createEmptyState(title, description) {
  return `
    <div class="empty-state premium-empty panel rounded-[24px] border border-dashed border-white/10 bg-slate-900/40 px-6 py-10 text-center">
      <div class="empty-orb"></div>
      <strong>${title}</strong>
      <p>${description}</p>
    </div>
  `;
}

function createBudgetSummaryCard(label, value, tone, caption) {
  return `
    <article class="stat-card ${tone} rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <p class="eyebrow">${label}</p>
      ${createAnimatedMetric(value, "currency", "stat-value")}
      <p class="mt-3 text-sm font-medium text-slate-300">${caption}</p>
    </article>
  `;
}

function createBudgetInsightCard(label, value, caption, tone = "primary") {
  return `
    <article class="stat-card ${tone} rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <p class="eyebrow">${label}</p>
      <div class="stat-value" style="font-size:1.2rem;">${value}</div>
      <p class="mt-3 text-sm font-medium text-slate-300">${caption}</p>
    </article>
  `;
}

function createSkeletonCards(count, className = "") {
  return Array.from(
    { length: count },
    () => `
    <article class="skeleton-card ${className}">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line strong"></div>
      <div class="skeleton-line medium"></div>
    </article>
  `,
  ).join("");
}

function createSkeletonList(count) {
  return Array.from(
    { length: count },
    () => `
    <div class="skeleton-list-item">
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
    </div>
  `,
  ).join("");
}

function createSkeletonRows(count) {
  return Array.from(
    { length: count },
    () => `
    <tr class="skeleton-row">
      <td colspan="5">
        <div class="skeleton-table-card">
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      </td>
    </tr>
  `,
  ).join("");
}

function renderDashboard() {
  if (state.isLoading) {
    elements.dashboardStats.innerHTML = createSkeletonCards(1, "consolidated-card col-span-full w-full");
    elements.transactionChart.innerHTML = createEmptyState("Memuat grafik transaksi", "Sebentar ya, data sedang disiapkan.");
    elements.categoryChart.innerHTML = createEmptyState("Memuat grafik kategori", "Insight kategori akan muncul setelah data selesai diambil.");
    elements.dashboardInsights.innerHTML = createSkeletonCards(4);
    return;
  }

  const transactions = getDashboardTransactions();
  const summary = transactions.reduce(
    (acc, item) => {
      if (item.type === "income") acc.income += item.amount;
      if (item.type === "expense") acc.expense += item.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
  summary.net = summary.income - summary.expense;
  summary.balance = state.filters.dashboard.balanceMode === "running" ? getBalanceUpToDate(getDashboardBalanceCutoff()) : getDashboardPeriodNet(transactions);
  const balanceLabel = state.filters.dashboard.balanceMode === "running" ? "Saldo Berjalan" : "Saldo Periode";

  elements.dashboardStats.innerHTML = `
    <article class="stat-card consolidated-summary-card col-span-full w-full rounded-[24px] sm:rounded-[28px] border border-white/10 bg-slate-900/70 p-4 sm:p-6 md:p-7 shadow-2xl backdrop-blur-xl">
      <div class="summary-top-row flex flex-row items-center justify-between gap-3 mb-3 sm:mb-4">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0"></span>
            <p class="eyebrow mb-0 text-xs sm:text-sm truncate">${balanceLabel}</p>
          </div>
          ${createAnimatedMetric(summary.balance, "currency", "stat-value text-2xl sm:text-3xl md:text-4xl font-black text-cyan-400 leading-tight tracking-tight break-words")}
        </div>
        <div class="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wide flex-shrink-0">
          Akumulasi Utama
        </div>
      </div>

      <div class="my-3 sm:my-4 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div class="summary-bottom-row grid grid-cols-2 gap-2.5 sm:gap-4">
        <div class="income-block rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 transition hover:bg-emerald-500/15 min-w-0">
          <div class="flex items-center gap-1.5 sm:gap-2 mb-1 min-w-0">
            <span class="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </span>
            <p class="text-[11px] sm:text-xs font-bold text-emerald-300 truncate">Total Pemasukan</p>
          </div>
          ${createAnimatedMetric(summary.income, "currency", "stat-value text-base sm:text-lg md:text-xl font-extrabold text-emerald-400 truncate")}
        </div>

        <div class="expense-block rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 sm:p-4 transition hover:bg-rose-500/15 min-w-0">
          <div class="flex items-center gap-1.5 sm:gap-2 mb-1 min-w-0">
            <span class="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              <svg class="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
            </span>
            <p class="text-[11px] sm:text-xs font-bold text-rose-300 truncate">Total Pengeluaran</p>
          </div>
          ${createAnimatedMetric(summary.expense, "currency", "stat-value text-base sm:text-lg md:text-xl font-extrabold text-rose-400 truncate")}
        </div>
      </div>
    </article>
  `;

  elements.transactionChart.innerHTML = createTransactionChart(transactions);
  elements.categoryChart.innerHTML = createCategoryChart(transactions);
  renderDashboardInsights(transactions, summary);
}

function renderDashboardInsights(transactions, summary) {
  const expenseByCategory = {};
  const walletUsage = {};

  transactions.forEach((item) => {
    if (item.type === "expense") {
      const categoryName = getCategoryById(item.categoryId)?.name || "Tanpa Kategori";
      expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + item.amount;
    }

    if (item.type === "transfer") {
      const fromWallet = getWalletById(item.fromWalletId)?.name || "Transfer";
      walletUsage[fromWallet] = (walletUsage[fromWallet] || 0) + item.amount;
    } else {
      const walletName = getWalletById(item.walletId)?.name || "Wallet";
      walletUsage[walletName] = (walletUsage[walletName] || 0) + item.amount;
    }
  });

  const topCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  const topWallet = Object.entries(walletUsage).sort((a, b) => b[1] - a[1])[0];
  const savingsRate = summary.income > 0 ? Math.round((summary.net / summary.income) * 100) : 0;
  const isRunningBalance = state.filters.dashboard.balanceMode === "running";
  const savingsRateLabel = isRunningBalance ? "Saving Rate Periode" : "Saving Rate";
  const savingsRateCaption = isRunningBalance
    ? summary.income
      ? "Rasio ini tetap dihitung dari net transaksi pada periode aktif, sementara kartu saldo utama bersifat akumulatif."
      : "Belum ada pemasukan pada periode aktif untuk menghitung rasio periode."
    : summary.income
      ? "Persentase saldo periode terhadap pemasukan pada periode aktif."
      : "Belum ada pemasukan pada periode ini.";
  const debtRemaining = state.debts.filter((item) => item.type === "debt").reduce((sum, item) => sum + Math.max(item.amount - item.payments.reduce((acc, payment) => acc + payment.amount, 0), 0), 0);

  elements.dashboardInsights.innerHTML = [
    createInsightMetricCard(savingsRateLabel, savingsRate, "percent", savingsRateCaption),
    createInsightCard("Kategori Terbesar", topCategory ? topCategory[0] : "-", topCategory ? formatAmount(topCategory[1]) : "Belum ada pengeluaran tercatat."),
    createInsightCard("Wallet Tersibuk", topWallet ? topWallet[0] : "-", topWallet ? formatAmount(topWallet[1]) : "Belum ada aktivitas wallet."),
    createInsightMetricCard("Sisa Hutang", debtRemaining, "currency", debtRemaining ? "Total sisa hutang yang belum lunas." : "Tidak ada hutang aktif."),
  ].join("");

  animateNumbers(elements.dashboardStats);
  animateNumbers(elements.dashboardInsights);
}

function renderWallets() {
  if (state.isLoading) {
    elements.walletGrid.innerHTML = createSkeletonCards(3, "wallet-card");
    return;
  }

  if (!state.wallets.length) {
    elements.walletGrid.innerHTML = createEmptyState("Belum ada wallet", "Tambahkan wallet pertama kamu untuk mulai mencatat saldo dan transaksi.");
    return;
  }

  elements.walletGrid.innerHTML = state.wallets
    .map(
      (wallet) => `
    <article class="wallet-card rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl">
      <div class="wallet-card-header">
        <div>
          <p class="eyebrow">Wallet Aktif</p>
          <h4>${wallet.name}</h4>
        </div>
        <div class="card-actions">
          <button class="icon-btn" data-edit-wallet="${wallet.id}" type="button">Edit</button>
          <button class="icon-btn" data-delete-wallet="${wallet.id}" type="button">Delete</button>
        </div>
      </div>
      <div class="wallet-card-body">
        <p class="eyebrow">Saldo Sekarang</p>
        ${createAnimatedMetric(getWalletComputedBalance(wallet.id), "currency", "money")}
      </div>
    </article>
  `,
    )
    .join("");

  animateNumbers(elements.walletGrid);
}

function renderAssets() {
  if (state.isLoading) {
    elements.assetSummary.innerHTML = createSkeletonCards(3);
    elements.assetCompositionChart.innerHTML = createEmptyState("Memuat komposisi aset", "Grafik portfolio sedang disiapkan.");
    elements.assetHistoryChart.innerHTML = createEmptyState("Memuat histori aset", "Tren nilai aset sedang disiapkan.");
    elements.assetList.innerHTML = createSkeletonCards(3, "asset-card");
    return;
  }

  const assets = getFilteredAssets();
  const totalAssets = state.assets.reduce((sum, item) => sum + Number(item.currentValue || 0), 0);
  const visibleTotal = assets.reduce((sum, item) => sum + Number(item.currentValue || 0), 0);
  const totalGrowth = assets.reduce((sum, item) => sum + (Number(item.currentValue || 0) - Number(item.purchaseValue || 0)), 0);
  const largestAsset = [...assets].sort((a, b) => Number(b.currentValue || 0) - Number(a.currentValue || 0))[0];
  const totalDebtRemaining = state.debts.filter((item) => item.type === "debt").reduce((sum, item) => sum + getDebtRemainingAmount(item), 0);
  const netWorth = visibleTotal - totalDebtRemaining;

  elements.assetSummary.innerHTML = [
    createStatCard("Total Nilai Aset", visibleTotal, "primary"),
    createStatCard("Kekayaan Bersih", netWorth, netWorth >= 0 ? "success" : "danger"),
    createInsightCard("Aset Terbesar", largestAsset?.name || "-", largestAsset ? formatAmount(largestAsset.currentValue) : "Belum ada aset tersimpan."),
  ].join("");

  elements.assetCompositionChart.innerHTML = createAssetCompositionChart(assets);
  elements.assetHistoryChart.innerHTML = createAssetHistoryChart(assets);

  if (!assets.length) {
    elements.assetList.innerHTML = createEmptyState("Belum ada aset", "Tambahkan aset seperti emas, investasi, properti, atau kendaraan supaya portfolio kamu lebih lengkap.");
    animateNumbers(elements.assetSummary);
    return;
  }

  elements.assetList.innerHTML = assets
    .map((asset) => {
      const meta = getAssetTypeMeta(asset.type);
      const currentValue = Number(asset.currentValue || 0);
      const purchaseValue = Number(asset.purchaseValue || 0);
      const growthValue = currentValue - purchaseValue;
      const share = totalAssets > 0 ? Math.round((currentValue / totalAssets) * 100) : 0;
      return `
      <article class="asset-card rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex items-start gap-4">
            <span class="asset-icon asset-tone-${meta.tone}">${meta.icon}</span>
          <div class="grid gap-2">
            <div class="flex flex-wrap items-center gap-3">
              <h4 class="text-xl font-bold text-slate-100">${asset.name}</h4>
              <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">${meta.label}</span>
            </div>
            <p class="text-sm text-slate-300">${asset.note || "Aset ini tersimpan sebagai bagian dari portfolio pribadi kamu."}</p>
            <div class="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>${getWalletById(asset.walletId)?.name || "Tanpa Dompet"}</span>
              <span>${asset.accountName || "Tanpa Akun"}</span>
            </div>
          </div>
        </div>
          <div class="card-actions">
            <button class="icon-btn" data-edit-asset="${asset.id}" type="button">Edit</button>
            <button class="icon-btn" data-delete-asset="${asset.id}" type="button">Delete</button>
          </div>
        </div>
        <div class="mt-5 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <div class="asset-visual rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div class="flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>Porsi di portfolio</span>
              <strong class="text-slate-100">${share}%</strong>
            </div>
            <div class="progress-track mt-3">
              <div class="progress-bar" style="width:${Math.min(share, 100)}%"></div>
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <div class="rounded-[20px] border border-white/10 bg-slate-950/30 px-4 py-4">
                <p class="eyebrow">Nilai Saat Ini</p>
                ${createAnimatedMetric(currentValue, "currency", "money")}
              </div>
              <div class="rounded-[20px] border border-white/10 bg-slate-950/30 px-4 py-4">
                <p class="eyebrow">Nilai Beli</p>
                ${createAnimatedMetric(purchaseValue, "currency", "money")}
              </div>
            </div>
          </div>
          <div class="grid gap-3">
            <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p class="eyebrow">Perubahan Nilai</p>
              ${createAnimatedMetric(growthValue, "currency", `money ${growthValue >= 0 ? "text-success" : "text-danger"}`)}
            </div>
            <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p class="eyebrow">Tanggal Perolehan</p>
              <strong class="text-base font-semibold text-slate-100">${asset.acquiredDate || "-"}</strong>
            </div>
            <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p class="eyebrow">Status</p>
              <strong class="text-base font-semibold ${growthValue >= 0 ? "text-emerald-300" : "text-rose-300"}">${growthValue >= 0 ? "Bertumbuh" : "Turun Nilai"}</strong>
            </div>
            <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p class="eyebrow">Akun</p>
              <strong class="text-base font-semibold text-slate-100">${asset.accountName || "-"}</strong>
            </div>
            <div class="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <p class="eyebrow">Snapshot Histori</p>
              <strong class="text-base font-semibold text-slate-100">${(asset.history || []).length} titik nilai</strong>
            </div>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  animateNumbers(elements.assetSummary);
  animateNumbers(elements.assetList);
}

function renderCategoryOptions() {
  const options = [`<option value="all">Semua Kategori</option>`, `<option value="transfer">Transfer</option>`];
  state.categories.forEach((category) => {
    options.push(`<option value="${category.id}">${category.name}</option>`);
  });
  elements.transactionCategoryFilter.innerHTML = options.join("");
  elements.transactionCategoryFilter.value = state.filters.transactions.category;

  const flowCategories = state.categories.filter((item) => item.type === (elements.flowType.value || "income"));
  elements.flowCategory.innerHTML = flowCategories.length ? flowCategories.map((item) => `<option value="${item.id}">${item.name}</option>`).join("") : `<option value="" disabled selected>Belum ada kategori</option>`;
}

function renderWalletOptions() {
  const walletOptions = state.wallets.length ? state.wallets.map((item) => `<option value="${item.id}">${item.name}</option>`).join("") : `<option value="" disabled selected>Belum ada wallet</option>`;
  elements.flowWallet.innerHTML = walletOptions;
  elements.transferFromWallet.innerHTML = walletOptions;
  elements.transferToWallet.innerHTML = walletOptions;
  elements.debtWalletId.innerHTML = walletOptions;
  elements.assetWalletId.innerHTML = walletOptions;
  elements.transactionWalletFilter.innerHTML = [`<option value="all">Semua Dompet</option>`, ...state.wallets.map((item) => `<option value="${item.id}">${item.name}</option>`)].join("");
  elements.transactionWalletFilter.value = state.filters.transactions.wallet;
}

function renderTransactions() {
  if (state.isLoading) {
    elements.transactionsTableBody.innerHTML = createSkeletonCards(4, "transaction-feed-skeleton");
    return;
  }

  const transactions = getFilteredTransactions();
  if (!transactions.length) {
    elements.transactionsTableBody.innerHTML = createEmptyState("Belum ada transaksi", "Coba ubah filter atau tambahkan transaksi baru untuk melihat riwayat di sini.");
    return;
  }

  const groupedTransactions = transactions.reduce((groups, item) => {
    groups[item.date] = groups[item.date] || [];
    groups[item.date].push(item);
    return groups;
  }, {});

  elements.transactionsTableBody.innerHTML = Object.entries(groupedTransactions)
    .map(
      ([date, items]) => `
    <section class="transaction-date-group space-y-3">
      <div class="transaction-date-label">${formatTransactionGroupDate(date)}</div>
      <div class="transaction-date-stack grid gap-3">
        ${items
          .map((item) => {
            const walletLabel = item.type === "transfer" ? `${getWalletById(item.fromWalletId)?.name || "-"} -> ${getWalletById(item.toWalletId)?.name || "-"}` : getWalletById(item.walletId)?.name || "-";
            const categoryLabel = item.type === "transfer" ? "Transfer" : getCategoryById(item.categoryId)?.name || "Tanpa Kategori";
            const meta = getTransactionVisualMeta(item);
            const isExpanded = state.activeTransactionDetailId === item.id;
            return `
            <article class="transaction-feed-card ${meta.toneClass} ${isExpanded ? "expanded" : ""} rounded-[28px] border border-white/10 bg-slate-900/60 p-4 shadow-2xl backdrop-blur-xl">
              <button class="transaction-feed-main" data-view-transaction="${item.id}" type="button">
                <div class="transaction-feed-icon ${meta.toneClass}">${meta.icon}</div>
                <div class="transaction-feed-copy">
                  <strong>${item.description}</strong>
                  <span class="transaction-feed-subtitle">${getTransactionTypeLabel(item.type)}</span>
                  <span class="transaction-feed-meta">${walletLabel} | ${categoryLabel}</span>
                </div>
                <div class="transaction-feed-amount ${meta.amountClass}">
                  ${meta.prefix}${formatAmount(item.amount)}
                </div>
              </button>
              <div class="transaction-detail-shell ${isExpanded ? "expanded" : ""}">
                ${createTransactionInlineDetail(item)}
              </div>
            </article>
          `;
          })
          .join("")}
      </div>
    </section>
  `,
    )
    .join("");
}

function renderCategories() {
  if (state.isLoading) {
    elements.incomeCategoryList.innerHTML = createSkeletonList(3);
    elements.expenseCategoryList.innerHTML = createSkeletonList(3);
    return;
  }

  const renderCategoryList = (type, container) => {
    const items = state.categories.filter((item) => item.type === type);
    if (!items.length) {
      container.innerHTML = createEmptyState(`Belum ada kategori ${type === "income" ? "pemasukan" : "pengeluaran"}`, `Tambahkan kategori ${type === "income" ? "pemasukan" : "pengeluaran"} supaya pencatatan lebih rapi.`);
      return;
    }
    container.innerHTML = items
      .map(
        (item) => `
      <div class="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-md">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl ${type === "income" ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}">${type === "income" ? "+" : "-"}</span>
          <div class="grid gap-1">
            <strong class="text-base font-semibold text-slate-100">${item.name}</strong>
            <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">${type === "income" ? "Pemasukan" : "Pengeluaran"}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="icon-btn" data-edit-category="${item.id}" type="button">Edit</button>
          <button class="icon-btn" data-delete-category="${item.id}" type="button">Delete</button>
        </div>
      </div>
    `,
      )
      .join("");
  };

  renderCategoryList("income", elements.incomeCategoryList);
  renderCategoryList("expense", elements.expenseCategoryList);
}

function renderBudgetCategoryOptions() {
  const categories = getExpenseCategories();
  elements.budgetCategory.innerHTML = categories.length ? categories.map((item) => `<option value="${item.id}">${item.name}</option>`).join("") : `<option value="" disabled selected>Belum ada kategori pengeluaran</option>`;
}

function renderBudgeting() {
  if (state.isLoading) {
    elements.budgetSummary.innerHTML = createSkeletonCards(3);
    elements.budgetInsights.innerHTML = createSkeletonCards(2);
    elements.budgetList.innerHTML = createSkeletonCards(3, "budget-card");
    return;
  }

  const month = getBudgetMonthValue();
  const budgets = state.budgets.filter((item) => item.month === month);
  const budgetMetrics = budgets.map((budget) => {
    const spent = getBudgetUsageByCategory(month, budget.categoryId);
    const carryOver = getBudgetCarryOverAmount(month, budget.categoryId);
    const effectiveBudget = getBudgetEffectiveAmount(budget);
    const remaining = effectiveBudget - spent;
    const percent = effectiveBudget ? Math.max(Math.round((spent / effectiveBudget) * 100), 0) : 0;
    return { budget, spent, carryOver, effectiveBudget, remaining, percent };
  });
  const totalBudget = budgetMetrics.reduce((sum, item) => sum + item.effectiveBudget, 0);
  const totalUsed = budgetMetrics.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudget - totalUsed;
  const overBudgetItems = budgetMetrics.filter((item) => item.percent > 100);
  const mostWasteful = [...budgetMetrics].sort((a, b) => b.percent - a.percent)[0];
  const savingsTarget = getSavingsTargetForMonth(month);
  const savingsTargetAmount = Number(savingsTarget?.amount || 0);
  const savingsProgress = savingsTargetAmount > 0 ? Math.min(Math.round((Math.max(totalRemaining, 0) / savingsTargetAmount) * 100), 999) : 0;

  elements.budgetSummary.innerHTML = [
    createBudgetSummaryCard("Total Budget", totalBudget, "primary", `Total anggaran yang kamu set untuk ${month}.`),
    createBudgetSummaryCard(
      "Sudah Terpakai",
      totalUsed,
      totalUsed > totalBudget ? "danger" : "success",
      totalBudget ? `${Math.min(Math.round((totalUsed / totalBudget) * 100), 999)}% dari total budget sudah dipakai.` : "Belum ada budget aktif di bulan ini.",
    ),
    createBudgetSummaryCard("Sisa Budget", totalRemaining, totalRemaining < 0 ? "danger" : "primary", totalRemaining < 0 ? "Budget bulan ini sudah terlampaui." : "Sisa ruang belanja yang masih tersedia."),
  ].join("");

  elements.budgetInsights.innerHTML = [
    createBudgetInsightCard(
      "Kategori Paling Boros",
      mostWasteful ? getCategoryById(mostWasteful.budget.categoryId)?.name || "Kategori" : "-",
      mostWasteful ? `${mostWasteful.percent}% terpakai dari budget efektif bulan ini.` : "Belum ada kategori budget aktif.",
    ),
    createBudgetInsightCard(
      "Target Tabungan",
      savingsTargetAmount ? formatAmount(savingsTargetAmount) : "Belum Diatur",
      savingsTargetAmount ? `${savingsProgress}% tercapai dari potensi sisa budget bulan ini.` : "Tambahkan target tabungan supaya sisa budget bisa diarahkan ke tujuan yang jelas.",
      savingsTargetAmount && Math.max(totalRemaining, 0) >= savingsTargetAmount ? "success" : "primary",
    ),
  ].join("");

  if (!budgets.length) {
    elements.budgetInsights.innerHTML = createBudgetInsightCard(
      "Target Tabungan",
      savingsTargetAmount ? formatAmount(savingsTargetAmount) : "Belum Diatur",
      savingsTargetAmount ? `${savingsProgress}% tercapai dari potensi sisa budget bulan ini.` : "Tambahkan target tabungan supaya sisa budget bisa diarahkan ke tujuan yang jelas.",
      savingsTargetAmount ? "primary" : "primary",
    );
    elements.budgetList.innerHTML = createEmptyState("Belum ada budget bulan ini", "Tambahkan budget per kategori pengeluaran supaya kamu bisa memantau progres pemakaian uang.");
    return;
  }

  elements.budgetList.innerHTML = budgetMetrics
    .map(({ budget, spent, carryOver, effectiveBudget, remaining, percent }) => {
      const category = getCategoryById(budget.categoryId);
      const cappedPercent = Math.min(percent, 100);
      const toneColor = percent > 100 ? "var(--danger)" : percent >= 80 ? "var(--warning)" : "var(--success)";
      const statusLabel = percent > 100 ? "Over Budget" : percent === 100 ? "Tepat Batas" : percent >= 80 ? "Perlu Waspada" : "Aman";
      const overBudgetAmount = percent > 100 ? Math.abs(remaining) : 0;
      return `
      <article class="panel rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl budget-card ${percent > 100 ? "budget-card-over" : ""}">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="grid gap-2">
            <div class="flex flex-wrap items-center gap-3">
              <h4 class="text-xl font-bold text-slate-100">${category?.name || "Kategori Dihapus"}</h4>
              <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">${statusLabel}</span>
              ${percent > 100 ? `<span class="rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200">Lebih ${formatAmount(overBudgetAmount)}</span>` : ""}
            </div>
            <p class="text-sm text-slate-300">${budget.note || `Budget kategori ${category?.name || "pengeluaran"} untuk ${month}.`}</p>
          </div>
          <div class="card-actions">
            <button class="icon-btn" data-edit-budget="${budget.id}" type="button">Edit</button>
            <button class="icon-btn" data-delete-budget="${budget.id}" type="button">Delete</button>
          </div>
        </div>
        <div class="mt-5 grid gap-4 lg:grid-cols-[120px_1fr] lg:items-center">
          <div class="budget-ring" style="--budget-angle:${Math.min(percent, 100) * 3.6}deg; --budget-tone:${toneColor};">
            <div class="budget-ring-inner">
              <strong>${percent}%</strong>
              <span>terpakai</span>
            </div>
          </div>
          <div class="grid gap-4">
            <div class="progress-track">
              <div class="progress-bar" style="width:${cappedPercent}%; background:${toneColor};"></div>
            </div>
            <div class="grid gap-3 md:grid-cols-3">
              <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p class="eyebrow">Budget Efektif</p>
                ${createAnimatedMetric(effectiveBudget, "currency", "money")}
              </div>
              <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p class="eyebrow">Terpakai</p>
                ${createAnimatedMetric(spent, "currency", "money")}
              </div>
              <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
                <p class="eyebrow">${remaining < 0 ? "Lebih" : "Sisa"}</p>
                ${createAnimatedMetric(Math.abs(remaining), "currency", `money ${remaining < 0 ? "text-danger" : "text-success"}`)}
              </div>
            </div>
            <div class="grid gap-2 md:grid-cols-2">
              <div class="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Carry-over: <strong class="text-slate-100">${carryOver > 0 ? formatAmount(carryOver) : "Tidak ada"}</strong>
              </div>
              <div class="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Status carry-over: <strong class="text-slate-100">${budget.carryOverEnabled ? "Aktif" : "Mati"}</strong>
              </div>
            </div>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  animateNumbers(elements.budgetSummary);
  animateNumbers(elements.budgetInsights);
  animateNumbers(elements.budgetList);
}

function renderDebts() {
  if (state.isLoading) {
    elements.debtSummary.innerHTML = createSkeletonCards(2);
    elements.debtList.innerHTML = createSkeletonCards(2, "debt-card");
    return;
  }

  const debts = state.debts.filter((item) => item.type === "debt");
  const receivables = state.debts.filter((item) => item.type === "receivable");
  const filteredDebts = getFilteredDebts();
  const activeDebtFilter = state.filters?.debts?.status || "all";
  elements.debtSummary.innerHTML = [createDebtSummaryCard("Total Hutang", debts), createDebtSummaryCard("Total Piutang", receivables)].join("");

  document.querySelectorAll("[data-debt-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.debtFilter === activeDebtFilter);
  });

  if (!filteredDebts.length) {
    elements.debtList.innerHTML = createEmptyState("Belum ada hutang atau piutang", "Catatan hutang dan piutang akan muncul di sini lengkap dengan progres pembayarannya.");
    return;
  }

  elements.debtList.innerHTML = filteredDebts
    .map((item) => {
      const paid = getDebtPaidAmount(item);
      const remaining = getDebtRemainingAmount(item);
      const percent = item.amount ? Math.min((paid / item.amount) * 100, 100) : 0;
      const amountClass = item.type === "debt" ? "text-danger" : "text-success";
      const actionLabel = item.type === "debt" ? "Bayar" : "Terima";
      const actionClass = item.type === "debt" ? "danger-btn" : "success-btn";
      const statusLabel = remaining <= 0 ? "Lunas" : item.type === "debt" ? "Utang" : "Piutang";
      const metaTone = item.type === "debt" ? "debt-tone" : "receivable-tone";
      const isMenuActive = state.activeDebtActionId === item.id;
      const ringTone = item.type === "debt" ? "var(--danger)" : "var(--success)";
      return `
      <article class="debt-card debt-feed-card ${metaTone} ${isMenuActive ? "debt-card-active-menu" : ""} rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl" data-open-debt-detail="${item.id}">
        <div class="debt-feed-top">
          <div class="debt-feed-main">
            <div class="debt-feed-icon ${metaTone}">${item.type === "debt" ? "&#8599;" : "&#8601;"}</div>
            <div>
              <div class="debt-feed-header">
                <h4>${item.name}</h4>
                <span class="debt-feed-status">${statusLabel}</span>
              </div>
              <p class="debt-feed-meta">Pribadi &bull; ${item.date} &bull; ${remaining <= 0 ? "Sudah lunas" : "Masih aktif"}</p>
              <p class="debt-feed-meta">${getWalletById(item.walletId)?.name || "Tanpa Wallet"}</p>
              <p class="debt-feed-note">${item.note || "Tanpa keterangan"}</p>
            </div>
          </div>
          <div class="debt-feed-amount ${amountClass}">
            ${formatAmount(remaining)}
          </div>
        </div>
        <div class="debt-feed-divider"></div>
        <div class="debt-progress-shell">
          <div class="budget-ring debt-progress-ring" style="--budget-angle:${Math.min(percent, 100) * 3.6}deg; --budget-tone:${ringTone};">
            <div class="budget-ring-inner">
              <strong>${Math.round(percent)}%</strong>
              <span>lunas</span>
            </div>
          </div>
          <div class="progress-wrap debt-progress-bar-wrap">
            <div class="progress-track">
              <div class="progress-bar" style="width:${percent}%; background:${ringTone};"></div>
            </div>
            <div class="debt-progress-caption">
              <span>${statusLabel}</span>
              <strong>${formatAmount(paid)} dari ${formatAmount(item.amount)}</strong>
            </div>
          </div>
        </div>
        <div class="debt-stats debt-feed-stats">
          <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p class="eyebrow">Total</p>
            ${createAnimatedMetric(item.amount, "currency", "money")}
          </div>
          <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p class="eyebrow">Bayar</p>
            ${createAnimatedMetric(paid, "currency", "money")}
          </div>
          <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
            <p class="eyebrow">Sisa</p>
            ${createAnimatedMetric(remaining, "currency", "money")}
          </div>
        </div>
        <div class="debt-feed-actions">
          ${remaining > 0 ? `<button class="${actionClass} action-pill" data-open-payment-for="${item.id}" type="button">${actionLabel}</button>` : `<span class="debt-feed-paid">Selesai</span>`}
          <div class="debt-menu-wrap">
            <button class="icon-btn debt-kebab" data-toggle-debt-menu="${item.id}" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 1.2em; height: 1.2em;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
              </svg>
            </button>
            <div class="debt-menu ${isMenuActive ? "active" : ""}">
              <button type="button" data-edit-debt="${item.id}">Edit</button>
              <button type="button" class="danger-text" data-delete-debt="${item.id}">Hapus</button>
            </div>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  animateNumbers(elements.debtSummary);
  animateNumbers(elements.debtList);
}

function renderPaymentOptions() {
  const mode = elements.paymentMode.value || "debt";
  const items = state.debts.filter((item) => item.type === mode);
  elements.paymentDebtId.innerHTML = items.length ? items.map((item) => `<option value="${item.id}">${item.name}</option>`).join("") : `<option value="" disabled selected>Belum ada data ${mode === "debt" ? "hutang" : "piutang"}</option>`;
  elements.paymentWalletLabel.textContent = mode === "debt" ? "Bayar Dari Wallet" : "Masuk Ke Wallet";
  elements.paymentWalletId.innerHTML = state.wallets.length ? state.wallets.map((item) => `<option value="${item.id}">${item.name}</option>`).join("") : `<option value="" disabled selected>Belum ada wallet</option>`;
}

function syncDebtWalletLabel() {
  elements.debtWalletLabel.textContent = elements.debtType.value === "receivable" ? "Keluar Dari Wallet" : "Masuk Ke Wallet";
}

function renderDebtDetailModal(debtId) {
  const item = state.debts.find((debt) => debt.id === debtId);
  if (!item) return;
  const paid = getDebtPaidAmount(item);
  const remaining = getDebtRemainingAmount(item);
  const percent = item.amount ? Math.min((paid / item.amount) * 100, 100) : 0;
  const ringTone = item.type === "debt" ? "var(--danger)" : "var(--success)";
  const paymentHistory = item.payments.length
    ? item.payments
        .map(
          (payment) => `
        <div class="payment-history-item flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
          <div>
            <strong class="text-base font-semibold text-slate-100">${payment.date}</strong>
            <p class="mt-1 text-sm font-medium text-slate-300">${formatAmount(payment.amount)}</p>
            <p class="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">${getWalletById(payment.walletId)?.name || "Tanpa Wallet"}</p>
          </div>
          <div class="card-actions">
            <button class="icon-btn" data-edit-payment="${item.id}:${payment.id}" type="button">Edit</button>
            <button class="icon-btn" data-delete-payment="${item.id}:${payment.id}" type="button">Delete</button>
          </div>
        </div>
      `,
        )
        .join("")
    : createEmptyState("Belum ada riwayat pembayaran", "Tambahkan pembayaran pertama dari tombol aksi pada kartu.");

  elements.debtDetailContent.innerHTML = `
    <div class="debt-detail-hero ${item.type === "debt" ? "debt-tone" : "receivable-tone"} rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
      <div class="debt-detail-copy">
        <div>
          <p class="eyebrow">${item.type === "debt" ? "Hutang" : "Piutang"}</p>
          <h3>${item.name}</h3>
          <p class="mt-2 text-sm font-medium text-slate-300">${item.note || "Tanpa keterangan"}</p>
        </div>
        <div class="debt-progress-shell debt-progress-shell-detail">
          <div class="budget-ring debt-progress-ring debt-progress-ring-lg" style="--budget-angle:${Math.min(percent, 100) * 3.6}deg; --budget-tone:${ringTone};">
            <div class="budget-ring-inner">
              <strong>${Math.round(percent)}%</strong>
              <span>lunas</span>
            </div>
          </div>
          <div class="progress-wrap debt-progress-bar-wrap">
            <div class="progress-track">
              <div class="progress-bar" style="width:${percent}%; background:${ringTone};"></div>
            </div>
            <div class="debt-progress-caption">
              <span>Progress Pembayaran</span>
              <strong>${formatAmount(paid)} dari ${formatAmount(item.amount)}</strong>
            </div>
          </div>
        </div>
      </div>
      <div class="debt-feed-amount ${item.type === "debt" ? "text-danger" : "text-success"}">${formatAmount(remaining)}</div>
    </div>
    <div class="debt-stats grid gap-3 md:grid-cols-4">
      <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
        <p class="eyebrow">Total</p>
        ${createAnimatedMetric(item.amount, "currency", "money")}
      </div>
      <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
        <p class="eyebrow">Bayar</p>
        ${createAnimatedMetric(paid, "currency", "money")}
      </div>
      <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
        <p class="eyebrow">Sisa</p>
        ${createAnimatedMetric(remaining, "currency", "money")}
      </div>
      <div class="debt-stat rounded-[22px] border border-white/10 bg-white/5 p-4">
        <p class="eyebrow">Wallet</p>
        <strong class="text-base font-semibold text-slate-100">${getWalletById(item.walletId)?.name || "-"}</strong>
      </div>
    </div>
    <div class="security-card rounded-[28px] border border-white/10 bg-white/5 p-5">
      <div class="panel-head mb-4">
        <h4 class="text-lg font-bold text-slate-100">Riwayat Pembayaran</h4>
      </div>
      <div class="grid gap-3">${paymentHistory}</div>
    </div>
  `;
  animateNumbers(elements.debtDetailContent);
}

function syncFilterInputs() {
  const dashboardFilters = state.filters.dashboard;
  elements.dashboardBalanceMode.value = dashboardFilters.balanceMode;
  elements.dashboardRangeType.value = dashboardFilters.mode;
  elements.dashboardMonth.value = dashboardFilters.month;
  elements.dashboardStart.value = dashboardFilters.start;
  elements.dashboardEnd.value = dashboardFilters.end;
  elements.dashboardMonth.classList.toggle("hidden", dashboardFilters.mode !== "month");
  elements.dashboardStart.classList.toggle("hidden", dashboardFilters.mode !== "custom");
  elements.dashboardEnd.classList.toggle("hidden", dashboardFilters.mode !== "custom");

  const transactionFilters = state.filters.transactions;
  elements.transactionDateMode.value = transactionFilters.dateMode;
  elements.transactionMonth.value = transactionFilters.month;
  elements.transactionStart.value = transactionFilters.start;
  elements.transactionEnd.value = transactionFilters.end;
  elements.transactionMonth.classList.toggle("hidden", transactionFilters.dateMode !== "month");
  elements.transactionStart.classList.toggle("hidden", transactionFilters.dateMode !== "custom");
  elements.transactionEnd.classList.toggle("hidden", transactionFilters.dateMode !== "custom");
  elements.transactionTypeFilter.value = transactionFilters.type;
  elements.transactionWalletFilter.value = transactionFilters.wallet;
  elements.transactionSearch.value = transactionFilters.search;

  elements.assetTypeFilter.value = state.filters.assets.type;
  elements.budgetMonthFilter.value = getBudgetMonthValue();
}

function applyTheme() {
  elements.body.classList.toggle("light", state.theme === "light");
  elements.appShell.classList.toggle("sidebar-collapsed", Boolean(state.sidebarCollapsed));
  if (elements.themeToggle) {
    elements.themeToggle.textContent = state.theme === "light" ? "Dark Mode" : "Light Mode";
  }
  const topThemeToggle = document.getElementById("topThemeToggle");
  if (topThemeToggle) {
    const sunIcon = topThemeToggle.querySelector(".theme-sun-icon");
    const moonIcon = topThemeToggle.querySelector(".theme-moon-icon");
    if (sunIcon && moonIcon) {
      sunIcon.classList.toggle("hidden", state.theme !== "dark");
      moonIcon.classList.toggle("hidden", state.theme === "dark");
    }
    topThemeToggle.title = state.theme === "light" ? "Mode Gelap" : "Mode Terang";
  }
  const toggleSvg = elements.sidebarCollapseToggle ? elements.sidebarCollapseToggle.querySelector(".sidebar-toggle-svg") : null;
  if (toggleSvg) {
    toggleSvg.classList.toggle("rotate-180", Boolean(state.sidebarCollapsed));
  }
  if (elements.sidebarCollapseToggle) {
    elements.sidebarCollapseToggle.title = state.sidebarCollapsed ? "Buka sidebar" : "Ringkas sidebar";
    elements.sidebarCollapseToggle.setAttribute("aria-label", state.sidebarCollapsed ? "Buka sidebar" : "Ringkas sidebar");
  }
  const visibilityTitle = state.showAmounts ? "Sembunyikan nominal" : "Tampilkan nominal";
  elements.dashboardVisibilityToggle.innerHTML = getVisibilityIcon();
  elements.walletVisibilityToggle.innerHTML = getVisibilityIcon();
  elements.dashboardVisibilityToggle.title = visibilityTitle;
  elements.walletVisibilityToggle.title = visibilityTitle;
}

function showAuthStatus(message, tone = "error") {
  elements.authStatus.textContent = message;
  elements.authStatus.dataset.tone = tone;
  elements.authStatus.classList.remove("hidden");
}

function hideAuthStatus() {
  elements.authStatus.textContent = "";
  elements.authStatus.classList.add("hidden");
}

function showProfileStatus(message, tone = "success") {
  elements.profileStatus.textContent = message;
  elements.profileStatus.dataset.tone = tone;
  elements.profileStatus.classList.remove("hidden");
}

function hideProfileStatus() {
  elements.profileStatus.textContent = "";
  elements.profileStatus.classList.add("hidden");
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getExportFilename(extension) {
  return `dompetku-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getExportRows() {
  return state.transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => ({
      tanggal: item.date,
      jenis: getTransactionTypeLabel(item.type),
      dompet: item.type === "transfer" ? `${getWalletById(item.fromWalletId)?.name || "-"} -> ${getWalletById(item.toWalletId)?.name || "-"}` : getWalletById(item.walletId)?.name || "-",
      kategori: item.type === "transfer" ? "Transfer" : getCategoryById(item.categoryId)?.name || "-",
      deskripsi: item.description || "-",
      catatan: item.note || "-",
      jumlah: Number(item.amount || 0),
    }));
}

function buildExcelHtml() {
  const rows = getExportRows();
  const tableRows = rows
    .map(
      (row) => `
    <tr>
      <td>${escapeHtml(row.tanggal)}</td>
      <td>${escapeHtml(row.jenis)}</td>
      <td>${escapeHtml(row.dompet)}</td>
      <td>${escapeHtml(row.kategori)}</td>
      <td>${escapeHtml(row.deskripsi)}</td>
      <td>${escapeHtml(row.catatan)}</td>
      <td>${row.jumlah}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d0d7e2; padding: 8px; text-align: left; }
          th { background: #eef4fb; font-weight: 700; }
          h1, h2 { margin: 0 0 12px; }
          .summary { margin: 0 0 18px; }
        </style>
      </head>
      <body>
        <h1>DompetKu Export</h1>
        <p class="summary">Dibuat pada ${escapeHtml(new Date().toLocaleString("id-ID"))}</p>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Dompet</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Catatan</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function buildPrintableReportHtml() {
  const rows = getExportRows();
  const itemsMarkup = rows
    .map(
      (row) => `
    <tr>
      <td>${escapeHtml(row.tanggal)}</td>
      <td>${escapeHtml(row.jenis)}</td>
      <td>${escapeHtml(row.dompet)}</td>
      <td>${escapeHtml(row.kategori)}</td>
      <td>${escapeHtml(row.deskripsi)}</td>
      <td style="text-align:right;">${escapeHtml(formatCurrency(row.jumlah))}</td>
    </tr>
  `,
    )
    .join("");
  const totals = {
    income: state.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0),
    expense: state.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0),
    balance: getWalletTotalBalance(),
  };

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>DompetKu PDF Export</title>
        <style>
          body { font-family: Arial, sans-serif; color: #132033; margin: 28px; }
          h1 { margin: 0 0 10px; }
          .muted { color: #56677f; margin-bottom: 18px; }
          .stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
          .stat { border: 1px solid #d9e2ef; border-radius: 16px; padding: 12px 14px; background: #f6f9fd; }
          .label { color: #5d7087; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
          .value { font-size: 20px; font-weight: 700; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #d9e2ef; padding: 10px 8px; text-align: left; }
          th { color: #42566f; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
        </style>
      </head>
      <body>
        <h1>Laporan DompetKu</h1>
        <div class="muted">Dibuat pada ${escapeHtml(new Date().toLocaleString("id-ID"))}</div>
        <div class="stats">
          <div class="stat"><div class="label">Pemasukan</div><div class="value">${escapeHtml(formatCurrency(totals.income))}</div></div>
          <div class="stat"><div class="label">Pengeluaran</div><div class="value">${escapeHtml(formatCurrency(totals.expense))}</div></div>
          <div class="stat"><div class="label">Saldo</div><div class="value">${escapeHtml(formatCurrency(totals.balance))}</div></div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Dompet</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>${itemsMarkup}</tbody>
        </table>
      </body>
    </html>
  `;
}

async function loadSystemInfo() {
  try {
    const response = await apiRequest("/api/system/info");
    state.systemInfo = response;
    const accessItems = (response.localUrls || [])
      .map(
        (url) => `
      <div class="list-item">
        <div>
          <strong>${url.includes("localhost") ? "Alamat Lokal" : "Alamat Jaringan"}</strong>
          <p class="mt-1 text-sm text-slate-300">${url}</p>
        </div>
      </div>
    `,
      )
      .join("");
    const backupItems = (response.backups || []).length
      ? response.backups
          .map(
            (backup) => `
          <div class="list-item">
            <div>
              <strong>${backup.file}</strong>
              <p class="mt-1 text-sm text-slate-300">${new Date(backup.createdAt).toLocaleString("id-ID")} &bull; ${(backup.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        `,
          )
          .join("")
      : `<div class="empty-state">Belum ada backup database.</div>`;

    elements.systemInfoPanel.innerHTML = `
      <div class="security-meta">
        <span>Backup otomatis tiap ${response.backupIntervalHours} jam</span>
      </div>
      ${accessItems || `<div class="empty-state">Alamat jaringan belum tersedia.</div>`}
      <div class="panel-head mt-2">
        <h4 class="text-base font-bold text-slate-100">Riwayat Backup</h4>
      </div>
      ${backupItems}
    `;
  } catch (error) {
    elements.systemInfoPanel.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

function switchAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  elements.loginForm.classList.toggle("hidden", tab !== "login");
  elements.registerForm.classList.toggle("hidden", tab !== "register");
  hideAuthStatus();
}

function showAuthScreen() {
  closeAllModals();
  elements.authShell.classList.remove("hidden");
  elements.appShell.classList.add("hidden");
}

function showAppScreen() {
  elements.authShell.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
}

function renderUserIdentity() {
  const user = state.authUser;
  if (!user) return;
  if (elements.userDisplayName) elements.userDisplayName.textContent = user.name;
  if (elements.userEmailDisplay) elements.userEmailDisplay.textContent = user.email;
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (elements.userAvatar) elements.userAvatar.textContent = initials || "DK";
}

function switchProfileTab(tab) {
  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.profileTab === tab);
  });
  elements.profileForm.classList.toggle("hidden", tab !== "profile");
  elements.passwordForm.classList.toggle("hidden", tab !== "password");
  elements.securityPanel.classList.toggle("hidden", tab !== "security");
  hideProfileStatus();
  if (tab === "security" && state.authUser) {
    loadSecurityActivity();
    loadSystemInfo();
  }
}

function resetProfileForms() {
  elements.profileName.value = state.authUser?.name || "";
  elements.profileEmail.value = state.authUser?.email || "";
  elements.passwordForm.reset();
  elements.deleteAccountForm.reset();
  hideProfileStatus();
  switchProfileTab("profile");
}

async function loadSecurityActivity() {
  try {
    const response = await apiRequest("/api/auth/security");
    const logs = response.logs || [];
    if (!logs.length) {
      elements.securityActivityList.innerHTML = `<div class="empty-state">Belum ada aktivitas keamanan.</div>`;
      return;
    }
    elements.securityActivityList.innerHTML = logs
      .map(
        (log) => `
      <div class="list-item">
        <div>
          <strong>${log.action.replaceAll("_", " ")}</strong>
          <p class="mt-1 text-sm text-slate-300">${log.detail || "-"}</p>
        </div>
        <span class="text-sm text-slate-400">${log.createdAt.slice(0, 16).replace("T", " ")}</span>
      </div>
    `,
      )
      .join("");
  } catch (error) {
    elements.securityActivityList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
}

function renderNavigation() {
  if (!pageTitleMap[state.activeView] || !document.getElementById(`${state.activeView}View`)) {
    state.activeView = "dashboard";
  }
  elements.pageTitle.textContent = pageTitleMap[state.activeView];
  document.querySelectorAll(".nav-link").forEach((button) => {
    const isActive = button.dataset.view === state.activeView;
    button.classList.toggle("active", isActive);
    if (isActive && window.innerWidth <= 1080) {
      button.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  });
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.getElementById(`${state.activeView}View`).classList.add("active");

  if (state.activeView === "profile") {
    resetProfileForms();
  }
}

function render() {
  renderUserIdentity();
  applyTheme();
  renderNavigation();
  renderDashboard();
  renderWallets();
  renderAssets();
  renderCategoryOptions();
  renderTransactions();
  renderCategories();
  renderBudgetCategoryOptions();
  renderBudgeting();
  renderDebts();
  renderPaymentOptions();
  renderWalletOptions();
  syncFilterInputs();
  if (state.activeDebtDetailId && !document.getElementById("debtDetailModal").classList.contains("hidden")) {
    renderDebtDetailModal(state.activeDebtDetailId);
  }
  persistUiState();
}

function openModal(modalId) {
  elements.modalBackdrop.classList.remove("hidden");
  document.getElementById(modalId).classList.remove("hidden");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden");
  if (modalId === "confirmModal" && confirmModalResolver) {
    const resolver = confirmModalResolver;
    confirmModalResolver = null;
    resolver(false);
  }
  if ([...document.querySelectorAll(".modal:not(.hidden)")].length === 0) {
    elements.modalBackdrop.classList.add("hidden");
  }
}

function resolveConfirmModal(result) {
  const resolver = confirmModalResolver;
  confirmModalResolver = null;
  document.getElementById("confirmModal").classList.add("hidden");
  if ([...document.querySelectorAll(".modal:not(.hidden)")].length === 0) {
    elements.modalBackdrop.classList.add("hidden");
  }
  if (resolver) {
    resolver(result);
  }
}

function showConfirmModal({ title = "Konfirmasi Aksi", message = "Aksi ini tidak bisa dibatalkan.", confirmLabel = "Lanjutkan", tone = "danger" } = {}) {
  if (confirmModalResolver) {
    confirmModalResolver(false);
    confirmModalResolver = null;
  }
  elements.confirmModalTitle.textContent = title;
  elements.confirmModalMessage.textContent = message;
  elements.confirmModalConfirm.textContent = confirmLabel;
  elements.confirmModalConfirm.className = `${tone === "danger" ? "danger-btn" : tone === "success" ? "success-btn" : "primary-btn"} inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold`;
  openModal("confirmModal");
  return new Promise((resolve) => {
    confirmModalResolver = resolve;
  });
}

function resetWalletForm() {
  elements.walletForm.reset();
  elements.walletId.value = "";
  elements.walletModalTitle.textContent = "Tambah Wallet";
}

function resetAssetForm() {
  elements.assetForm.reset();
  elements.assetId.value = "";
  if (state.wallets[0]) {
    elements.assetWalletId.value = state.wallets[0].id;
  }
  elements.assetType.value = "cash_equivalent";
  elements.assetAcquiredDate.value = todayISO;
  elements.assetModalTitle.textContent = "Tambah Aset";
}

function resetCategoryForm() {
  elements.categoryForm.reset();
  elements.categoryId.value = "";
  elements.categoryModalTitle.textContent = "Tambah Kategori";
}

function resetBudgetForm() {
  elements.budgetForm.reset();
  elements.budgetId.value = "";
  elements.budgetMonth.value = getBudgetMonthValue();
  elements.budgetCarryOver.checked = true;
  elements.budgetModalTitle.textContent = "Tambah Budget";
  renderBudgetCategoryOptions();
}

function resetSavingsTargetForm() {
  elements.savingsTargetForm.reset();
  elements.savingsTargetId.value = "";
  elements.savingsTargetMonth.value = getBudgetMonthValue();
  elements.savingsTargetModalTitle.textContent = "Target Tabungan";
  const target = getSavingsTargetForMonth(getBudgetMonthValue());
  if (target) {
    elements.savingsTargetId.value = target.id;
    elements.savingsTargetMonth.value = target.month;
    setAmountInputValue(elements.savingsTargetAmount, target.amount);
    elements.savingsTargetNote.value = target.note || "";
    elements.savingsTargetModalTitle.textContent = "Edit Target Tabungan";
  }
}

function resetTransactionForms() {
  elements.flowTransactionForm.reset();
  elements.transferForm.reset();
  elements.flowTransactionId.value = "";
  elements.transferId.value = "";
  elements.transactionModalTitle.textContent = "Tambah Transaksi";
  elements.flowDate.value = todayISO;
  elements.transferDate.value = todayISO;
  elements.flowType.value = "income";
  renderCategoryOptions();
  switchTransactionTab("flow");
}

function resetDebtForm() {
  elements.debtForm.reset();
  elements.debtId.value = "";
  elements.debtDate.value = todayISO;
  elements.debtModalTitle.textContent = "Tambah Hutang / Piutang";
  elements.debtWalletLabel.textContent = elements.debtType.value === "receivable" ? "Keluar Dari Wallet" : "Masuk Ke Wallet";
  if (state.wallets[0]) {
    elements.debtWalletId.value = state.wallets[0].id;
  }
}

function resetPaymentForm(mode) {
  elements.paymentForm.reset();
  elements.paymentMode.value = mode;
  elements.paymentId.value = "";
  elements.paymentDate.value = todayISO;
  const isDebt = mode === "debt";
  elements.paymentModalTitle.textContent = isDebt ? "Bayar Hutang" : "Terima Pembayaran";
  elements.paymentSubmitButton.textContent = isDebt ? "Simpan Pembayaran" : "Simpan Penerimaan";
  elements.paymentSubmitButton.className = `${isDebt ? "danger-btn" : "success-btn"} mt-2 inline-flex items-center justify-center rounded-2xl px-5 py-3.5 font-semibold`;
  renderPaymentOptions();
}

function switchTransactionTab(tab) {
  document.querySelectorAll("[data-transaction-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.transactionTab === tab);
  });
  elements.flowTransactionForm.classList.toggle("hidden", tab !== "flow");
  elements.transferForm.classList.toggle("hidden", tab !== "transfer");
}

function openTransactionDetail(id) {
  state.activeTransactionDetailId = state.activeTransactionDetailId === id ? null : id;
  renderTransactions();
}

function buildCalculator() {
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+", "C", "Del"];
  elements.calculatorGrid.innerHTML = keys.map((key) => `<button type="button" data-calculator-key="${key}">${key}</button>`).join("");
}

function updateCalculatorDisplay(value) {
  elements.calculatorDisplay.textContent = value || "0";
}

function evaluateCalculator() {
  try {
    const safeExpression = calculatorExpression.replace(/[^0-9+\-*/.()]/g, "");
    const result = Function(`"use strict"; return (${safeExpression || 0})`)();
    calculatorExpression = String(Number(result || 0));
    setAmountInputValue(elements.flowAmount, calculatorExpression);
    updateCalculatorDisplay(calculatorExpression);
  } catch {
    updateCalculatorDisplay("Error");
  }
}

function animateNumbers(container) {
  if (!state.showAmounts || !container) return;
  container.querySelectorAll(".animated-number").forEach((element) => {
    const target = Number(element.dataset.value || 0);
    const format = element.dataset.format || "currency";
    const duration = 700;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      element.textContent = format === "percent" ? `${Math.round(current)}%` : formatCurrency(current);
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        element.textContent = format === "percent" ? `${Math.round(target)}%` : formatCurrency(target);
      }
    }

    requestAnimationFrame(frame);
  });
}

async function refreshAndRender() {
  await loadStateFromApi();
  render();
}

async function withApi(action) {
  try {
    await action();
    await refreshAndRender();
  } catch (error) {
    if (error?.status === 401) {
      clearAppData();
      showAuthScreen();
      switchAuthTab("login");
      showAuthStatus("Sesi berakhir. Silakan login lagi.");
      return;
    }
    alert(error.message);
  }
}

function attachEvents() {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
  });

  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    button.addEventListener("click", () => switchProfileTab(button.dataset.profileTab));
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAuthStatus();
    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: elements.loginEmail.value.trim(),
          password: elements.loginPassword.value,
        }),
      });
      state.authUser = response.user;
      state.activeView = "dashboard";
      state.activeTransactionDetailId = null;
      state.activeDebtActionId = null;
      elements.loginForm.reset();
      showAppScreen();
      await refreshAndRender();
    } catch (error) {
      showAuthStatus(error.message);
    }
  });

  elements.registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAuthStatus();
    try {
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: elements.registerName.value.trim(),
          email: elements.registerEmail.value.trim(),
          password: elements.registerPassword.value,
        }),
      });
      state.authUser = response.user;
      state.activeView = "dashboard";
      state.activeTransactionDetailId = null;
      state.activeDebtActionId = null;
      elements.registerForm.reset();
      showAppScreen();
      await refreshAndRender();
    } catch (error) {
      showAuthStatus(error.message);
    }
  });

  elements.sidebarNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;
    state.activeView = button.dataset.view;
    const menuName = button.innerText.trim();
    document.title = `Dompetku. | ${menuName}`;
    state.activeTransactionDetailId = null;
    state.activeDebtActionId = null;
    render();
  });

  elements.debtFilterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-debt-filter]");
    if (!button) return;
    state.filters = state.filters || structuredClone(defaultUiState.filters);
    state.filters.debts = {
      ...structuredClone(defaultUiState.filters.debts),
      ...(state.filters.debts || {}),
    };
    state.filters.debts.status = button.dataset.debtFilter;
    state.activeDebtActionId = null;
    render();
  });

  document.body.addEventListener("click", async (event) => {
    const openButton = event.target.closest("[data-open-modal]");
    const closeButton = event.target.closest("[data-close-modal]");
    const debtMenuToggle = event.target.closest("[data-toggle-debt-menu]");
    const debtCardAction = event.target.closest("[data-open-payment-for], [data-edit-debt], [data-delete-debt], [data-edit-payment], [data-delete-payment], [data-toggle-debt-menu]");
    if (state.activeDebtActionId && !event.target.closest(".debt-menu-wrap")) {
      state.activeDebtActionId = null;
      renderDebts();
    }
    if (debtMenuToggle) {
      state.activeDebtActionId = state.activeDebtActionId === debtMenuToggle.dataset.toggleDebtMenu ? null : debtMenuToggle.dataset.toggleDebtMenu;
      renderDebts();
      return;
    }
    if (openButton) {
      const modalId = openButton.dataset.openModal;
      if (modalId === "walletModal") resetWalletForm();
      if (modalId === "assetModal") resetAssetForm();
      if (modalId === "categoryModal") resetCategoryForm();
      if (modalId === "budgetModal") resetBudgetForm();
      if (modalId === "savingsTargetModal") resetSavingsTargetForm();
      if (modalId === "transactionModal") resetTransactionForms();
      if (modalId === "debtModal") resetDebtForm();
      openModal(modalId);
      return;
    }
    if (closeButton) {
      closeModal(closeButton.dataset.closeModal);
      return;
    }

    const openDebtDetail = event.target.closest("[data-open-debt-detail]");
    if (openDebtDetail && !debtCardAction) {
      state.activeDebtDetailId = openDebtDetail.dataset.openDebtDetail;
      renderDebtDetailModal(state.activeDebtDetailId);
      openModal("debtDetailModal");
      return;
    }

    const openPaymentFor = event.target.closest("[data-open-payment-for]");
    if (openPaymentFor) {
      const debt = state.debts.find((item) => item.id === openPaymentFor.dataset.openPaymentFor);
      if (!debt) return;
      state.activeDebtActionId = null;
      renderDebts();
      resetPaymentForm(debt.type);
      elements.paymentDebtId.value = debt.id;
      if (state.wallets[0]) {
        elements.paymentWalletId.value = state.wallets[0].id;
      }
      openModal("paymentModal");
      return;
    }

    const editWallet = event.target.closest("[data-edit-wallet]");
    if (editWallet) {
      const wallet = getWalletById(editWallet.dataset.editWallet);
      if (!wallet) return;
      elements.walletId.value = wallet.id;
      elements.walletName.value = wallet.name;
      setAmountInputValue(elements.walletBalance, wallet.balance);
      elements.walletModalTitle.textContent = "Edit Wallet";
      openModal("walletModal");
      return;
    }

    const deleteWalletButton = event.target.closest("[data-delete-wallet]");
    if (deleteWalletButton) {
      const approved = await showConfirmModal({
        title: "Hapus Wallet?",
        message: "Wallet ini akan dihapus beserta transaksi yang terhubung dengannya.",
        confirmLabel: "Hapus Wallet",
        tone: "danger",
      });
      if (!approved) return;
      withApi(() => apiRequest(`/api/wallets/${deleteWalletButton.dataset.deleteWallet}`, { method: "DELETE" }));
      return;
    }

    const editAsset = event.target.closest("[data-edit-asset]");
    if (editAsset) {
      const asset = getAssetById(editAsset.dataset.editAsset);
      if (!asset) return;
      elements.assetId.value = asset.id;
      elements.assetWalletId.value = asset.walletId || state.wallets[0]?.id || "";
      elements.assetName.value = asset.name;
      elements.assetType.value = asset.type;
      elements.assetAccountName.value = asset.accountName || "";
      setAmountInputValue(elements.assetCurrentValue, asset.currentValue);
      setAmountInputValue(elements.assetPurchaseValue, asset.purchaseValue);
      elements.assetAcquiredDate.value = asset.acquiredDate || "";
      elements.assetNote.value = asset.note || "";
      elements.assetModalTitle.textContent = "Edit Aset";
      openModal("assetModal");
      return;
    }

    const deleteAssetButton = event.target.closest("[data-delete-asset]");
    if (deleteAssetButton) {
      const approved = await showConfirmModal({
        title: "Hapus Aset?",
        message: "Aset ini akan dihapus dari portfolio kamu. Riwayat transaksi tidak ikut berubah.",
        confirmLabel: "Hapus Aset",
        tone: "danger",
      });
      if (!approved) return;
      withApi(() => apiRequest(`/api/assets/${deleteAssetButton.dataset.deleteAsset}`, { method: "DELETE" }));
      return;
    }

    const editCategory = event.target.closest("[data-edit-category]");
    if (editCategory) {
      const category = getCategoryById(editCategory.dataset.editCategory);
      if (!category) return;
      elements.categoryId.value = category.id;
      elements.categoryName.value = category.name;
      elements.categoryType.value = category.type;
      elements.categoryModalTitle.textContent = "Edit Kategori";
      openModal("categoryModal");
      return;
    }

    const deleteCategoryButton = event.target.closest("[data-delete-category]");
    if (deleteCategoryButton) {
      const approved = await showConfirmModal({
        title: "Hapus Kategori?",
        message: "Kategori ini akan dihapus beserta transaksi yang memakai kategori tersebut.",
        confirmLabel: "Hapus Kategori",
        tone: "danger",
      });
      if (!approved) return;
      withApi(() => apiRequest(`/api/categories/${deleteCategoryButton.dataset.deleteCategory}`, { method: "DELETE" }));
      return;
    }

    const editBudget = event.target.closest("[data-edit-budget]");
    if (editBudget) {
      const budget = state.budgets.find((item) => item.id === editBudget.dataset.editBudget);
      if (!budget) return;
      elements.budgetId.value = budget.id;
      elements.budgetMonth.value = budget.month;
      renderBudgetCategoryOptions();
      elements.budgetCategory.value = budget.categoryId;
      setAmountInputValue(elements.budgetAmount, budget.amount);
      elements.budgetCarryOver.checked = Boolean(budget.carryOverEnabled);
      elements.budgetNote.value = budget.note || "";
      elements.budgetModalTitle.textContent = "Edit Budget";
      openModal("budgetModal");
      return;
    }

    const deleteBudgetButton = event.target.closest("[data-delete-budget]");
    if (deleteBudgetButton) {
      const approved = await showConfirmModal({
        title: "Hapus Budget?",
        message: "Budget untuk kategori dan periode ini akan dihapus dari perencanaan kamu.",
        confirmLabel: "Hapus Budget",
        tone: "danger",
      });
      if (!approved) return;
      withApi(() => apiRequest(`/api/budgets/${deleteBudgetButton.dataset.deleteBudget}`, { method: "DELETE" }));
      return;
    }

    const transactionButton = event.target.closest("[data-view-transaction]");
    if (transactionButton) {
      openTransactionDetail(transactionButton.dataset.viewTransaction);
      return;
    }

    const editTransaction = event.target.closest("[data-edit-transaction]");
    if (editTransaction) {
      const item = state.transactions.find((transaction) => transaction.id === editTransaction.dataset.editTransaction);
      if (!item) return;
      elements.transactionModalTitle.textContent = "Edit Transaksi";
      if (item.type === "transfer") {
        switchTransactionTab("transfer");
        elements.transferId.value = item.id;
        elements.transferFromWallet.value = item.fromWalletId;
        elements.transferToWallet.value = item.toWalletId;
        elements.transferDate.value = item.date;
        setAmountInputValue(elements.transferAmount, item.amount);
        elements.transferDescription.value = item.description;
      } else {
        switchTransactionTab("flow");
        elements.flowTransactionId.value = item.id;
        elements.flowType.value = item.type;
        renderCategoryOptions();
        elements.flowDate.value = item.date;
        setAmountInputValue(elements.flowAmount, item.amount);
        elements.flowWallet.value = item.walletId;
        elements.flowCategory.value = item.categoryId;
        elements.flowDescription.value = item.description;
        elements.flowNote.value = item.note || "";
      }
      openModal("transactionModal");
      return;
    }

    const deleteTransactionButton = event.target.closest("[data-delete-transaction]");
    if (deleteTransactionButton) {
      const approved = await showConfirmModal({
        title: "Hapus Transaksi?",
        message: "Riwayat transaksi ini akan dihapus permanen dari catatan keuangan.",
        confirmLabel: "Hapus Transaksi",
        tone: "danger",
      });
      if (!approved) return;
      withApi(() => apiRequest(`/api/transactions/${deleteTransactionButton.dataset.deleteTransaction}`, { method: "DELETE" }));
      return;
    }

    const editDebt = event.target.closest("[data-edit-debt]");
    if (editDebt) {
      const item = state.debts.find((debt) => debt.id === editDebt.dataset.editDebt);
      if (!item) return;
      state.activeDebtActionId = null;
      renderDebts();
      elements.debtId.value = item.id;
      elements.debtType.value = item.type;
      elements.debtName.value = item.name;
      setAmountInputValue(elements.debtAmount, item.amount);
      syncDebtWalletLabel();
      elements.debtWalletId.value = item.walletId || state.wallets[0]?.id || "";
      elements.debtDate.value = item.date;
      elements.debtNote.value = item.note || "";
      elements.debtModalTitle.textContent = "Edit Hutang / Piutang";
      openModal("debtModal");
      return;
    }

    const deleteDebtButton = event.target.closest("[data-delete-debt]");
    if (deleteDebtButton) {
      const approved = await showConfirmModal({
        title: "Hapus Data Hutang/Piutang?",
        message: "Data ini beserta progres pembayarannya akan dihapus dari daftar hutang piutang.",
        confirmLabel: "Hapus Data",
        tone: "danger",
      });
      if (!approved) return;
      if (state.activeDebtDetailId === deleteDebtButton.dataset.deleteDebt) {
        state.activeDebtDetailId = null;
        closeModal("debtDetailModal");
      }
      withApi(() => apiRequest(`/api/debts/${deleteDebtButton.dataset.deleteDebt}`, { method: "DELETE" }));
      return;
    }

    const editPaymentButton = event.target.closest("[data-edit-payment]");
    if (editPaymentButton) {
      const [debtId, paymentId] = editPaymentButton.dataset.editPayment.split(":");
      const debt = state.debts.find((item) => item.id === debtId);
      const payment = debt?.payments.find((entry) => entry.id === paymentId);
      if (!debt || !payment) return;
      resetPaymentForm(debt.type);
      elements.paymentId.value = payment.id;
      elements.paymentDebtId.value = debt.id;
      elements.paymentWalletId.value = payment.walletId || state.wallets[0]?.id || "";
      setAmountInputValue(elements.paymentAmount, payment.amount);
      elements.paymentDate.value = payment.date;
      elements.paymentModalTitle.textContent = debt.type === "debt" ? "Edit Pembayaran Hutang" : "Edit Penerimaan Piutang";
      openModal("paymentModal");
      return;
    }

    const deletePaymentButton = event.target.closest("[data-delete-payment]");
    if (deletePaymentButton) {
      const approved = await showConfirmModal({
        title: "Hapus Riwayat Pembayaran?",
        message: "Riwayat pembayaran ini akan dihapus dari detail hutang/piutang.",
        confirmLabel: "Hapus Riwayat",
        tone: "danger",
      });
      if (!approved) return;
      const [debtId, paymentId] = deletePaymentButton.dataset.deletePayment.split(":");
      withApi(async () => {
        await apiRequest(`/api/debts/${debtId}/payments/${paymentId}`, { method: "DELETE" });
        if (state.activeDebtDetailId === debtId) {
          state.activeDebtDetailId = debtId;
        }
      });
      return;
    }

    const calculatorButton = event.target.closest("[data-calculator-key]");
    if (calculatorButton) {
      const key = calculatorButton.dataset.calculatorKey;
      if (key === "C") {
        calculatorExpression = "";
        updateCalculatorDisplay("");
      } else if (key === "Del") {
        calculatorExpression = calculatorExpression.slice(0, -1);
        updateCalculatorDisplay(calculatorExpression);
      } else if (key === "=") {
        evaluateCalculator();
      } else {
        calculatorExpression += key;
        updateCalculatorDisplay(calculatorExpression);
      }
    }
  });

  elements.modalBackdrop.addEventListener("click", () => {
    if (!document.getElementById("confirmModal").classList.contains("hidden")) {
      resolveConfirmModal(false);
      return;
    }
    closeAllModals();
  });

  const mobileFabAddBtn = document.getElementById("mobileFabAddBtn");
  if (mobileFabAddBtn) {
    mobileFabAddBtn.addEventListener("click", () => {
      resetTransactionForms();
      openModal("transactionModal");
    });
  }

  document.body.addEventListener("click", (event) => {
    const quickViewBtn = event.target.closest("[data-quick-view]");
    if (quickViewBtn) {
      state.activeView = quickViewBtn.dataset.quickView;
      state.activeTransactionDetailId = null;
      state.activeDebtActionId = null;
      render();
    }
  });

  elements.confirmModalCancel.addEventListener("click", () => resolveConfirmModal(false));
  elements.confirmModalConfirm.addEventListener("click", () => resolveConfirmModal(true));

  document.querySelectorAll("#themeToggle, #topThemeToggle, .theme-toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      render();
    });
  });

  elements.sidebarCollapseToggle.addEventListener("click", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    render();
  });

  if (elements.openProfileModal) {
    elements.openProfileModal.addEventListener("click", () => {
      state.activeView = "profile";
      render();
    });
  }

  document.querySelectorAll("#logoutButton, .logout-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await apiRequest("/api/auth/logout", { method: "POST" });
      } finally {
        clearAppData();
        closeAllModals();
        hideAuthStatus();
        elements.loginForm.reset();
        elements.registerForm.reset();
        showAuthScreen();
        switchAuthTab("login");
      }
    });
  });

  [elements.dashboardVisibilityToggle, elements.walletVisibilityToggle].forEach((button) => {
    button.addEventListener("click", () => {
      state.showAmounts = !state.showAmounts;
      render();
    });
  });

  elements.dashboardBalanceMode.addEventListener("change", (event) => {
    state.filters.dashboard.balanceMode = event.target.value;
    render();
  });
  elements.dashboardRangeType.addEventListener("change", (event) => {
    state.filters.dashboard.mode = event.target.value;
    render();
  });
  elements.dashboardMonth.addEventListener("change", (event) => {
    state.filters.dashboard.month = event.target.value;
    render();
  });
  elements.dashboardStart.addEventListener("change", (event) => {
    state.filters.dashboard.start = event.target.value;
    render();
  });
  elements.dashboardEnd.addEventListener("change", (event) => {
    state.filters.dashboard.end = event.target.value;
    render();
  });

  elements.transactionDateMode.addEventListener("change", (event) => {
    state.filters.transactions.dateMode = event.target.value;
    render();
  });
  elements.transactionMonth.addEventListener("change", (event) => {
    state.filters.transactions.month = event.target.value;
    render();
  });
  elements.transactionStart.addEventListener("change", (event) => {
    state.filters.transactions.start = event.target.value;
    render();
  });
  elements.transactionEnd.addEventListener("change", (event) => {
    state.filters.transactions.end = event.target.value;
    render();
  });
  elements.transactionCategoryFilter.addEventListener("change", (event) => {
    state.filters.transactions.category = event.target.value;
    render();
  });
  elements.transactionWalletFilter.addEventListener("change", (event) => {
    state.filters.transactions.wallet = event.target.value;
    render();
  });
  elements.transactionTypeFilter.addEventListener("change", (event) => {
    state.filters.transactions.type = event.target.value;
    render();
  });
  elements.transactionSearch.addEventListener("input", (event) => {
    state.filters.transactions.search = event.target.value;
    render();
  });

  elements.assetTypeFilter.addEventListener("change", (event) => {
    state.filters.assets.type = event.target.value;
    render();
  });

  elements.budgetMonthFilter.addEventListener("change", (event) => {
    state.filters.budgeting.month = event.target.value || currentMonth;
    render();
  });

  document.querySelectorAll("[data-transaction-tab]").forEach((button) => {
    button.addEventListener("click", () => switchTransactionTab(button.dataset.transactionTab));
  });

  elements.flowType.addEventListener("change", () => renderCategoryOptions());
  elements.debtType.addEventListener("change", () => syncDebtWalletLabel());

  document.getElementById("openCalculator").addEventListener("click", () => {
    calculatorExpression = String(parseAmountInput(elements.flowAmount.value) || "");
    updateCalculatorDisplay(calculatorExpression);
    openModal("calculatorModal");
  });

  elements.walletForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      id: elements.walletId.value || crypto.randomUUID(),
      name: elements.walletName.value.trim(),
      balance: parseAmountInput(elements.walletBalance.value),
    };
    await withApi(() =>
      apiRequest(elements.walletId.value ? `/api/wallets/${payload.id}` : "/api/wallets", {
        method: elements.walletId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    closeModal("walletModal");
    resetWalletForm();
  });

  elements.assetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.assetWalletId.value) {
      alert("Pilih dompet aset terlebih dahulu.");
      return;
    }
    const payload = {
      id: elements.assetId.value || crypto.randomUUID(),
      walletId: elements.assetWalletId.value,
      name: elements.assetName.value.trim(),
      type: elements.assetType.value,
      accountName: elements.assetAccountName.value.trim(),
      currentValue: parseAmountInput(elements.assetCurrentValue.value),
      purchaseValue: parseAmountInput(elements.assetPurchaseValue.value),
      acquiredDate: elements.assetAcquiredDate.value || "",
      note: elements.assetNote.value.trim(),
    };
    await withApi(() =>
      apiRequest(elements.assetId.value ? `/api/assets/${payload.id}` : "/api/assets", {
        method: elements.assetId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    closeModal("assetModal");
    resetAssetForm();
  });

  elements.categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      id: elements.categoryId.value || crypto.randomUUID(),
      name: elements.categoryName.value.trim(),
      type: elements.categoryType.value,
    };
    await withApi(() =>
      apiRequest(elements.categoryId.value ? `/api/categories/${payload.id}` : "/api/categories", {
        method: elements.categoryId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    closeModal("categoryModal");
    resetCategoryForm();
  });

  elements.budgetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.budgetCategory.value) {
      alert("Tambahkan kategori pengeluaran dulu sebelum membuat budget.");
      return;
    }
    const payload = {
      id: elements.budgetId.value || crypto.randomUUID(),
      categoryId: elements.budgetCategory.value,
      amount: parseAmountInput(elements.budgetAmount.value),
      month: elements.budgetMonth.value || getBudgetMonthValue(),
      carryOverEnabled: elements.budgetCarryOver.checked,
      note: elements.budgetNote.value.trim(),
    };
    await withApi(() =>
      apiRequest(elements.budgetId.value ? `/api/budgets/${payload.id}` : "/api/budgets", {
        method: elements.budgetId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    state.filters.budgeting.month = payload.month;
    closeModal("budgetModal");
    resetBudgetForm();
  });

  elements.savingsTargetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      id: elements.savingsTargetId.value || crypto.randomUUID(),
      month: elements.savingsTargetMonth.value || getBudgetMonthValue(),
      amount: parseAmountInput(elements.savingsTargetAmount.value),
      note: elements.savingsTargetNote.value.trim(),
    };
    await withApi(() =>
      apiRequest(elements.savingsTargetId.value ? `/api/savings-targets/${payload.id}` : "/api/savings-targets", {
        method: elements.savingsTargetId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    closeModal("savingsTargetModal");
    resetSavingsTargetForm();
  });

  elements.flowTransactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.flowWallet.value || !elements.flowCategory.value) {
      alert("Tambahkan wallet dan kategori dulu sebelum menyimpan transaksi.");
      return;
    }
    const payload = {
      id: elements.flowTransactionId.value || crypto.randomUUID(),
      type: elements.flowType.value,
      walletId: elements.flowWallet.value,
      categoryId: elements.flowCategory.value,
      amount: parseAmountInput(elements.flowAmount.value),
      date: normalizeDate(elements.flowDate.value),
      description: elements.flowDescription.value.trim(),
      note: elements.flowNote.value.trim(),
    };
    await withApi(() =>
      apiRequest(elements.flowTransactionId.value ? `/api/transactions/${payload.id}` : "/api/transactions", {
        method: elements.flowTransactionId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    closeModal("transactionModal");
    resetTransactionForms();
  });

  elements.transferForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.transferFromWallet.value || !elements.transferToWallet.value) {
      alert("Tambahkan minimal dua wallet sebelum membuat transfer.");
      return;
    }
    if (elements.transferFromWallet.value === elements.transferToWallet.value) {
      alert("Wallet asal dan tujuan harus berbeda.");
      return;
    }
    const payload = {
      id: elements.transferId.value || crypto.randomUUID(),
      type: "transfer",
      fromWalletId: elements.transferFromWallet.value,
      toWalletId: elements.transferToWallet.value,
      amount: parseAmountInput(elements.transferAmount.value),
      date: normalizeDate(elements.transferDate.value),
      description: elements.transferDescription.value.trim(),
      note: "",
    };
    await withApi(() =>
      apiRequest(elements.transferId.value ? `/api/transactions/${payload.id}` : "/api/transactions", {
        method: elements.transferId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    closeModal("transactionModal");
    resetTransactionForms();
  });

  elements.debtForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.debtWalletId.value) {
      alert("Pilih wallet terlebih dahulu.");
      return;
    }
    const payload = {
      id: elements.debtId.value || crypto.randomUUID(),
      type: elements.debtType.value,
      name: elements.debtName.value.trim(),
      walletId: elements.debtWalletId.value,
      amount: parseAmountInput(elements.debtAmount.value),
      date: normalizeDate(elements.debtDate.value),
      note: elements.debtNote.value.trim(),
    };
    await withApi(() =>
      apiRequest(elements.debtId.value ? `/api/debts/${payload.id}` : "/api/debts", {
        method: elements.debtId.value ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    );
    closeModal("debtModal");
    resetDebtForm();
  });

  elements.paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const debtId = elements.paymentDebtId.value;
    if (!debtId) {
      alert("Pilih data hutang atau piutang terlebih dahulu.");
      return;
    }
    if (!elements.paymentWalletId.value) {
      alert("Pilih wallet terlebih dahulu.");
      return;
    }
    const paymentId = elements.paymentId.value;
    await withApi(() =>
      apiRequest(paymentId ? `/api/debts/${debtId}/payments/${paymentId}` : `/api/debts/${debtId}/payments`, {
        method: paymentId ? "PUT" : "POST",
        body: JSON.stringify({
          id: paymentId || crypto.randomUUID(),
          walletId: elements.paymentWalletId.value,
          amount: parseAmountInput(elements.paymentAmount.value),
          date: normalizeDate(elements.paymentDate.value),
        }),
      }),
    );
    closeModal("paymentModal");
    if (state.activeDebtDetailId) {
      renderDebtDetailModal(state.activeDebtDetailId);
      openModal("debtDetailModal");
    }
  });

  elements.profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideProfileStatus();
    try {
      const response = await apiRequest("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: elements.profileName.value.trim(),
          email: elements.profileEmail.value.trim(),
        }),
      });
      state.authUser = response.user;
      render();
      showProfileStatus("Profil berhasil diperbarui.");
      loadSecurityActivity();
    } catch (error) {
      showProfileStatus(error.message, "error");
    }
  });

  elements.passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideProfileStatus();
    if (elements.newPassword.value !== elements.confirmPassword.value) {
      showProfileStatus("Konfirmasi password baru tidak cocok.", "error");
      return;
    }
    try {
      await apiRequest("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: elements.currentPassword.value,
          newPassword: elements.newPassword.value,
        }),
      });
      elements.passwordForm.reset();
      showProfileStatus("Password berhasil diganti.");
      switchProfileTab("profile");
      loadSecurityActivity();
    } catch (error) {
      showProfileStatus(error.message, "error");
    }
  });

  elements.exportDataButton.addEventListener("click", async () => {
    hideProfileStatus();
    try {
      const payload = await apiRequest("/api/data/export");
      downloadBlob(JSON.stringify(payload, null, 2), "application/json", `dompetku-export-${new Date().toISOString().slice(0, 10)}.json`);
      showProfileStatus("Data berhasil diexport.");
      loadSecurityActivity();
    } catch (error) {
      showProfileStatus(error.message, "error");
    }
  });

  elements.exportExcelButton.addEventListener("click", async () => {
    hideProfileStatus();
    try {
      await refreshAndRender();
      downloadBlob(buildExcelHtml(), "application/vnd.ms-excel", getExportFilename("xls"));
      showProfileStatus("Export Excel berhasil dibuat.");
    } catch (error) {
      showProfileStatus(error.message, "error");
    }
  });

  elements.exportPdfButton.addEventListener("click", async () => {
    hideProfileStatus();
    const reportWindow = window.open("", "_blank", "width=1080,height=820");
    if (!reportWindow) {
      showProfileStatus("Popup diblokir browser. Izinkan popup untuk export PDF.", "error");
      return;
    }
    try {
      await refreshAndRender();
      reportWindow.document.open();
      reportWindow.document.write(buildPrintableReportHtml());
      reportWindow.document.close();
      reportWindow.focus();
      setTimeout(() => reportWindow.print(), 250);
      showProfileStatus("Preview PDF dibuka. Pilih Save as PDF di dialog print.");
    } catch (error) {
      reportWindow.close();
      showProfileStatus(error.message, "error");
    }
  });

  elements.importDataButton.addEventListener("click", () => {
    elements.importDataInput.click();
  });

  elements.importDataInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    hideProfileStatus();
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await apiRequest("/api/data/import", {
        method: "POST",
        body: JSON.stringify({ payload }),
      });
      await refreshAndRender();
      showProfileStatus("Data berhasil diimport.");
      loadSecurityActivity();
      loadSystemInfo();
    } catch (error) {
      showProfileStatus(error.message || "File import tidak valid.", "error");
    } finally {
      elements.importDataInput.value = "";
    }
  });

  elements.backupNowButton.addEventListener("click", async () => {
    hideProfileStatus();
    try {
      await apiRequest("/api/system/backup", { method: "POST" });
      showProfileStatus("Backup database berhasil dibuat.");
      loadSecurityActivity();
      loadSystemInfo();
    } catch (error) {
      showProfileStatus(error.message, "error");
    }
  });

  elements.deleteAccountForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideProfileStatus();
    const approved = await showConfirmModal({
      title: "Hapus Akun Permanen?",
      message: "Seluruh data akun, transaksi, budget, dan riwayat aktivitas akan ikut terhapus.",
      confirmLabel: "Hapus Akun",
      tone: "danger",
    });
    if (!approved) {
      return;
    }
    try {
      await apiRequest("/api/auth/delete-account", {
        method: "POST",
        body: JSON.stringify({ password: elements.deleteAccountPassword.value }),
      });
      clearAppData();
      closeAllModals();
      elements.loginForm.reset();
      elements.registerForm.reset();
      showAuthScreen();
      switchAuthTab("register");
      showAuthStatus("Akun berhasil dihapus. Kamu bisa membuat akun baru.", "success");
    } catch (error) {
      showProfileStatus(error.message, "error");
    }
  });
}

async function initializeApp() {
  buildCalculator();
  attachEvents();
  setupAmountInputFormatters();
  switchAuthTab("login");
  resetTransactionForms();
  resetDebtForm();
  try {
    await loadAuthUser();
    if (state.authUser) {
      showAppScreen();
      await refreshAndRender();
    } else {
      showAuthScreen();
    }
  } catch (error) {
    console.error("App initialization failed:", error);
    showAuthScreen();
    showAuthStatus(`Gagal memuat aplikasi: ${error?.message || "Terjadi kesalahan tak terduga."}`);
  }
}

initializeApp();

document.getElementById("currentYear").textContent = new Date().getFullYear();

const sidebarYearEl = document.getElementById("sidebarYear");
if (sidebarYearEl) sidebarYearEl.textContent = new Date().getFullYear();
