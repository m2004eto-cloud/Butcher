/**
 * Finance Management Routes
 * Comprehensive financial management, reporting, and accounting
 */

import { Router, RequestHandler } from "express";
import type {
  FinanceTransaction,
  FinanceAccount,
  FinanceExpense,
  FinanceSummary,
  ProfitLossReport,
  CashFlowReport,
  VATReport,
  CreateExpenseRequest,
  TransactionType,
  TransactionStatus,
  ExpenseCategory,
  ApiResponse,
  Currency,
} from "@shared/api";
import { db, generateId } from "../db";

const router = Router();

// =====================================================
// MOCK DATA
// =====================================================

const financeAccounts: FinanceAccount[] = [
  {
    id: "acc-001",
    name: "Main Business Account",
    nameAr: "الحساب التجاري الرئيسي",
    type: "bank",
    balance: 125000,
    currency: "AED",
    isActive: true,
    bankName: "Emirates NBD",
    accountNumber: "****4521",
    iban: "AE07033*************4521",
    lastReconciled: "2026-01-05T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-01-11T00:00:00Z",
  },
  {
    id: "acc-002",
    name: "Card Payments",
    nameAr: "مدفوعات البطاقات",
    type: "card_payments",
    balance: 45000,
    currency: "AED",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-01-11T00:00:00Z",
  },
  {
    id: "acc-003",
    name: "COD Collections",
    nameAr: "تحصيلات الدفع عند الاستلام",
    type: "cod_collections",
    balance: 8500,
    currency: "AED",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-01-11T00:00:00Z",
  },
  {
    id: "acc-004",
    name: "Petty Cash",
    nameAr: "النثرية",
    type: "petty_cash",
    balance: 2500,
    currency: "AED",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-01-11T00:00:00Z",
  },
];

const financeTransactions: FinanceTransaction[] = [
  {
    id: "txn-001",
    type: "sale",
    status: "completed",
    amount: 450,
    currency: "AED",
    description: "Order #ORD-001 - Card Payment",
    reference: "ORD-001",
    referenceType: "order",
    referenceId: "ord-001",
    accountId: "acc-002",
    accountName: "Card Payments",
    createdBy: "system",
    createdAt: "2026-01-11T10:30:00Z",
    updatedAt: "2026-01-11T10:30:00Z",
  },
  {
    id: "txn-002",
    type: "sale",
    status: "completed",
    amount: 280,
    currency: "AED",
    description: "Order #ORD-002 - COD Payment",
    reference: "ORD-002",
    referenceType: "order",
    referenceId: "ord-002",
    accountId: "acc-003",
    accountName: "COD Collections",
    createdBy: "system",
    createdAt: "2026-01-11T11:45:00Z",
    updatedAt: "2026-01-11T11:45:00Z",
  },
  {
    id: "txn-003",
    type: "expense",
    status: "completed",
    amount: -1500,
    currency: "AED",
    description: "Monthly Electricity Bill",
    category: "utilities",
    referenceType: "expense",
    referenceId: "exp-001",
    accountId: "acc-001",
    accountName: "Main Business Account",
    createdBy: "admin",
    createdAt: "2026-01-10T09:00:00Z",
    updatedAt: "2026-01-10T09:00:00Z",
  },
  {
    id: "txn-004",
    type: "purchase",
    status: "completed",
    amount: -8500,
    currency: "AED",
    description: "Supplier Payment - Premium Meat Suppliers",
    reference: "PO-2026-001",
    referenceType: "purchase_order",
    referenceId: "po-001",
    accountId: "acc-001",
    accountName: "Main Business Account",
    createdBy: "admin",
    createdAt: "2026-01-09T14:00:00Z",
    updatedAt: "2026-01-09T14:00:00Z",
  },
  {
    id: "txn-005",
    type: "refund",
    status: "completed",
    amount: -75,
    currency: "AED",
    description: "Refund for Order #ORD-003",
    reference: "REF-001",
    referenceType: "refund",
    referenceId: "ref-001",
    accountId: "acc-002",
    accountName: "Card Payments",
    createdBy: "admin",
    createdAt: "2026-01-08T16:30:00Z",
    updatedAt: "2026-01-08T16:30:00Z",
  },
];

const financeExpenses: FinanceExpense[] = [
  {
    id: "exp-001",
    category: "utilities",
    amount: 1500,
    currency: "AED",
    description: "Monthly Electricity Bill - January",
    descriptionAr: "فاتورة الكهرباء الشهرية - يناير",
    vendor: "DEWA",
    invoiceNumber: "INV-DEWA-2026-001",
    invoiceDate: "2026-01-05T00:00:00Z",
    dueDate: "2026-01-20T00:00:00Z",
    paidAt: "2026-01-10T09:00:00Z",
    status: "paid",
    accountId: "acc-001",
    createdBy: "admin",
    createdAt: "2026-01-05T10:00:00Z",
    updatedAt: "2026-01-10T09:00:00Z",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    id: "exp-002",
    category: "rent",
    amount: 15000,
    currency: "AED",
    description: "Shop Rent - January",
    descriptionAr: "إيجار المحل - يناير",
    vendor: "Emirates Properties",
    invoiceNumber: "RENT-2026-001",
    invoiceDate: "2026-01-01T00:00:00Z",
    dueDate: "2026-01-05T00:00:00Z",
    paidAt: "2026-01-03T10:00:00Z",
    status: "paid",
    accountId: "acc-001",
    createdBy: "admin",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-01-03T10:00:00Z",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    id: "exp-003",
    category: "salaries",
    amount: 35000,
    currency: "AED",
    description: "Staff Salaries - January",
    descriptionAr: "رواتب الموظفين - يناير",
    invoiceDate: "2026-01-28T00:00:00Z",
    dueDate: "2026-01-31T00:00:00Z",
    status: "pending",
    createdBy: "admin",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-01-01T08:00:00Z",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    id: "exp-004",
    category: "delivery",
    amount: 2500,
    currency: "AED",
    description: "Delivery Vehicle Fuel",
    descriptionAr: "وقود سيارة التوصيل",
    vendor: "ADNOC",
    invoiceDate: "2026-01-08T00:00:00Z",
    paidAt: "2026-01-08T14:00:00Z",
    status: "paid",
    accountId: "acc-004",
    createdBy: "admin",
    createdAt: "2026-01-08T14:00:00Z",
    updatedAt: "2026-01-08T14:00:00Z",
  },
  {
    id: "exp-005",
    category: "marketing",
    amount: 5000,
    currency: "AED",
    description: "Social Media Advertising - January",
    descriptionAr: "إعلانات وسائل التواصل الاجتماعي - يناير",
    vendor: "Meta Ads",
    invoiceNumber: "META-2026-001",
    invoiceDate: "2026-01-01T00:00:00Z",
    dueDate: "2026-01-15T00:00:00Z",
    status: "overdue",
    createdBy: "admin",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-01-01T08:00:00Z",
  },
];

// Helper functions
function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

// =====================================================
// SUMMARY & DASHBOARD
// =====================================================

const getFinanceSummary: RequestHandler = (req, res) => {
  try {
    const { period = "month", startDate, endDate } = req.query;
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      const range = getDateRange(period as string);
      start = range.start;
      end = range.end;
    }

    // Get orders in date range
    const orders = Array.from(db.orders.values()).filter(
      (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end && o.status !== "cancelled"
    );

    // Calculate revenue metrics
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalVAT = orders.reduce((sum, o) => sum + o.vatAmount, 0);
    const totalRefunds = financeTransactions
      .filter((t) => t.type === "refund" && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate COGS
    let totalCOGS = 0;
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = db.products.get(item.productId);
        if (product) {
          totalCOGS += product.costPrice * item.quantity;
        }
      });
    });

    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate expenses
    const periodExpenses = financeExpenses.filter(
      (e) => new Date(e.createdAt) >= start && new Date(e.createdAt) <= end
    );
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = grossProfit - totalExpenses;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Revenue by payment method
    const paymentMethodRevenue: Record<string, { amount: number; count: number }> = {};
    orders.forEach((o) => {
      const method = o.paymentMethod || "unknown";
      if (!paymentMethodRevenue[method]) {
        paymentMethodRevenue[method] = { amount: 0, count: 0 };
      }
      paymentMethodRevenue[method].amount += o.total;
      paymentMethodRevenue[method].count += 1;
    });

    // Expenses by category
    const expensesByCategory: Record<string, { amount: number; count: number }> = {};
    periodExpenses.forEach((e) => {
      if (!expensesByCategory[e.category]) {
        expensesByCategory[e.category] = { amount: 0, count: 0 };
      }
      expensesByCategory[e.category].amount += e.amount;
      expensesByCategory[e.category].count += 1;
    });

    // Cash flow
    const inflow = totalRevenue;
    const outflow = totalExpenses + totalCOGS + totalRefunds;

    const summary: FinanceSummary = {
      period: period as string,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCOGS: Math.round(totalCOGS * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      vatCollected: Math.round(totalVAT * 100) / 100,
      vatPaid: 0,
      vatDue: Math.round(totalVAT * 100) / 100,
      cashFlow: {
        inflow: Math.round(inflow * 100) / 100,
        outflow: Math.round(outflow * 100) / 100,
        net: Math.round((inflow - outflow) * 100) / 100,
      },
      revenueByPaymentMethod: Object.entries(paymentMethodRevenue).map(([method, data]) => ({
        method,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
      })),
      expensesByCategory: Object.entries(expensesByCategory).map(([category, data]) => ({
        category: category as ExpenseCategory,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count,
      })),
      accountBalances: financeAccounts.map((a) => ({
        accountId: a.id,
        accountName: a.name,
        balance: a.balance,
      })),
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to get finance summary" });
  }
};

// =====================================================
// TRANSACTIONS
// =====================================================

const getTransactions: RequestHandler = (req, res) => {
  try {
    const { type, status, startDate, endDate, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let transactions = [...financeTransactions];

    if (type) transactions = transactions.filter((t) => t.type === type);
    if (status) transactions = transactions.filter((t) => t.status === status);
    if (startDate) transactions = transactions.filter((t) => new Date(t.createdAt) >= new Date(startDate as string));
    if (endDate) transactions = transactions.filter((t) => new Date(t.createdAt) <= new Date(endDate as string));

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const paginatedTransactions = transactions.slice(start, start + limitNum);

    res.json({ success: true, data: paginatedTransactions });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get transactions" });
  }
};

const getTransactionById: RequestHandler = (req, res) => {
  const transaction = financeTransactions.find((t) => t.id === req.params.id);
  if (!transaction) {
    return res.status(404).json({ success: false, error: "Transaction not found" });
  }
  res.json({ success: true, data: transaction });
};

// =====================================================
// ACCOUNTS
// =====================================================

const getAccounts: RequestHandler = (req, res) => {
  res.json({ success: true, data: financeAccounts });
};

const getAccountById: RequestHandler = (req, res) => {
  const account = financeAccounts.find((a) => a.id === req.params.id);
  if (!account) {
    return res.status(404).json({ success: false, error: "Account not found" });
  }
  res.json({ success: true, data: account });
};

const createAccount: RequestHandler = (req, res) => {
  const newAccount: FinanceAccount = {
    ...req.body,
    id: generateId("acc"),
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  financeAccounts.push(newAccount);
  res.status(201).json({ success: true, data: newAccount });
};

const updateAccount: RequestHandler = (req, res) => {
  const index = financeAccounts.findIndex((a) => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Account not found" });
  }
  financeAccounts[index] = {
    ...financeAccounts[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, data: financeAccounts[index] });
};

const transferBetweenAccounts: RequestHandler = (req, res) => {
  const { fromAccountId, toAccountId, amount, notes } = req.body;

  const fromAccount = financeAccounts.find((a) => a.id === fromAccountId);
  const toAccount = financeAccounts.find((a) => a.id === toAccountId);

  if (!fromAccount || !toAccount) {
    return res.status(404).json({ success: false, error: "Account not found" });
  }

  if (fromAccount.balance < amount) {
    return res.status(400).json({ success: false, error: "Insufficient balance" });
  }

  fromAccount.balance -= amount;
  toAccount.balance += amount;
  fromAccount.updatedAt = new Date().toISOString();
  toAccount.updatedAt = new Date().toISOString();

  // Create transaction records
  const timestamp = new Date().toISOString();
  financeTransactions.push({
    id: generateId("txn"),
    type: "adjustment",
    status: "completed",
    amount: -amount,
    currency: "AED",
    description: `Transfer to ${toAccount.name}`,
    referenceType: "manual",
    accountId: fromAccountId,
    accountName: fromAccount.name,
    createdBy: "admin",
    createdAt: timestamp,
    updatedAt: timestamp,
    notes,
  });

  financeTransactions.push({
    id: generateId("txn"),
    type: "adjustment",
    status: "completed",
    amount: amount,
    currency: "AED",
    description: `Transfer from ${fromAccount.name}`,
    referenceType: "manual",
    accountId: toAccountId,
    accountName: toAccount.name,
    createdBy: "admin",
    createdAt: timestamp,
    updatedAt: timestamp,
    notes,
  });

  res.json({ success: true, data: { from: fromAccount, to: toAccount } });
};

const reconcileAccount: RequestHandler = (req, res) => {
  const { statementBalance, reconciliationDate } = req.body;
  const account = financeAccounts.find((a) => a.id === req.params.id);

  if (!account) {
    return res.status(404).json({ success: false, error: "Account not found" });
  }

  const difference = statementBalance - account.balance;
  if (difference !== 0) {
    // Create adjustment transaction
    financeTransactions.push({
      id: generateId("txn"),
      type: "adjustment",
      status: "completed",
      amount: difference,
      currency: "AED",
      description: `Reconciliation adjustment`,
      referenceType: "manual",
      accountId: account.id,
      accountName: account.name,
      createdBy: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: `Reconciliation on ${reconciliationDate}`,
    });
    account.balance = statementBalance;
  }

  account.lastReconciled = reconciliationDate;
  account.updatedAt = new Date().toISOString();

  res.json({ success: true, data: account });
};

// =====================================================
// EXPENSES
// =====================================================

const getExpenses: RequestHandler = (req, res) => {
  try {
    const { category, status, startDate, endDate, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    let expenses = [...financeExpenses];

    if (category) expenses = expenses.filter((e) => e.category === category);
    if (status) expenses = expenses.filter((e) => e.status === status);
    if (startDate) expenses = expenses.filter((e) => new Date(e.createdAt) >= new Date(startDate as string));
    if (endDate) expenses = expenses.filter((e) => new Date(e.createdAt) <= new Date(endDate as string));

    // Sort by date descending
    expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const start = (pageNum - 1) * limitNum;
    const paginatedExpenses = expenses.slice(start, start + limitNum);

    res.json({ success: true, data: paginatedExpenses });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to get expenses" });
  }
};

const createExpense: RequestHandler = (req, res) => {
  const data = req.body as CreateExpenseRequest;
  const newExpense: FinanceExpense = {
    id: generateId("exp"),
    ...data,
    currency: "AED",
    status: "pending",
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  financeExpenses.push(newExpense);
  res.status(201).json({ success: true, data: newExpense });
};

const updateExpense: RequestHandler = (req, res) => {
  const index = financeExpenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Expense not found" });
  }
  financeExpenses[index] = {
    ...financeExpenses[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, data: financeExpenses[index] });
};

const deleteExpense: RequestHandler = (req, res) => {
  const index = financeExpenses.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Expense not found" });
  }
  financeExpenses.splice(index, 1);
  res.json({ success: true, data: null });
};

const markExpensePaid: RequestHandler = (req, res) => {
  const { accountId } = req.body;
  const expense = financeExpenses.find((e) => e.id === req.params.id);

  if (!expense) {
    return res.status(404).json({ success: false, error: "Expense not found" });
  }

  const account = financeAccounts.find((a) => a.id === accountId);
  if (!account) {
    return res.status(404).json({ success: false, error: "Account not found" });
  }

  // Update expense
  expense.status = "paid";
  expense.paidAt = new Date().toISOString();
  expense.accountId = accountId;
  expense.updatedAt = new Date().toISOString();

  // Deduct from account
  account.balance -= expense.amount;
  account.updatedAt = new Date().toISOString();

  // Create transaction
  financeTransactions.push({
    id: generateId("txn"),
    type: "expense",
    status: "completed",
    amount: -expense.amount,
    currency: "AED",
    description: expense.description,
    category: expense.category,
    referenceType: "expense",
    referenceId: expense.id,
    accountId: account.id,
    accountName: account.name,
    createdBy: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.json({ success: true, data: expense });
};

// =====================================================
// REPORTS
// =====================================================

const getProfitLossReport: RequestHandler = (req, res) => {
  try {
    const { period = "month", startDate, endDate } = req.query;
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      const range = getDateRange(period as string);
      start = range.start;
      end = range.end;
    }

    // Get orders
    const orders = Array.from(db.orders.values()).filter(
      (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end && o.status !== "cancelled"
    );

    const sales = orders.reduce((sum, o) => sum + o.total, 0);
    const otherIncome = 0; // Could be from other sources
    const totalRevenue = sales + otherIncome;

    // COGS
    let inventoryCost = 0;
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const product = db.products.get(item.productId);
        if (product) {
          inventoryCost += product.costPrice * item.quantity;
        }
      });
    });

    const supplierPurchases = financeTransactions
      .filter((t) => t.type === "purchase" && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCOGS = inventoryCost;
    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Operating expenses by category
    const periodExpenses = financeExpenses.filter(
      (e) => new Date(e.createdAt) >= start && new Date(e.createdAt) <= end && e.status === "paid"
    );

    const expenseByCategory: Record<ExpenseCategory, number> = {} as any;
    periodExpenses.forEach((e) => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    const operatingExpenses = Object.entries(expenseByCategory).map(([category, amount]) => ({
      category: category as ExpenseCategory,
      amount,
    }));

    const totalOperatingExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const operatingProfit = grossProfit - totalOperatingExpenses;

    // Other expenses
    const vatPaid = 0;
    const refunds = financeTransactions
      .filter((t) => t.type === "refund" && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalOther = vatPaid + refunds;
    const netProfit = operatingProfit - totalOther;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const report: ProfitLossReport = {
      period: period as string,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      revenue: {
        sales: Math.round(sales * 100) / 100,
        otherIncome,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
      costOfGoodsSold: {
        inventoryCost: Math.round(inventoryCost * 100) / 100,
        supplierPurchases: Math.round(supplierPurchases * 100) / 100,
        totalCOGS: Math.round(totalCOGS * 100) / 100,
      },
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      operatingExpenses,
      totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
      operatingProfit: Math.round(operatingProfit * 100) / 100,
      otherExpenses: {
        vatPaid,
        refunds: Math.round(refunds * 100) / 100,
        totalOther: Math.round(totalOther * 100) / 100,
      },
      netProfit: Math.round(netProfit * 100) / 100,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
    };

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to generate profit/loss report" });
  }
};

const getCashFlowReport: RequestHandler = (req, res) => {
  try {
    const { period = "month", startDate, endDate } = req.query;
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      const range = getDateRange(period as string);
      start = range.start;
      end = range.end;
    }

    // Opening balance (sum of all accounts)
    const openingBalance = financeAccounts.reduce((sum, a) => sum + a.balance, 0) - 
      financeTransactions
        .filter((t) => new Date(t.createdAt) >= start)
        .reduce((sum, t) => sum + t.amount, 0);

    // Get orders
    const orders = Array.from(db.orders.values()).filter(
      (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end && o.status !== "cancelled"
    );

    const cardOrders = orders.filter((o) => o.paymentMethod === "card");
    const codOrders = orders.filter((o) => o.paymentMethod === "cod");

    const cashFromSales = cardOrders.reduce((sum, o) => sum + o.total, 0);
    const cashFromCOD = codOrders.reduce((sum, o) => sum + o.total, 0);

    const cashFromRefunds = financeTransactions
      .filter((t) => t.type === "refund" && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end)
      .reduce((sum, t) => sum + t.amount, 0);

    const cashToSuppliers = financeTransactions
      .filter((t) => t.type === "purchase" && new Date(t.createdAt) >= start && new Date(t.createdAt) <= end)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const cashToExpenses = financeExpenses
      .filter((e) => e.status === "paid" && e.paidAt && new Date(e.paidAt) >= start && new Date(e.paidAt) <= end)
      .reduce((sum, e) => sum + e.amount, 0);

    const netOperating = cashFromSales + cashFromCOD + cashFromRefunds - cashToSuppliers - cashToExpenses;

    const closingBalance = financeAccounts.reduce((sum, a) => sum + a.balance, 0);
    const netCashFlow = closingBalance - openingBalance;

    // Daily cash flow
    const dailyCashFlow: CashFlowReport["dailyCashFlow"] = [];
    const currentDate = new Date(start);
    let runningBalance = openingBalance;

    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59);

      const dayInflow = financeTransactions
        .filter((t) => t.amount > 0 && new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayOutflow = Math.abs(
        financeTransactions
          .filter((t) => t.amount < 0 && new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd)
          .reduce((sum, t) => sum + t.amount, 0)
      );

      const dayNet = dayInflow - dayOutflow;
      runningBalance += dayNet;

      dailyCashFlow.push({
        date: currentDate.toISOString().split("T")[0],
        inflow: Math.round(dayInflow * 100) / 100,
        outflow: Math.round(dayOutflow * 100) / 100,
        net: Math.round(dayNet * 100) / 100,
        balance: Math.round(runningBalance * 100) / 100,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const report: CashFlowReport = {
      period: period as string,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      openingBalance: Math.round(openingBalance * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      operatingActivities: {
        cashFromSales: Math.round(cashFromSales * 100) / 100,
        cashFromCOD: Math.round(cashFromCOD * 100) / 100,
        cashFromRefunds: Math.round(cashFromRefunds * 100) / 100,
        cashToSuppliers: Math.round(cashToSuppliers * 100) / 100,
        cashToExpenses: Math.round(cashToExpenses * 100) / 100,
        netOperating: Math.round(netOperating * 100) / 100,
      },
      investingActivities: {
        equipmentPurchases: 0,
        netInvesting: 0,
      },
      financingActivities: {
        ownerDrawings: 0,
        capitalInjection: 0,
        netFinancing: 0,
      },
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      dailyCashFlow,
    };

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to generate cash flow report" });
  }
};

const getVATReport: RequestHandler = (req, res) => {
  try {
    const { period = "month", startDate, endDate } = req.query;
    let start: Date, end: Date;

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      const range = getDateRange(period as string);
      start = range.start;
      end = range.end;
    }

    // Get orders for sales VAT
    const orders = Array.from(db.orders.values()).filter(
      (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end && o.status !== "cancelled"
    );

    const salesTaxableAmount = orders.reduce((sum, o) => sum + (o.total - o.vatAmount), 0);
    const salesVATAmount = orders.reduce((sum, o) => sum + o.vatAmount, 0);

    // Purchases VAT (from supplier invoices)
    const purchasesTaxableAmount = 0;
    const purchasesVATAmount = 0;

    const vatDue = salesVATAmount - purchasesVATAmount;
    const vatRefund = vatDue < 0 ? Math.abs(vatDue) : 0;
    const netVAT = vatDue > 0 ? vatDue : 0;

    // Transaction details
    const transactionDetails = orders.map((o) => ({
      date: o.createdAt,
      type: "sale" as const,
      reference: o.orderNumber,
      taxableAmount: Math.round((o.total - o.vatAmount) * 100) / 100,
      vatAmount: Math.round(o.vatAmount * 100) / 100,
      vatRate: 5,
    }));

    const report: VATReport = {
      period: period as string,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      salesVAT: {
        taxableAmount: Math.round(salesTaxableAmount * 100) / 100,
        vatAmount: Math.round(salesVATAmount * 100) / 100,
        exemptAmount: 0,
      },
      purchasesVAT: {
        taxableAmount: Math.round(purchasesTaxableAmount * 100) / 100,
        vatAmount: Math.round(purchasesVATAmount * 100) / 100,
      },
      vatDue: Math.round(vatDue * 100) / 100,
      vatRefund: Math.round(vatRefund * 100) / 100,
      netVAT: Math.round(netVAT * 100) / 100,
      transactionDetails,
    };

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to generate VAT report" });
  }
};

const exportReport: RequestHandler = (req, res) => {
  const { reportType, format, startDate, endDate } = req.body;
  
  // In production, generate actual files
  res.json({
    success: true,
    data: {
      url: `/api/finance/reports/download/${reportType}-${format}-${Date.now()}`,
      filename: `${reportType}-report-${startDate}-${endDate}.${format}`,
    },
  });
};

// =====================================================
// ROUTES
// =====================================================

router.get("/summary", getFinanceSummary);
router.get("/transactions", getTransactions);
router.get("/transactions/:id", getTransactionById);
router.get("/accounts", getAccounts);
router.get("/accounts/:id", getAccountById);
router.post("/accounts", createAccount);
router.put("/accounts/:id", updateAccount);
router.post("/accounts/transfer", transferBetweenAccounts);
router.post("/accounts/:id/reconcile", reconcileAccount);
router.get("/expenses", getExpenses);
router.post("/expenses", createExpense);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);
router.post("/expenses/:id/pay", markExpensePaid);
router.get("/reports/profit-loss", getProfitLossReport);
router.get("/reports/cash-flow", getCashFlowReport);
router.get("/reports/vat", getVATReport);
router.post("/reports/export", exportReport);

export default router;
