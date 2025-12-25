const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const LicensingMiddleware = require('../middleware/licensing');

/**
 * Accounting Routes
 * All accounting, GL, and reporting endpoints
 * Requires authentication and appropriate license tier
 */

module.exports = (controller) => {
  // Helper middleware to enforce license tier
  const requireLicense = (tiers) => {
    return (req, res, next) => {
      if (!req.license?.isValid) {
        return res.status(403).json({
          success: false,
          error: 'License required',
          message: 'This feature requires a valid license'
        });
      }

      const licenseType = req.license.type?.toLowerCase();
      const allowedTiers = tiers.map(t => t.toLowerCase());

      if (!allowedTiers.includes(licenseType)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient license',
          message: `This feature requires ${tiers.join(' or ')} license. Your license: ${req.license.type || 'None'}`,
          requiredTier: tiers,
          currentTier: req.license.type
        });
      }

      next();
    };
  };

  // Chart of Accounts Routes
  router.post('/accounts', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.createAccount(req, res, next);
  });

  router.get('/accounts', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getChartOfAccounts(req, res, next);
  });

  router.get('/accounts/:accountNumber', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getAccount(req, res, next);
  });

  router.put('/accounts/:accountNumber', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.updateAccount(req, res, next);
  });

  // Journal Entry Routes
  router.post('/journal-entries', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.postJournalEntry(req, res, next);
  });

  // General Ledger Routes
  router.get('/general-ledger/:accountNumber', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getGeneralLedger(req, res, next);
  });

  // Trial Balance Routes
  router.get('/trial-balance', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getTrialBalance(req, res, next);
  });

  // Financial Statement Routes
  router.get('/income-statement', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getIncomeStatement(req, res, next);
  });

  router.get('/balance-sheet', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getBalanceSheet(req, res, next);
  });

  router.get('/cash-flow', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getCashFlowStatement(req, res, next);
  });

  // Expense Routes
  router.post('/expenses', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.recordExpense(req, res, next);
  });

  router.get('/expenses', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getExpenses(req, res, next);
  });

  router.put('/expenses/:expenseId/approve', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.approveExpense(req, res, next);
  });

  // Supplier Routes
  router.get('/suppliers', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getSuppliers(req, res, next);
  });

  router.post('/suppliers', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.createSupplier(req, res, next);
  });

  // Budget Analysis Routes
  router.get('/budget-analysis', authMiddleware, LicensingMiddleware.validateLicense, requireLicense(['Professional', 'Enterprise']), (req, res, next) => {
    controller.getBudgetAnalysis(req, res, next);
  });

  return router;
};
