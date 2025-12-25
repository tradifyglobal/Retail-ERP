/**
 * Chart of Accounts Seeder
 * Creates default GL accounts for a new business
 * Run: node seeds/seedChartOfAccounts.js
 */

require('dotenv').config();
const sequelize = require('../src/config/database');
const { ChartOfAccounts, GeneralLedger, JournalEntry, Expense, Supplier, BudgetAllocation } = require('../src/models/AccountingModels');

// Initialize models
sequelize.define('ChartOfAccounts', ChartOfAccounts(sequelize));
sequelize.define('GeneralLedger', GeneralLedger(sequelize));
sequelize.define('JournalEntry', JournalEntry(sequelize));
sequelize.define('Expense', Expense(sequelize));
sequelize.define('Supplier', Supplier(sequelize));
sequelize.define('BudgetAllocation', BudgetAllocation(sequelize));

const defaultAccounts = [
  // ===== ASSETS (Debit Normal Balance) =====
  // Current Assets
  { accountNumber: '1010', accountName: 'Cash - Checking', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Primary business checking account' },
  { accountNumber: '1020', accountName: 'Cash - Savings', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Savings account for excess cash' },
  { accountNumber: '1050', accountName: 'Money Market Account', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Short-term liquid investments' },
  { accountNumber: '1200', accountName: 'Accounts Receivable', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Outstanding customer invoices' },
  { accountNumber: '1210', accountName: 'Allowance for Doubtful Accounts', accountType: 'Contra-Asset', subType: 'Current Asset', normalBalance: 'Credit', description: 'Reserve for uncollectible AR' },
  { accountNumber: '1300', accountName: 'Inventory', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Product inventory at cost' },
  { accountNumber: '1310', accountName: 'Supplies', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Office and operational supplies' },
  { accountNumber: '1400', accountName: 'Prepaid Expenses', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Payments for future expenses' },
  
  // Fixed Assets
  { accountNumber: '1500', accountName: 'Equipment', accountType: 'Asset', subType: 'Fixed Asset', normalBalance: 'Debit', description: 'Machinery and operational equipment' },
  { accountNumber: '1510', accountName: 'Accumulated Depreciation - Equipment', accountType: 'Contra-Asset', subType: 'Fixed Asset', normalBalance: 'Credit', description: 'Depreciation reserve for equipment' },
  { accountNumber: '1600', accountName: 'Furniture & Fixtures', accountType: 'Asset', subType: 'Fixed Asset', normalBalance: 'Debit', description: 'Office furniture and fixtures' },
  { accountNumber: '1610', accountName: 'Accumulated Depreciation - Furniture', accountType: 'Contra-Asset', subType: 'Fixed Asset', normalBalance: 'Credit', description: 'Depreciation reserve for furniture' },
  { accountNumber: '1700', accountName: 'Vehicles', accountType: 'Asset', subType: 'Fixed Asset', normalBalance: 'Debit', description: 'Company vehicles' },
  { accountNumber: '1710', accountName: 'Accumulated Depreciation - Vehicles', accountType: 'Contra-Asset', subType: 'Fixed Asset', normalBalance: 'Credit', description: 'Depreciation reserve for vehicles' },
  { accountNumber: '1800', accountName: 'Building', accountType: 'Asset', subType: 'Fixed Asset', normalBalance: 'Debit', description: 'Company building or leasehold improvements' },
  { accountNumber: '1810', accountName: 'Accumulated Depreciation - Building', accountType: 'Contra-Asset', subType: 'Fixed Asset', normalBalance: 'Credit', description: 'Depreciation reserve for building' },
  
  // ===== LIABILITIES (Credit Normal Balance) =====
  // Current Liabilities
  { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Outstanding vendor invoices' },
  { accountNumber: '2100', accountName: 'Accrued Expenses', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Expenses incurred but not yet paid' },
  { accountNumber: '2200', accountName: 'Short-term Debt', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Loans due within 12 months' },
  { accountNumber: '2300', accountName: 'Current Portion of Long-term Debt', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Next year\'s debt payments' },
  { accountNumber: '2400', accountName: 'Sales Tax Payable', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Collected sales tax owed to government' },
  { accountNumber: '2410', accountName: 'Income Tax Payable', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Estimated income taxes due' },
  { accountNumber: '2500', accountName: 'Unearned Revenue', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Customer payments for future services' },
  
  // Long-term Liabilities
  { accountNumber: '2600', accountName: 'Long-term Debt', accountType: 'Liability', subType: 'Long-term Liability', normalBalance: 'Credit', description: 'Loans due after 12 months' },
  { accountNumber: '2700', accountName: 'Mortgage Payable', accountType: 'Liability', subType: 'Long-term Liability', normalBalance: 'Credit', description: 'Mortgage on property' },
  { accountNumber: '2800', accountName: 'Deferred Revenue', accountType: 'Liability', subType: 'Long-term Liability', normalBalance: 'Credit', description: 'Long-term customer advances' },
  
  // ===== EQUITY (Credit Normal Balance) =====
  { accountNumber: '3000', accountName: 'Owner\'s Capital', accountType: 'Equity', normalBalance: 'Credit', description: 'Original investment by owner' },
  { accountNumber: '3100', accountName: 'Owner\'s Drawings', accountType: 'Equity', normalBalance: 'Debit', description: 'Withdrawals by owner' },
  { accountNumber: '3200', accountName: 'Retained Earnings', accountType: 'Equity', normalBalance: 'Credit', description: 'Accumulated net income over time' },
  { accountNumber: '3300', accountName: 'Common Stock', accountType: 'Equity', normalBalance: 'Credit', description: 'Issued common stock' },
  { accountNumber: '3400', accountName: 'Preferred Stock', accountType: 'Equity', normalBalance: 'Credit', description: 'Issued preferred stock' },
  
  // ===== REVENUE (Credit Normal Balance) =====
  { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'Revenue', normalBalance: 'Credit', description: 'Product sales to customers' },
  { accountNumber: '4010', accountName: 'Service Revenue', accountType: 'Revenue', normalBalance: 'Credit', description: 'Revenue from services provided' },
  { accountNumber: '4100', accountName: 'Rental Income', accountType: 'Revenue', normalBalance: 'Credit', description: 'Income from rentals' },
  { accountNumber: '4200', accountName: 'License Revenue', accountType: 'Revenue', normalBalance: 'Credit', description: 'License and subscription fees' },
  { accountNumber: '4300', accountName: 'Consulting Revenue', accountType: 'Revenue', normalBalance: 'Credit', description: 'Consulting and advisory fees' },
  { accountNumber: '4400', accountName: 'Other Income', accountType: 'Revenue', normalBalance: 'Credit', description: 'Miscellaneous revenue sources' },
  
  // ===== EXPENSES (Debit Normal Balance) =====
  // Salaries & Wages
  { accountNumber: '5000', accountName: 'Salaries & Wages', accountType: 'Expense', normalBalance: 'Debit', description: 'Employee salaries and wages' },
  { accountNumber: '5010', accountName: 'Payroll Taxes', accountType: 'Expense', normalBalance: 'Debit', description: 'FICA, unemployment taxes' },
  { accountNumber: '5020', accountName: 'Employee Benefits', accountType: 'Expense', normalBalance: 'Debit', description: 'Health insurance, 401k, etc.' },
  
  // Occupancy
  { accountNumber: '5100', accountName: 'Rent Expense', accountType: 'Expense', normalBalance: 'Debit', description: 'Monthly rent payments' },
  { accountNumber: '5110', accountName: 'Property Tax', accountType: 'Expense', normalBalance: 'Debit', description: 'Annual property taxes' },
  { accountNumber: '5120', accountName: 'Building Maintenance', accountType: 'Expense', normalBalance: 'Debit', description: 'Building repairs and maintenance' },
  
  // Utilities
  { accountNumber: '5200', accountName: 'Electricity', accountType: 'Expense', normalBalance: 'Debit', description: 'Electric utility bills' },
  { accountNumber: '5210', accountName: 'Gas', accountType: 'Expense', normalBalance: 'Debit', description: 'Natural gas or heating bills' },
  { accountNumber: '5220', accountName: 'Water & Sewer', accountType: 'Expense', normalBalance: 'Debit', description: 'Water utility bills' },
  { accountNumber: '5230', accountName: 'Internet & Phone', accountType: 'Expense', normalBalance: 'Debit', description: 'Telecommunications' },
  
  // Supplies & Materials
  { accountNumber: '5300', accountName: 'Office Supplies', accountType: 'Expense', normalBalance: 'Debit', description: 'Paper, pens, toner, etc.' },
  { accountNumber: '5310', accountName: 'Cost of Goods Sold', accountType: 'Expense', normalBalance: 'Debit', description: 'Cost of inventory sold' },
  { accountNumber: '5320', accountName: 'Raw Materials', accountType: 'Expense', normalBalance: 'Debit', description: 'Materials for production' },
  
  // Operations
  { accountNumber: '5400', accountName: 'Depreciation Expense', accountType: 'Expense', normalBalance: 'Debit', description: 'Depreciation of fixed assets' },
  { accountNumber: '5410', accountName: 'Insurance', accountType: 'Expense', normalBalance: 'Debit', description: 'General business insurance' },
  { accountNumber: '5420', accountName: 'Professional Services', accountType: 'Expense', normalBalance: 'Debit', description: 'Legal, accounting, consulting fees' },
  { accountNumber: '5430', accountName: 'Travel', accountType: 'Expense', normalBalance: 'Debit', description: 'Travel and transportation' },
  { accountNumber: '5440', accountName: 'Meals & Entertainment', accountType: 'Expense', normalBalance: 'Debit', description: 'Business meals and entertainment' },
  
  // Marketing & Sales
  { accountNumber: '5500', accountName: 'Advertising', accountType: 'Expense', normalBalance: 'Debit', description: 'Advertising and promotional spend' },
  { accountNumber: '5510', accountName: 'Marketing', accountType: 'Expense', normalBalance: 'Debit', description: 'Marketing campaigns and materials' },
  { accountNumber: '5520', accountName: 'Sales Commission', accountType: 'Expense', normalBalance: 'Debit', description: 'Sales commissions paid' },
  
  // Finance
  { accountNumber: '5600', accountName: 'Interest Expense', accountType: 'Expense', normalBalance: 'Debit', description: 'Interest on loans and debt' },
  { accountNumber: '5610', accountName: 'Bank Fees', accountType: 'Expense', normalBalance: 'Debit', description: 'Bank service charges' },
  { accountNumber: '5620', accountName: 'Bad Debt Expense', accountType: 'Expense', normalBalance: 'Debit', description: 'Uncollectible account write-offs' },
  
  // Miscellaneous
  { accountNumber: '5700', accountName: 'Repairs & Maintenance', accountType: 'Expense', normalBalance: 'Debit', description: 'Equipment repairs and upkeep' },
  { accountNumber: '5710', accountName: 'Donations', accountType: 'Expense', normalBalance: 'Debit', description: 'Charitable contributions' },
  { accountNumber: '5800', accountName: 'Miscellaneous Expense', accountType: 'Expense', normalBalance: 'Debit', description: 'Other business expenses' }
];

async function seedAccounts() {
  try {
    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    // Check if accounts already exist
    const existingCount = await sequelize.models.ChartOfAccounts.count();
    if (existingCount > 0) {
      console.log(`⚠️  Chart of Accounts already has ${existingCount} entries. Skipping seed.`);
      console.log('    To reseed, delete existing accounts first.');
      process.exit(0);
    }

    // Create accounts
    let createdCount = 0;
    for (const account of defaultAccounts) {
      await sequelize.models.ChartOfAccounts.create({
        ...account,
        balance: 0,
        isActive: true,
        createdBy: 'system'
      });
      createdCount++;
    }

    console.log(`✅ Seeded ${createdCount} Chart of Accounts`);
    console.log('\n📊 Account Summary:');
    
    const summary = await sequelize.models.ChartOfAccounts.findAll({
      attributes: ['accountType'],
      raw: true,
      group: 'accountType'
    });

    for (const item of summary) {
      const count = await sequelize.models.ChartOfAccounts.count({
        where: { accountType: item.accountType }
      });
      console.log(`   ${item.accountType}: ${count} accounts`);
    }

    console.log('\n✨ Chart of Accounts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedAccounts();
