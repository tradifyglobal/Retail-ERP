# Accounting & Finance Module - Complete Implementation Guide

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Core Features](#core-features)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Integration Guide](#integration-guide)
8. [Configuration](#configuration)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Accounting & Finance Module provides enterprise-grade accounting capabilities including:

- **General Ledger (GL)** - Complete double-entry bookkeeping system
- **Chart of Accounts (COA)** - Customizable account structure
- **Financial Statements** - Income Statement (P&L), Balance Sheet, Cash Flow
- **Expense Management** - Expense tracking with approval workflow
- **Journal Entries** - Manual and automated GL posting
- **Supplier Management** - Vendor tracking and expense assignment
- **Budget Tracking** - Budget vs Actual analysis
- **Bank Reconciliation** - Match bank statements to GL

### Key Characteristics

| Feature | Description |
|---------|-------------|
| **Double-Entry** | Every transaction posts to 2+ accounts |
| **Auto-Posting** | Sales/Orders auto-create GL entries |
| **Balance Validation** | Ensures Debits = Credits on every entry |
| **Multi-Period** | Support for multiple fiscal periods |
| **Full Audit Trail** | Complete transaction history |
| **Real-Time P&L** | On-demand financial statement generation |

---

## Architecture

### System Layers

```
┌─────────────────────────────────┐
│     React Frontend Components     │ ChartOfAccounts, GeneralLedger,
│                                   │ FinancialStatements, ExpenseTracker
├─────────────────────────────────┤
│      REST API (Controllers)       │ GET/POST/PUT endpoints
├─────────────────────────────────┤
│      Business Logic (Services)    │ GL posting, calculations, validation
├─────────────────────────────────┤
│      Data Access (Models)         │ Sequelize ORM models
├─────────────────────────────────┤
│      PostgreSQL Database          │ Chart of Accounts, GL, Journal Entries
└─────────────────────────────────┘
```

### Core Components

#### 1. Chart of Accounts (COA)
- Master list of all GL accounts
- Organized by type: Asset, Liability, Equity, Revenue, Expense
- Hierarchical structure with sub-types
- Balance tracking per account

#### 2. General Ledger
- Individual transaction records
- Debit/Credit posting
- Running balance calculation
- Multi-account transactions

#### 3. Journal Entries
- Groups of GL entries that balance
- Entry numbering and referencing
- Status tracking (draft, posted, reversed)
- Audit trail

#### 4. Financial Statements
- **Income Statement**: Revenue - Expenses = Net Income
- **Balance Sheet**: Assets = Liabilities + Equity
- **Cash Flow**: Operating, Investing, Financing activities
- **Trial Balance**: Verification of balanced accounts

---

## Installation & Setup

### 1. Database Setup

The accounting models are automatically created when you initialize the database:

```bash
# Backend
cd backend
npm install

# Initialize database (creates all tables)
node src/config/database.js
```

### 2. Model Integration

Register accounting models in `server.js`:

```javascript
// src/server.js
const {
  ChartOfAccounts,
  GeneralLedger,
  JournalEntry,
  Expense,
  Supplier,
  BudgetAllocation
} = require('./models/AccountingModels');

// Initialize models
sequelize.define('ChartOfAccounts', ChartOfAccounts(sequelize));
sequelize.define('GeneralLedger', GeneralLedger(sequelize));
sequelize.define('JournalEntry', JournalEntry(sequelize));
sequelize.define('Expense', Expense(sequelize));
sequelize.define('Supplier', Supplier(sequelize));
sequelize.define('BudgetAllocation', BudgetAllocation(sequelize));

// Sync associations
require('./config/database').setupAssociations(sequelize);
```

### 3. Service Integration

Initialize accounting service in controller:

```javascript
// src/controllers/accountingController.js
const AccountingService = require('../services/accountingService');

const accountingService = new AccountingService(sequelize.models);
const accountingController = new AccountingController(accountingService, sequelize.models);
```

### 4. Route Registration

Mount accounting routes in `server.js`:

```javascript
const accountingRoutes = require('./routes/accountingRoutes');
const { AccountingController } = require('./controllers/accountingController');

const accountingController = new AccountingController(accountingService, models);
app.use('/api/accounting', accountingRoutes(accountingController));
```

### 5. Frontend Components

Register components in main App:

```javascript
// src/App.js
import ChartOfAccounts from './components/ChartOfAccounts';
import GeneralLedger from './components/GeneralLedger';
import FinancialStatements from './components/FinancialStatements';
import ExpenseTracker from './components/ExpenseTracker';

// Add to routing
<Route path="/accounting/coa" element={<ChartOfAccounts />} />
<Route path="/accounting/gl" element={<GeneralLedger />} />
<Route path="/accounting/statements" element={<FinancialStatements />} />
<Route path="/accounting/expenses" element={<ExpenseTracker />} />
```

---

## Core Features

### 1. Chart of Accounts Management

#### Create Account
```bash
POST /api/accounting/accounts
Content-Type: application/json

{
  "accountNumber": "1010",
  "accountName": "Cash - Checking",
  "accountType": "Asset",
  "subType": "Current Asset",
  "normalBalance": "Debit",
  "description": "Primary business checking account"
}
```

#### Get All Accounts
```bash
GET /api/accounting/accounts
GET /api/accounting/accounts?accountType=Asset&isActive=true
```

#### Update Account
```bash
PUT /api/accounting/accounts/1010
Content-Type: application/json

{
  "accountName": "Cash - Checking Account",
  "isActive": true
}
```

### 2. Journal Entry Posting

#### Post Journal Entry
```bash
POST /api/accounting/journal-entries
Content-Type: application/json

{
  "entryDate": "2024-01-15",
  "description": "Record equipment purchase",
  "reference": "INV-001",
  "referenceType": "purchase",
  "entries": [
    {
      "accountNumber": "1500",
      "debitAmount": 5000,
      "creditAmount": 0,
      "description": "Equipment"
    },
    {
      "accountNumber": "2000",
      "debitAmount": 0,
      "creditAmount": 5000,
      "description": "Accounts Payable"
    }
  ]
}
```

**Validation Rules:**
- `totalDebits === totalCredits` (within $0.01 tolerance)
- All account numbers must exist
- Entry date must be valid
- Minimum 2 entries per journal entry

### 3. General Ledger Viewing

#### Get GL for Account
```bash
GET /api/accounting/general-ledger/1010
GET /api/accounting/general-ledger/1010?startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "account": {
    "accountNumber": "1010",
    "accountName": "Cash - Checking"
  },
  "entries": [
    {
      "id": "uuid",
      "entryDate": "2024-01-15",
      "description": "Initial deposit",
      "debitAmount": 10000,
      "creditAmount": 0,
      "runningBalance": 10000
    }
  ]
}
```

### 4. Financial Statements

#### Income Statement (P&L)
```bash
GET /api/accounting/income-statement?startDate=2024-01-01&endDate=2024-12-31
```

**Output:**
```json
{
  "success": true,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "data": {
    "revenues": [
      { "accountName": "Sales Revenue", "amount": 50000 }
    ],
    "totalRevenue": 50000,
    "expenses": [
      { "accountName": "Salaries Expense", "amount": 20000 },
      { "accountName": "Rent Expense", "amount": 5000 }
    ],
    "totalExpenses": 25000,
    "netIncome": 25000,
    "profitMargin": 50.0
  }
}
```

#### Balance Sheet
```bash
GET /api/accounting/balance-sheet?asOfDate=2024-12-31
```

**Output:**
```json
{
  "success": true,
  "asOfDate": "2024-12-31",
  "data": {
    "assets": [
      { "accountName": "Cash", "balance": 50000 }
    ],
    "totalAssets": 50000,
    "liabilities": [],
    "totalLiabilities": 0,
    "equity": [
      { "accountName": "Retained Earnings", "balance": 50000 }
    ],
    "totalEquity": 50000
  }
}
```

#### Cash Flow Statement
```bash
GET /api/accounting/cash-flow?startDate=2024-01-01&endDate=2024-12-31
```

### 5. Trial Balance

#### Get Trial Balance
```bash
GET /api/accounting/trial-balance?asOfDate=2024-12-31
```

**Validation:**
- Sum of all Debit balances
- Sum of all Credit balances
- If equal → Accounts are balanced
- If not equal → Error in GL entries

### 6. Expense Management

#### Record Expense
```bash
POST /api/accounting/expenses
Content-Type: application/json

{
  "expenseDate": "2024-01-15",
  "supplierId": "supplier-id",
  "category": "Office Supplies",
  "amount": 250.50,
  "description": "Paper, pens, and toner",
  "receiptUrl": "https://..."
}
```

**Categories:**
- Office Supplies
- Utilities
- Rent
- Salaries
- Marketing
- Travel
- Meals
- Equipment
- Other

#### Approve Expense
```bash
PUT /api/accounting/expenses/{expenseId}/approve
```

**Process:**
1. Change status from "pending" → "approved"
2. Auto-create journal entry
3. Debit Expense Account
4. Credit Cash/AP Account
5. Update account balances

### 7. Supplier Management

#### Create Supplier
```bash
POST /api/accounting/suppliers
Content-Type: application/json

{
  "supplierName": "Office Depot",
  "contactPerson": "John Doe",
  "email": "contact@officedepot.com",
  "phone": "1-800-123-4567",
  "address": "123 Business Ave, Suite 100",
  "taxId": "12-3456789",
  "paymentTerms": "Net 30"
}
```

#### Get Suppliers
```bash
GET /api/accounting/suppliers
GET /api/accounting/suppliers?isActive=true
```

---

## Database Schema

### ChartOfAccounts Table
```sql
CREATE TABLE "ChartOfAccounts" (
  id UUID PRIMARY KEY,
  accountNumber VARCHAR(10) UNIQUE NOT NULL,
  accountName VARCHAR(255) NOT NULL,
  accountType ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense', ...),
  subType VARCHAR(255),
  normalBalance ENUM('Debit', 'Credit'),
  balance DECIMAL(15, 2) DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  description TEXT,
  createdBy VARCHAR(255),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### GeneralLedger Table
```sql
CREATE TABLE "GeneralLedger" (
  id UUID PRIMARY KEY,
  journalEntryId UUID NOT NULL,
  accountId UUID NOT NULL,
  accountNumber VARCHAR(10),
  debitAmount DECIMAL(15, 2) DEFAULT 0,
  creditAmount DECIMAL(15, 2) DEFAULT 0,
  description VARCHAR(255),
  entryDate DATE,
  reference VARCHAR(255),
  referenceType VARCHAR(50),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### JournalEntry Table
```sql
CREATE TABLE "JournalEntries" (
  id UUID PRIMARY KEY,
  entryNumber VARCHAR(20) UNIQUE,
  entryDate DATE NOT NULL,
  description VARCHAR(255),
  reference VARCHAR(255),
  referenceType VARCHAR(50),
  totalAmount DECIMAL(15, 2),
  status ENUM('draft', 'posted', 'reversed'),
  memo TEXT,
  createdBy VARCHAR(255),
  reversalEntryId UUID,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Expense Table
```sql
CREATE TABLE "Expenses" (
  id UUID PRIMARY KEY,
  expenseDate DATE NOT NULL,
  supplierId UUID,
  category ENUM('Office Supplies', 'Utilities', ...),
  amount DECIMAL(15, 2),
  description TEXT,
  receiptUrl VARCHAR(255),
  status ENUM('pending', 'approved', 'paid', 'rejected'),
  createdBy VARCHAR(255),
  approvedBy VARCHAR(255),
  approvedAt TIMESTAMP,
  paidAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### Supplier Table
```sql
CREATE TABLE "Suppliers" (
  id UUID PRIMARY KEY,
  supplierName VARCHAR(255) NOT NULL,
  contactPerson VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  taxId VARCHAR(50),
  paymentTerms VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  totalPaid DECIMAL(15, 2) DEFAULT 0,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### BudgetAllocation Table
```sql
CREATE TABLE "BudgetAllocations" (
  id UUID PRIMARY KEY,
  fiscalYear INTEGER NOT NULL,
  fiscalMonth INTEGER NOT NULL,
  accountId UUID NOT NULL,
  accountNumber VARCHAR(10),
  budgetedAmount DECIMAL(15, 2),
  actualAmount DECIMAL(15, 2),
  variance DECIMAL(15, 2),
  variancePercentage DECIMAL(5, 2),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

---

## Integration Guide

### Auto-Posting from POS Sales

When a sale is recorded, automatically create a GL entry:

```javascript
// In billingController.js
const sale = await Sale.create(saleData);

// Post to GL
await accountingService.autoPostSale({
  saleId: sale.id,
  amount: sale.totalAmount,
  date: sale.saleDate,
  customerId: sale.customerId
});

// This creates:
// Debit: Cash (Asset) / AR (Asset)
// Credit: Sales Revenue (Revenue)
```

### Auto-Posting from Orders

When an order is placed:

```javascript
// In orderController.js
const order = await Order.create(orderData);

// Post to GL
await accountingService.autoPostOrder({
  orderId: order.id,
  amount: order.totalAmount,
  date: order.orderDate,
  customerId: order.customerId
});

// This creates:
// Debit: Accounts Receivable (Asset)
// Credit: Sales Revenue (Revenue)
```

### Webhook Integration

Integrate accounting with other modules:

```javascript
// Expense approval workflow
app.on('expense:approved', async (expenseData) => {
  await accountingService.approveExpense(expenseData.expenseId);
});

// License fee posting
app.on('subscription:renewed', async (subData) => {
  await accountingService.autoPostSale({
    amount: subData.amount,
    date: new Date(),
    description: `License Renewal: ${subData.licenseId}`
  });
});
```

---

## Configuration

### Accounting Settings

Create `.env` variables:

```env
# Fiscal Year Configuration
FISCAL_YEAR_START_MONTH=1          # January
FISCAL_PERIOD=MONTHLY              # MONTHLY, QUARTERLY, ANNUAL

# GL Posting
GL_AUTO_POSTING=true               # Auto-post sales/orders
GL_BALANCE_CHECK=true              # Validate debits=credits
GL_ROUNDING_TOLERANCE=0.01         # Tolerance for balance checks

# Expense Approval
EXPENSE_APPROVAL_REQUIRED=true      # Require approval before GL posting
EXPENSE_AUTO_APPROVAL_LIMIT=500     # Auto-approve under $500

# Reporting
REPORT_DATE_FORMAT=YYYY-MM-DD
REPORT_CURRENCY=USD
```

### Default Chart of Accounts

Initialize with standard COA:

```javascript
// seeds/chartOfAccounts.js
const defaultAccounts = [
  // Assets
  { accountNumber: '1010', accountName: 'Cash - Checking', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit' },
  { accountNumber: '1050', accountName: 'Cash - Savings', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit' },
  { accountNumber: '1200', accountName: 'Accounts Receivable', accountType: 'Asset', subType: 'Current Asset', normalBalance: 'Debit' },
  { accountNumber: '1500', accountName: 'Equipment', accountType: 'Asset', subType: 'Fixed Asset', normalBalance: 'Debit' },
  
  // Liabilities
  { accountNumber: '2000', accountName: 'Accounts Payable', accountType: 'Liability', subType: 'Current Liability', normalBalance: 'Credit' },
  { accountNumber: '2500', accountName: 'Loans Payable', accountType: 'Liability', subType: 'Long-term Liability', normalBalance: 'Credit' },
  
  // Equity
  { accountNumber: '3000', accountName: 'Owner\'s Capital', accountType: 'Equity', normalBalance: 'Credit' },
  { accountNumber: '3100', accountName: 'Retained Earnings', accountType: 'Equity', normalBalance: 'Credit' },
  
  // Revenue
  { accountNumber: '4000', accountName: 'Sales Revenue', accountType: 'Revenue', normalBalance: 'Credit' },
  { accountNumber: '4100', accountName: 'Service Revenue', accountType: 'Revenue', normalBalance: 'Credit' },
  
  // Expenses
  { accountNumber: '5000', accountName: 'Salaries Expense', accountType: 'Expense', normalBalance: 'Debit' },
  { accountNumber: '5100', accountName: 'Rent Expense', accountType: 'Expense', normalBalance: 'Debit' },
  { accountNumber: '5200', accountName: 'Utilities Expense', accountType: 'Expense', normalBalance: 'Debit' },
  { accountNumber: '5300', accountName: 'Office Supplies Expense', accountType: 'Expense', normalBalance: 'Debit' },
  { accountNumber: '5400', accountName: 'Marketing Expense', accountType: 'Expense', normalBalance: 'Debit' },
];
```

---

## Testing

### Unit Tests

```javascript
// test/accounting.test.js
describe('Accounting Service', () => {
  describe('Journal Entry Posting', () => {
    it('should post balanced entry', async () => {
      const entry = {
        entryDate: new Date(),
        description: 'Test entry',
        entries: [
          { accountNumber: '1010', debitAmount: 100, creditAmount: 0 },
          { accountNumber: '2000', debitAmount: 0, creditAmount: 100 }
        ]
      };

      const result = await accountingService.postJournalEntry(entry);
      expect(result.success).toBe(true);
    });

    it('should reject unbalanced entry', async () => {
      const entry = {
        entries: [
          { accountNumber: '1010', debitAmount: 100, creditAmount: 0 },
          { accountNumber: '2000', debitAmount: 0, creditAmount: 50 } // Unbalanced!
        ]
      };

      expect(() => accountingService.postJournalEntry(entry))
        .toThrow('Journal entry not balanced');
    });
  });

  describe('Financial Statements', () => {
    it('should generate income statement', async () => {
      const statement = await accountingService.getIncomeStatement(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(statement).toHaveProperty('totalRevenue');
      expect(statement).toHaveProperty('totalExpenses');
      expect(statement).toHaveProperty('netIncome');
    });

    it('should generate balance sheet', async () => {
      const sheet = await accountingService.getBalanceSheet(new Date());

      expect(statement).toHaveProperty('totalAssets');
      expect(statement).toHaveProperty('totalLiabilities');
      expect(statement).toHaveProperty('totalEquity');
    });
  });
});
```

### Integration Tests

```javascript
// test/accounting-integration.test.js
describe('Accounting Integration', () => {
  it('should auto-post sale and update GL', async () => {
    const sale = await Sale.create({
      totalAmount: 1000,
      saleDate: new Date()
    });

    await accountingService.autoPostSale(sale);

    const cashAccount = await ChartOfAccounts.findOne({ where: { accountNumber: '1010' } });
    expect(parseFloat(cashAccount.balance)).toBe(1000);

    const revenueAccount = await ChartOfAccounts.findOne({ where: { accountNumber: '4000' } });
    expect(parseFloat(revenueAccount.balance)).toBe(-1000); // Credit balance
  });
});
```

### API Tests

```bash
# Create Chart of Account
curl -X POST http://localhost:5000/api/accounting/accounts \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1010",
    "accountName": "Cash",
    "accountType": "Asset",
    "normalBalance": "Debit"
  }'

# Post Journal Entry
curl -X POST http://localhost:5000/api/accounting/journal-entries \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "entryDate": "2024-01-15",
    "description": "Test entry",
    "entries": [
      {"accountNumber": "1010", "debitAmount": 100, "creditAmount": 0},
      {"accountNumber": "2000", "debitAmount": 0, "creditAmount": 100}
    ]
  }'

# Get Financial Statement
curl -X GET "http://localhost:5000/api/accounting/income-statement?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer {token}"
```

---

## Troubleshooting

### Common Issues

#### 1. Journal Entry Not Balanced

**Error:** "Journal entry not balanced. Debits: 100, Credits: 50"

**Solution:**
- Verify sum of all debit amounts
- Verify sum of all credit amounts
- Ensure they're within $0.01 tolerance
- Use trial balance to verify account balances

#### 2. Account Not Found

**Error:** "Account 1010 not found"

**Solution:**
- Check that account exists in Chart of Accounts
- Verify account number spelling
- Create account if it doesn't exist
- Check if account is marked as inactive

#### 3. Financial Statement Shows Zero

**Issue:** Income statement shows $0 revenue despite sales

**Solution:**
- Verify auto-posting is enabled
- Check if sales are actually recorded
- Verify revenue account exists and is correct type
- Review GL entries for the account

#### 4. Balance Sheet Doesn't Balance

**Issue:** Assets ≠ Liabilities + Equity

**Solution:**
1. Generate Trial Balance
2. Identify accounts with non-zero balances
3. Review GL entries for those accounts
4. Look for posting errors (wrong account type, etc.)
5. Reverse incorrect entries if found

### Debug Mode

Enable debugging in `.env`:

```env
ACCOUNTING_DEBUG=true
LOG_LEVEL=debug
```

Then check logs:

```bash
tail -f logs/accounting.log
```

### Performance Tuning

For large GL entries:

```javascript
// Disable real-time balance updates
GL_BALANCE_UPDATE_BATCH=true   // Update hourly instead
GL_BATCH_SIZE=100              // Batch process 100 at a time

// Use indexes
CREATE INDEX idx_gl_account ON "GeneralLedger"(accountNumber);
CREATE INDEX idx_je_date ON "JournalEntries"(entryDate);
```

---

## Best Practices

1. **Always Balance Entries** - Never force an unbalanced entry
2. **Use Reference Numbers** - Link GL entries to source documents
3. **Approve Before Posting** - Require approval for all manual entries
4. **Regular Reconciliation** - Reconcile bank accounts monthly
5. **Archive Old Data** - Archive closed fiscal periods quarterly
6. **Backup Financial Data** - Daily backups of GL and COA
7. **Audit Trail** - Log all GL changes with user and timestamp

---

## Support & Documentation

- **API Reference**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
- **Database Schema**: [database/SCHEMA.md](database/SCHEMA.md)
- **Phase 2 Billing**: [Readme/PHASE2_IMPLEMENTATION_GUIDE.md](Readme/PHASE2_IMPLEMENTATION_GUIDE.md)
- **GitHub Issues**: https://github.com/tradifyglobal/Retail-ERP/issues

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production Ready
