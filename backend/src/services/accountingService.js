const { Op } = require('sequelize');

/**
 * Accounting Service
 * Core accounting operations: GL posting, journal entries, financial statements
 * Handles all debits/credits, account balancing, and financial reporting
 */
class AccountingService {
  constructor(models) {
    this.models = models;
  }

  /**
   * Create Chart of Accounts (COA)
   * Standard accounting structure with account types and subaccounts
   */
  async createAccount(accountData) {
    try {
      const {
        accountNumber,
        accountName,
        accountType, // Asset, Liability, Equity, Revenue, Expense
        subType, // Current Asset, Fixed Asset, etc.
        normalBalance, // Debit or Credit
        isActive = true
      } = accountData;

      // Validate account number is unique
      const existing = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber }
      });

      if (existing) {
        throw new Error(`Account number ${accountNumber} already exists`);
      }

      const account = await this.models.ChartOfAccounts.create({
        accountNumber,
        accountName,
        accountType,
        subType,
        normalBalance,
        isActive,
        balance: 0,
        createdBy: 'system'
      });

      return account;
    } catch (error) {
      console.error('[Create Account Error]', error.message);
      throw error;
    }
  }

  /**
   * Get Chart of Accounts with balances
   */
  async getChartOfAccounts(filters = {}) {
    try {
      const where = { isActive: true };

      if (filters.accountType) {
        where.accountType = filters.accountType;
      }

      const accounts = await this.models.ChartOfAccounts.findAll({
        where,
        order: [['accountNumber', 'ASC']],
        include: [
          {
            model: this.models.GeneralLedger,
            attributes: [],
            required: false
          }
        ]
      });

      return accounts;
    } catch (error) {
      console.error('[Get COA Error]', error.message);
      throw error;
    }
  }

  /**
   * Post Journal Entry
   * Core accounting operation: create debits and credits
   */
  async postJournalEntry(entryData) {
    try {
      const {
        entryDate,
        entryNumber,
        description,
        reference, // Invoice, PO, etc.
        referenceType,
        entries, // Array of { accountNumber, debitAmount, creditAmount }
        memo,
        createdBy
      } = entryData;

      // Validate debits equal credits
      let totalDebits = 0;
      let totalCredits = 0;

      for (const entry of entries) {
        totalDebits += entry.debitAmount || 0;
        totalCredits += entry.creditAmount || 0;
      }

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(
          `Journal entry imbalance: Debits $${totalDebits} != Credits $${totalCredits}`
        );
      }

      // Create journal entry record
      const journalEntry = await this.models.JournalEntry.create({
        entryDate,
        entryNumber,
        description,
        reference,
        referenceType,
        memo,
        status: 'posted',
        totalAmount: totalDebits,
        createdBy
      });

      // Create GL entries and update account balances
      for (const entry of entries) {
        // Get account
        const account = await this.models.ChartOfAccounts.findOne({
          where: { accountNumber: entry.accountNumber }
        });

        if (!account) {
          throw new Error(`Account ${entry.accountNumber} not found`);
        }

        // Create GL entry
        const glEntry = await this.models.GeneralLedger.create({
          journalEntryId: journalEntry.id,
          accountId: account.id,
          accountNumber: entry.accountNumber,
          debitAmount: entry.debitAmount || 0,
          creditAmount: entry.creditAmount || 0,
          description: entry.description || description,
          entryDate,
          reference,
          referenceType
        });

        // Update account balance
        const debitAmount = entry.debitAmount || 0;
        const creditAmount = entry.creditAmount || 0;

        if (account.normalBalance === 'Debit') {
          account.balance += debitAmount - creditAmount;
        } else {
          account.balance += creditAmount - debitAmount;
        }

        await account.save();
      }

      return {
        success: true,
        journalEntry,
        totalDebits,
        totalCredits
      };
    } catch (error) {
      console.error('[Post Journal Entry Error]', error.message);
      throw error;
    }
  }

  /**
   * Auto-post from POS Sale
   * Automatically create journal entry when sale is recorded
   * Revenue account (credit), Cash/AR account (debit)
   */
  async autoPostSale(saleData) {
    try {
      const { saleId, saleAmount, paymentMethod, customerId, note } = saleData;

      // Find Revenue account
      const revenueAccount = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: '4000' } // Sales Revenue
      });

      // Find appropriate asset account based on payment method
      let assetAccount;
      if (paymentMethod === 'cash') {
        assetAccount = await this.models.ChartOfAccounts.findOne({
          where: { accountNumber: '1010' } // Cash
        });
      } else if (paymentMethod === 'card') {
        assetAccount = await this.models.ChartOfAccounts.findOne({
          where: { accountNumber: '1200' } // Accounts Receivable
        });
      }

      if (!revenueAccount || !assetAccount) {
        throw new Error('Required accounts not found');
      }

      // Post journal entry
      const entry = await this.postJournalEntry({
        entryDate: new Date(),
        entryNumber: `POS-${saleId}`,
        description: `Sale Transaction`,
        reference: saleId,
        referenceType: 'sale',
        memo: note,
        entries: [
          {
            accountNumber: assetAccount.accountNumber,
            debitAmount: saleAmount,
            creditAmount: 0,
            description: 'Cash/Card Payment'
          },
          {
            accountNumber: revenueAccount.accountNumber,
            debitAmount: 0,
            creditAmount: saleAmount,
            description: 'Sales Revenue'
          }
        ],
        createdBy: 'system'
      });

      return entry;
    } catch (error) {
      console.error('[Auto Post Sale Error]', error.message);
      throw error;
    }
  }

  /**
   * Auto-post from Order (Sale on Account)
   * AR account (debit), Revenue account (credit)
   */
  async autoPostOrder(orderData) {
    try {
      const { orderId, orderAmount, customerId, note } = orderData;

      const arAccount = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: '1200' } // A/R
      });

      const revenueAccount = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: '4000' } // Sales Revenue
      });

      if (!arAccount || !revenueAccount) {
        throw new Error('Required accounts not found');
      }

      const entry = await this.postJournalEntry({
        entryDate: new Date(),
        entryNumber: `ORD-${orderId}`,
        description: `Order Sale on Account`,
        reference: orderId,
        referenceType: 'order',
        memo: note,
        entries: [
          {
            accountNumber: arAccount.accountNumber,
            debitAmount: orderAmount,
            creditAmount: 0,
            description: 'Accounts Receivable'
          },
          {
            accountNumber: revenueAccount.accountNumber,
            debitAmount: 0,
            creditAmount: orderAmount,
            description: 'Sales Revenue'
          }
        ],
        createdBy: 'system'
      });

      return entry;
    } catch (error) {
      console.error('[Auto Post Order Error]', error.message);
      throw error;
    }
  }

  /**
   * Get General Ledger for account
   */
  async getGeneralLedger(accountNumber, filters = {}) {
    try {
      const account = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber }
      });

      if (!account) {
        throw new Error(`Account ${accountNumber} not found`);
      }

      const where = { accountId: account.id };

      if (filters.startDate && filters.endDate) {
        where.entryDate = {
          [Op.between]: [filters.startDate, filters.endDate]
        };
      }

      const entries = await this.models.GeneralLedger.findAll({
        where,
        order: [['entryDate', 'ASC']],
        include: [
          {
            model: this.models.JournalEntry,
            attributes: ['description', 'reference', 'referenceType']
          }
        ]
      });

      // Calculate running balance
      let runningBalance = 0;
      const enrichedEntries = entries.map(entry => {
        const debit = entry.debitAmount || 0;
        const credit = entry.creditAmount || 0;

        if (account.normalBalance === 'Debit') {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        return {
          ...entry.dataValues,
          runningBalance
        };
      });

      return {
        account: {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          balance: account.balance
        },
        entries: enrichedEntries
      };
    } catch (error) {
      console.error('[Get GL Error]', error.message);
      throw error;
    }
  }

  /**
   * Get Trial Balance
   * List all accounts with debit/credit balances (for verification)
   */
  async getTrialBalance(asOfDate = new Date()) {
    try {
      const accounts = await this.models.ChartOfAccounts.findAll({
        where: { isActive: true },
        order: [['accountNumber', 'ASC']]
      });

      let totalDebits = 0;
      let totalCredits = 0;

      const balances = accounts.map(account => {
        let debitBalance = 0;
        let creditBalance = 0;

        if (account.normalBalance === 'Debit') {
          debitBalance = Math.max(account.balance, 0);
        } else {
          creditBalance = Math.max(account.balance, 0);
        }

        totalDebits += debitBalance;
        totalCredits += creditBalance;

        return {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          accountType: account.accountType,
          debitBalance,
          creditBalance
        };
      });

      return {
        asOfDate,
        accounts: balances,
        totalDebits,
        totalCredits,
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
      };
    } catch (error) {
      console.error('[Trial Balance Error]', error.message);
      throw error;
    }
  }

  /**
   * Generate Income Statement (P&L)
   * Revenue - Expenses = Net Income
   */
  async getIncomeStatement(startDate, endDate) {
    try {
      // Get all revenue and expense accounts with balances as of end date
      const revenues = await this.models.ChartOfAccounts.findAll({
        where: {
          accountType: 'Revenue',
          isActive: true
        }
      });

      const expenses = await this.models.ChartOfAccounts.findAll({
        where: {
          accountType: 'Expense',
          isActive: true
        }
      });

      let totalRevenue = 0;
      let totalExpenses = 0;

      const revenueItems = revenues.map(account => {
        totalRevenue += account.balance;
        return {
          account: account.accountName,
          amount: account.balance
        };
      });

      const expenseItems = expenses.map(account => {
        totalExpenses += account.balance;
        return {
          account: account.accountName,
          amount: account.balance
        };
      });

      const netIncome = totalRevenue - totalExpenses;

      return {
        period: {
          startDate,
          endDate
        },
        revenues: {
          items: revenueItems,
          total: totalRevenue
        },
        expenses: {
          items: expenseItems,
          total: totalExpenses
        },
        netIncome,
        profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
      };
    } catch (error) {
      console.error('[Income Statement Error]', error.message);
      throw error;
    }
  }

  /**
   * Generate Balance Sheet
   * Assets = Liabilities + Equity
   */
  async getBalanceSheet(asOfDate = new Date()) {
    try {
      const assets = await this.models.ChartOfAccounts.findAll({
        where: {
          accountType: 'Asset',
          isActive: true
        }
      });

      const liabilities = await this.models.ChartOfAccounts.findAll({
        where: {
          accountType: 'Liability',
          isActive: true
        }
      });

      const equity = await this.models.ChartOfAccounts.findAll({
        where: {
          accountType: 'Equity',
          isActive: true
        }
      });

      const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
      const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
      const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

      return {
        asOfDate,
        assets: {
          accounts: assets.map(a => ({
            account: a.accountName,
            amount: a.balance
          })),
          total: totalAssets
        },
        liabilities: {
          accounts: liabilities.map(a => ({
            account: a.accountName,
            amount: a.balance
          })),
          total: totalLiabilities
        },
        equity: {
          accounts: equity.map(a => ({
            account: a.accountName,
            amount: a.balance
          })),
          total: totalEquity
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
        isBalanced:
          Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      };
    } catch (error) {
      console.error('[Balance Sheet Error]', error.message);
      throw error;
    }
  }

  /**
   * Generate Cash Flow Statement
   * Operating, Investing, Financing activities
   */
  async getCashFlowStatement(startDate, endDate) {
    try {
      const cashAccount = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: '1010' } // Cash
      });

      const glEntries = await this.models.GeneralLedger.findAll({
        where: {
          accountId: cashAccount.id,
          entryDate: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: this.models.JournalEntry,
            attributes: ['referenceType', 'description']
          }
        ]
      });

      // Categorize cash flows
      let operatingCash = 0;
      let investingCash = 0;
      let financingCash = 0;

      glEntries.forEach(entry => {
        const amount = entry.debitAmount - entry.creditAmount;

        switch (entry.JournalEntry.referenceType) {
          case 'sale':
          case 'order':
          case 'expense':
            operatingCash += amount;
            break;
          case 'asset':
            investingCash += amount;
            break;
          case 'loan':
          case 'equity':
            financingCash += amount;
            break;
        }
      });

      const netCashFlow = operatingCash + investingCash + financingCash;

      return {
        period: { startDate, endDate },
        operatingActivities: operatingCash,
        investingActivities: investingCash,
        financingActivities: financingCash,
        netCashFlow,
        endingCashBalance: cashAccount.balance
      };
    } catch (error) {
      console.error('[Cash Flow Statement Error]', error.message);
      throw error;
    }
  }

  /**
   * Record Expense
   */
  async recordExpense(expenseData) {
    try {
      const {
        expenseDate,
        supplierId,
        category, // Office Supplies, Utilities, Rent, etc.
        amount,
        description,
        receiptUrl,
        createdBy
      } = expenseData;

      // Create expense record
      const expense = await this.models.Expense.create({
        expenseDate,
        supplierId,
        category,
        amount,
        description,
        receiptUrl,
        status: 'pending',
        createdBy
      });

      return expense;
    } catch (error) {
      console.error('[Record Expense Error]', error.message);
      throw error;
    }
  }

  /**
   * Approve and post expense
   * Creates GL entry for expense
   */
  async approveExpense(expenseId, approvedBy) {
    try {
      const expense = await this.models.Expense.findByPk(expenseId);

      if (!expense) {
        throw new Error('Expense not found');
      }

      // Post to GL
      const expenseAccount = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: '5000' } // Expenses
      });

      const cashAccount = await this.models.ChartOfAccounts.findOne({
        where: { accountNumber: '1010' } // Cash
      });

      await this.postJournalEntry({
        entryDate: expense.expenseDate,
        entryNumber: `EXP-${expenseId}`,
        description: `Expense: ${expense.category}`,
        reference: expenseId,
        referenceType: 'expense',
        entries: [
          {
            accountNumber: expenseAccount.accountNumber,
            debitAmount: expense.amount,
            creditAmount: 0
          },
          {
            accountNumber: cashAccount.accountNumber,
            debitAmount: 0,
            creditAmount: expense.amount
          }
        ],
        createdBy: approvedBy
      });

      // Update expense status
      expense.status = 'approved';
      expense.approvedBy = approvedBy;
      expense.approvedAt = new Date();
      await expense.save();

      return expense;
    } catch (error) {
      console.error('[Approve Expense Error]', error.message);
      throw error;
    }
  }
}

module.exports = AccountingService;
