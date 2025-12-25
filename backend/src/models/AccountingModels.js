const { DataTypes } = require('sequelize');

/**
 * Chart of Accounts Model
 * Standard accounting structure - all GL accounts
 */
module.exports.ChartOfAccounts = (sequelize) => {
  return sequelize.define('ChartOfAccounts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Account number (e.g., 1010, 2000, 4000)
    accountNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      index: true
    },

    // Account name (e.g., "Cash - Checking", "Sales Revenue")
    accountName: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Account classification
    accountType: {
      type: DataTypes.ENUM(
        'Asset',
        'Liability',
        'Equity',
        'Revenue',
        'Expense',
        'Contra-Asset',
        'Contra-Liability'
      ),
      allowNull: false
    },

    // Sub-type for grouping (Current Asset, Fixed Asset, etc.)
    subType: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Normal balance: Debit or Credit
    normalBalance: {
      type: DataTypes.ENUM('Debit', 'Credit'),
      allowNull: false
    },

    // Current balance
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },

    // Is account active
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    // Description
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Who created this account
    createdBy: {
      type: DataTypes.STRING,
      defaultValue: 'system'
    }
  }, {
    tableName: 'ChartOfAccounts',
    timestamps: true,
    indexes: [
      { fields: ['accountNumber'] },
      { fields: ['accountType'] },
      { fields: ['isActive'] }
    ]
  });
};

/**
 * General Ledger Model
 * Individual GL entries - debit and credit transactions
 */
module.exports.GeneralLedger = (sequelize) => {
  return sequelize.define('GeneralLedger', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Link to journal entry
    journalEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },

    // Link to chart of accounts
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },

    // Account number (cached for quick lookup)
    accountNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      index: true
    },

    // Debit amount
    debitAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },

    // Credit amount
    creditAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },

    // Description of this GL entry
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Entry date (posting date)
    entryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },

    // Reference (invoice, PO, etc.)
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Reference type (sale, purchase, expense, etc.)
    referenceType: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'GeneralLedger',
    timestamps: true,
    indexes: [
      { fields: ['journalEntryId'] },
      { fields: ['accountId'] },
      { fields: ['entryDate'] },
      { fields: ['accountNumber', 'entryDate'] }
    ]
  });
};

/**
 * Journal Entry Model
 * Collection of GL entries that balance
 */
module.exports.JournalEntry = (sequelize) => {
  return sequelize.define('JournalEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Entry number (reference)
    entryNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      index: true
    },

    // Entry date
    entryDate: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },

    // Description
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Reference (invoice, PO, etc.)
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Reference type
    referenceType: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Total amount (sum of debits or credits)
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    // Status: draft, posted, reversed
    status: {
      type: DataTypes.ENUM('draft', 'posted', 'reversed'),
      defaultValue: 'draft'
    },

    // Additional notes
    memo: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Who created this
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Reversal info (if reversed)
    reversalEntryId: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'JournalEntries',
    timestamps: true,
    indexes: [
      { fields: ['entryNumber'] },
      { fields: ['entryDate'] },
      { fields: ['status'] }
    ]
  });
};

/**
 * Expense Model
 * Track business expenses before GL posting
 */
module.exports.Expense = (sequelize) => {
  return sequelize.define('Expense', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Expense date
    expenseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true
    },

    // Supplier (who was paid)
    supplierId: {
      type: DataTypes.UUID,
      allowNull: true
    },

    // Expense category
    category: {
      type: DataTypes.ENUM(
        'Office Supplies',
        'Utilities',
        'Rent',
        'Salaries',
        'Marketing',
        'Travel',
        'Meals',
        'Equipment',
        'Other'
      ),
      allowNull: false
    },

    // Amount
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    // Description
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Receipt upload URL
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Status: pending, approved, paid, rejected
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid', 'rejected'),
      defaultValue: 'pending'
    },

    // Who created
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Who approved
    approvedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // When approved
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // When paid
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Expenses',
    timestamps: true,
    indexes: [
      { fields: ['expenseDate'] },
      { fields: ['category'] },
      { fields: ['status'] }
    ]
  });
};

/**
 * Supplier Model
 * Vendors/suppliers for expense tracking
 */
module.exports.Supplier = (sequelize) => {
  return sequelize.define('Supplier', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Supplier name
    supplierName: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // Contact person
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Email
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true }
    },

    // Phone
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Address
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Tax ID
    taxId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Payment terms (Net 30, Net 60, etc.)
    paymentTerms: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Is active
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    // Total paid to this supplier
    totalPaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'Suppliers',
    timestamps: true,
    indexes: [
      { fields: ['supplierName'] },
      { fields: ['isActive'] }
    ]
  });
};

/**
 * Budget Allocation Model
 * Budget vs Actual tracking
 */
module.exports.BudgetAllocation = (sequelize) => {
  return sequelize.define('BudgetAllocation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Fiscal year
    fiscalYear: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    // Fiscal month (1-12)
    fiscalMonth: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    // Account ID being budgeted
    accountId: {
      type: DataTypes.UUID,
      allowNull: false,
      index: true
    },

    // Account number (cached)
    accountNumber: {
      type: DataTypes.STRING(10),
      allowNull: false
    },

    // Budgeted amount
    budgetedAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },

    // Actual amount (updated monthly)
    actualAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },

    // Variance (Budget - Actual)
    variance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },

    // Variance percentage
    variancePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'BudgetAllocations',
    timestamps: true,
    indexes: [
      { fields: ['fiscalYear', 'fiscalMonth'] },
      { fields: ['accountId'] }
    ]
  });
};
