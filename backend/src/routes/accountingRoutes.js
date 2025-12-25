const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const licensing = require('../middleware/licensing');

/**
 * Accounting Routes
 * All accounting, GL, and reporting endpoints
 * Requires authentication and appropriate license tier
 */

module.exports = (controller) => {
  // Chart of Accounts Routes
  router.post('/accounts', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.createAccount(req, res, next);
  });

  router.get('/accounts', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getChartOfAccounts(req, res, next);
  });

  router.get('/accounts/:accountNumber', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getAccount(req, res, next);
  });

  router.put('/accounts/:accountNumber', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.updateAccount(req, res, next);
  });

  // Journal Entry Routes
  router.post('/journal-entries', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.postJournalEntry(req, res, next);
  });

  // General Ledger Routes
  router.get('/general-ledger/:accountNumber', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getGeneralLedger(req, res, next);
  });

  // Trial Balance Routes
  router.get('/trial-balance', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getTrialBalance(req, res, next);
  });

  // Financial Statement Routes
  router.get('/income-statement', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getIncomeStatement(req, res, next);
  });

  router.get('/balance-sheet', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getBalanceSheet(req, res, next);
  });

  router.get('/cash-flow', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getCashFlowStatement(req, res, next);
  });

  // Expense Routes
  router.post('/expenses', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.recordExpense(req, res, next);
  });

  router.get('/expenses', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getExpenses(req, res, next);
  });

  router.put('/expenses/:expenseId/approve', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.approveExpense(req, res, next);
  });

  // Supplier Routes
  router.get('/suppliers', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getSuppliers(req, res, next);
  });

  router.post('/suppliers', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.createSupplier(req, res, next);
  });

  // Budget Analysis Routes
  router.get('/budget-analysis', auth, licensing(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getBudgetAnalysis(req, res, next);
  });

  return router;
};
