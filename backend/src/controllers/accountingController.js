const { v4: uuidv4 } = require('uuid');
const logger = require('../middleware/logger');

/**
 * Accounting Controller
 * Handles all general ledger, chart of accounts, and financial reporting
 */
class AccountingController {
  constructor(accountingService, models) {
    this.accountingService = accountingService;
    this.models = models;
  }

  /**
   * Create Chart of Accounts entry
   * POST /api/accounting/accounts
   */
  async createAccount(req, res, next) {
    try {
      const {
        accountNumber,
        accountName,
        accountType,
        subType,
        normalBalance,
        description
      } = req.body;

      // Validate required fields
      if (!accountNumber || !accountName || !accountType || !normalBalance) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: accountNumber, accountName, accountType, normalBalance'
        });
      }

      // Validate account type
      const validTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'Contra-Asset', 'Contra-Liability'];
      if (!validTypes.includes(accountType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid account type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      // Check if account number already exists
      const existing = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Account number ${accountNumber} already exists`
        });
      }

      // Create account
      const account = await this.models.ChartOfAccounts.create({
        accountNumber,
        accountName,
        accountType,
        subType,
        normalBalance,
        description,
        createdBy: req.user?.id || 'system'
      });

      logger.info(`Account created: ${accountNumber} - ${accountName}`);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: account
      });
    } catch (error) {
      logger.error('Error creating account:', error);
      next(error);
    }
  }

  /**
   * Get Chart of Accounts
   * GET /api/accounting/accounts
   */
  async getChartOfAccounts(req, res, next) {
    try {
      const { accountType, isActive } = req.query;

      const where = {};
      if (accountType) where.accountType = accountType;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const accounts = await this.models.ChartOfAccounts.findAll({
        where,
        order: [['accountNumber', 'ASC']]
      });

      // Group by type
      const grouped = accounts.reduce((acc, account) => {
        if (!acc[account.accountType]) {
          acc[account.accountType] = [];
        }
        acc[account.accountType].push(account);
        return acc;
      }, {});

      res.json({
        success: true,
        data: accounts,
        grouped,
        total: accounts.length
      });
    } catch (error) {
      logger.error('Error fetching accounts:', error);
      next(error);
    }
  }

  /**
   * Get single account
   * GET /api/accounting/accounts/:accountNumber
   */
  async getAccount(req, res, next) {
    try {
      const account = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: req.params.accountNumber }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      res.json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error('Error fetching account:', error);
      next(error);
    }
  }

  /**
   * Update account
   * PUT /api/accounting/accounts/:accountNumber
   */
  async updateAccount(req, res, next) {
    try {
      const { accountName, subType, isActive, description } = req.body;

      const account = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: req.params.accountNumber }
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      await account.update({
        accountName: accountName || account.accountName,
        subType: subType || account.subType,
        isActive: isActive !== undefined ? isActive : account.isActive,
        description: description || account.description
      });

      logger.info(`Account updated: ${req.params.accountNumber}`);

      res.json({
        success: true,
        message: 'Account updated successfully',
        data: account
      });
    } catch (error) {
      logger.error('Error updating account:', error);
      next(error);
    }
  }

  /**
   * Post Journal Entry
   * POST /api/accounting/journal-entries
   */
  async postJournalEntry(req, res, next) {
    try {
      const {
        entryDate,
        description,
        reference,
        referenceType,
        entries, // Array of { accountNumber, debitAmount, creditAmount, description }
        memo
      } = req.body;

      // Validate required fields
      if (!entryDate || !description || !entries || entries.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: entryDate, description, entries'
        });
      }

      // Validate entries balance
      let totalDebits = 0;
      let totalCredits = 0;

      for (const entry of entries) {
        if (entry.debitAmount) totalDebits += parseFloat(entry.debitAmount);
        if (entry.creditAmount) totalCredits += parseFloat(entry.creditAmount);
      }

      // Check if balanced (with rounding tolerance)
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Journal entry not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`
        });
      }

      // Create entry number
      const entryCount = await this.models.JournalEntry.count();
      const entryNumber = `JE${new Date().getFullYear()}${String(entryCount + 1).padStart(6, '0')}`;

      // Create journal entry
      const je = await this.models.JournalEntry.create({
        entryNumber,
        entryDate,
        description,
        reference,
        referenceType,
        totalAmount: totalDebits,
        status: 'posted',
        memo,
        createdBy: req.user?.id || 'system'
      });

      // Create GL entries and update account balances
      for (const entry of entries) {
        const account = await this.models.ChartOfAccounts.findOne({
          where: { accountNumber: entry.accountNumber }
        });

        if (!account) {
          return res.status(404).json({
            success: false,
            message: `Account ${entry.accountNumber} not found`
          });
        }

        // Create GL entry
        await this.models.GeneralLedger.create({
          journalEntryId: je.id,
          accountId: account.id,
          accountNumber: entry.accountNumber,
          debitAmount: entry.debitAmount || 0,
          creditAmount: entry.creditAmount || 0,
          description: entry.description,
          entryDate,
          reference,
          referenceType
        });

        // Update account balance
        let newBalance = parseFloat(account.balance);
        if (entry.debitAmount) newBalance += parseFloat(entry.debitAmount);
        if (entry.creditAmount) newBalance -= parseFloat(entry.creditAmount);

        await account.update({ balance: newBalance });
      }

      logger.info(`Journal entry posted: ${entryNumber}`);

      res.status(201).json({
        success: true,
        message: 'Journal entry posted successfully',
        data: {
          entryNumber,
          entryDate,
          description,
          totalAmount: totalDebits,
          entriesCount: entries.length
        }
      });
    } catch (error) {
      logger.error('Error posting journal entry:', error);
      next(error);
    }
  }

  /**
   * Get General Ledger
   * GET /api/accounting/general-ledger/:accountNumber
   */
  async getGeneralLedger(req, res, next) {
    try {
      const { accountNumber } = req.params;
      const { startDate, endDate } = req.query;

      const where = { accountNumber };
      if (startDate) where.entryDate = { [require('sequelize').Op.gte]: new Date(startDate) };
      if (endDate) where.entryDate = where.entryDate || {};
      if (endDate) where.entryDate[require('sequelize').Op.lte] = new Date(endDate);

      const ledger = await this.models.GeneralLedger.findAll({
        where,
        include: [{ model: this.models.JournalEntry, attributes: ['entryNumber', 'description'] }],
        order: [['entryDate', 'ASC']]
      });

      // Calculate running balance
      let runningBalance = 0;
      const account = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber }
      });

      const withBalance = ledger.map(entry => ({
        ...entry.toJSON(),
        runningBalance: (runningBalance += (entry.debitAmount - entry.creditAmount))
      }));

      res.json({
        success: true,
        account: account ? { accountNumber: account.accountNumber, accountName: account.accountName } : null,
        entries: withBalance,
        total: withBalance.length
      });
    } catch (error) {
      logger.error('Error fetching general ledger:', error);
      next(error);
    }
  }

  /**
   * Get Trial Balance
   * GET /api/accounting/trial-balance
   */
  async getTrialBalance(req, res, next) {
    try {
      const { asOfDate } = req.query;

      const accounts = await this.models.ChartOfAccounts.findAll({
        where: { isActive: true },
        order: [['accountNumber', 'ASC']]
      });

      let totalDebits = 0;
      let totalCredits = 0;

      const balances = accounts.map(account => {
        const balance = parseFloat(account.balance);
        if (account.normalBalance === 'Debit') {
          totalDebits += balance;
        } else {
          totalCredits += balance;
        }

        return {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          debitBalance: account.normalBalance === 'Debit' ? balance : 0,
          creditBalance: account.normalBalance === 'Credit' ? balance : 0
        };
      });

      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

      res.json({
        success: true,
        asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        balances,
        totals: {
          totalDebits: totalDebits.toFixed(2),
          totalCredits: totalCredits.toFixed(2),
          difference: (totalDebits - totalCredits).toFixed(2)
        },
        isBalanced
      });
    } catch (error) {
      logger.error('Error fetching trial balance:', error);
      next(error);
    }
  }

  /**
   * Get Income Statement (P&L)
   * GET /api/accounting/income-statement
   */
  async getIncomeStatement(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        });
      }

      const result = await this.accountingService.getIncomeStatement(new Date(startDate), new Date(endDate));

      res.json({
        success: true,
        startDate,
        endDate,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching income statement:', error);
      next(error);
    }
  }

  /**
   * Get Balance Sheet
   * GET /api/accounting/balance-sheet
   */
  async getBalanceSheet(req, res, next) {
    try {
      const { asOfDate } = req.query;

      const result = await this.accountingService.getBalanceSheet(
        asOfDate ? new Date(asOfDate) : new Date()
      );

      res.json({
        success: true,
        asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        data: result
      });
    } catch (error) {
      logger.error('Error fetching balance sheet:', error);
      next(error);
    }
  }

  /**
   * Get Cash Flow Statement
   * GET /api/accounting/cash-flow
   */
  async getCashFlowStatement(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate are required'
        });
      }

      const result = await this.accountingService.getCashFlowStatement(
        new Date(startDate),
        new Date(endDate)
      );

      res.json({
        success: true,
        startDate,
        endDate,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching cash flow statement:', error);
      next(error);
    }
  }

  /**
   * Record Expense
   * POST /api/accounting/expenses
   */
  async recordExpense(req, res, next) {
    try {
      const {
        expenseDate,
        supplierId,
        category,
        amount,
        description,
        receiptUrl
      } = req.body;

      // Validate required fields
      if (!expenseDate || !category || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: expenseDate, category, amount'
        });
      }

      // Validate category
      const validCategories = [
        'Office Supplies',
        'Utilities',
        'Rent',
        'Salaries',
        'Marketing',
        'Travel',
        'Meals',
        'Equipment',
        'Other'
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      // Create expense
      const expense = await this.models.Expense.create({
        expenseDate,
        supplierId,
        category,
        amount,
        description,
        receiptUrl,
        createdBy: req.user?.id || 'system'
      });

      logger.info(`Expense recorded: ${category} - ${amount}`);

      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: expense
      });
    } catch (error) {
      logger.error('Error recording expense:', error);
      next(error);
    }
  }

  /**
   * Get Expenses
   * GET /api/accounting/expenses
   */
  async getExpenses(req, res, next) {
    try {
      const { status, category, startDate, endDate } = req.query;

      const where = {};
      if (status) where.status = status;
      if (category) where.category = category;
      if (startDate) where.expenseDate = { [require('sequelize').Op.gte]: new Date(startDate) };
      if (endDate) where.expenseDate = where.expenseDate || {};
      if (endDate) where.expenseDate[require('sequelize').Op.lte] = new Date(endDate);

      const expenses = await this.models.Expense.findAll({
        where,
        include: [{ model: this.models.Supplier, attributes: ['supplierName'] }],
        order: [['expenseDate', 'DESC']]
      });

      res.json({
        success: true,
        data: expenses,
        total: expenses.length
      });
    } catch (error) {
      logger.error('Error fetching expenses:', error);
      next(error);
    }
  }

  /**
   * Approve Expense
   * PUT /api/accounting/expenses/:expenseId/approve
   */
  async approveExpense(req, res, next) {
    try {
      const { expenseId } = req.params;

      const expense = await this.models.Expense.findByPk(expenseId);

      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      if (expense.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending expenses can be approved'
        });
      }

      // Update expense status
      await expense.update({
        status: 'approved',
        approvedBy: req.user?.id || 'system',
        approvedAt: new Date()
      });

      // Auto-post to GL
      const expenseAccount = await this.models.ChartOfAccounts.findOne({
        where: { accountType: 'Expense', subType: expense.category }
      });

      if (expenseAccount) {
        // Create journal entry for expense
        const entryCount = await this.models.JournalEntry.count();
        const entryNumber = `JE${new Date().getFullYear()}${String(entryCount + 1).padStart(6, '0')}`;

        const je = await this.models.JournalEntry.create({
          entryNumber,
          entryDate: expense.expenseDate,
          description: `Expense: ${expense.category}`,
          reference: expense.id,
          referenceType: 'expense',
          totalAmount: expense.amount,
          status: 'posted',
          createdBy: 'system'
        });

        // Debit Expense Account
        await this.models.GeneralLedger.create({
          journalEntryId: je.id,
          accountId: expenseAccount.id,
          accountNumber: expenseAccount.accountNumber,
          debitAmount: expense.amount,
          creditAmount: 0,
          description: expense.description,
          entryDate: expense.expenseDate,
          reference: expense.id,
          referenceType: 'expense'
        });

        // Credit Cash/AP
        const creditAccount = await this.models.ChartOfAccounts.findOne({
          where: { accountType: 'Asset', subType: 'Current Asset' }
        });

        if (creditAccount) {
          await this.models.GeneralLedger.create({
            journalEntryId: je.id,
            accountId: creditAccount.id,
            accountNumber: creditAccount.accountNumber,
            debitAmount: 0,
            creditAmount: expense.amount,
            description: expense.description,
            entryDate: expense.expenseDate,
            reference: expense.id,
            referenceType: 'expense'
          });

          // Update account balances
          await expenseAccount.update({
            balance: parseFloat(expenseAccount.balance) + expense.amount
          });

          await creditAccount.update({
            balance: parseFloat(creditAccount.balance) - expense.amount
          });
        }
      }

      logger.info(`Expense approved and posted: ${expenseId}`);

      res.json({
        success: true,
        message: 'Expense approved and posted to GL',
        data: expense
      });
    } catch (error) {
      logger.error('Error approving expense:', error);
      next(error);
    }
  }

  /**
   * Get Suppliers
   * GET /api/accounting/suppliers
   */
  async getSuppliers(req, res, next) {
    try {
      const { isActive } = req.query;

      const where = {};
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const suppliers = await this.models.Supplier.findAll({
        where,
        order: [['supplierName', 'ASC']]
      });

      res.json({
        success: true,
        data: suppliers,
        total: suppliers.length
      });
    } catch (error) {
      logger.error('Error fetching suppliers:', error);
      next(error);
    }
  }

  /**
   * Create Supplier
   * POST /api/accounting/suppliers
   */
  async createSupplier(req, res, next) {
    try {
      const {
        supplierName,
        contactPerson,
        email,
        phone,
        address,
        taxId,
        paymentTerms
      } = req.body;

      if (!supplierName) {
        return res.status(400).json({
          success: false,
          message: 'Supplier name is required'
        });
      }

      const supplier = await this.models.Supplier.create({
        supplierName,
        contactPerson,
        email,
        phone,
        address,
        taxId,
        paymentTerms
      });

      logger.info(`Supplier created: ${supplierName}`);

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier
      });
    } catch (error) {
      logger.error('Error creating supplier:', error);
      next(error);
    }
  }

  /**
   * Get Budget vs Actual
   * GET /api/accounting/budget-analysis
   */
  async getBudgetAnalysis(req, res, next) {
    try {
      const { fiscalYear, fiscalMonth } = req.query;

      if (!fiscalYear) {
        return res.status(400).json({
          success: false,
          message: 'fiscalYear is required'
        });
      }

      const where = { fiscalYear: parseInt(fiscalYear) };
      if (fiscalMonth) where.fiscalMonth = parseInt(fiscalMonth);

      const budgets = await this.models.BudgetAllocation.findAll({
        where,
        include: [{ model: this.models.ChartOfAccounts, attributes: ['accountName'] }],
        order: [['accountNumber', 'ASC']]
      });

      res.json({
        success: true,
        fiscalYear,
        fiscalMonth,
        data: budgets,
        total: budgets.length
      });
    } catch (error) {
      logger.error('Error fetching budget analysis:', error);
      next(error);
    }
  }
}

module.exports = AccountingController;
