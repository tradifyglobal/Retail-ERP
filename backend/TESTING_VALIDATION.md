# Phase 4: Accounting Module - Testing & Validation Plan

**Status:** In Progress  
**Test Date:** January 2024  
**Validator:** Automated Test Suite  

---

## Pre-Testing Checklist

Before running tests, verify:

- [ ] Database is running (PostgreSQL)
- [ ] Backend server can start (`npm start` in backend/)
- [ ] `.env` file is configured with DB credentials
- [ ] Node packages are installed (`npm install`)
- [ ] Port 5000 is available

---

## Testing Phases

### Phase 1: Database & Models Setup

**Objective:** Verify database models are created and registered

```bash
# 1. Check database connection
node -e "const db = require('./src/config/database'); db.authenticate().then(() => console.log('✅ DB Connected')).catch(err => console.log('❌ Error:', err.message));"

# 2. Seed Chart of Accounts
node seeds/seedChartOfAccounts.js

# Expected output:
# ✅ Database synchronized
# ✅ Seeded 50+ Chart of Accounts
# Asset: 16 accounts
# Liability: 10 accounts
# Equity: 5 accounts
# Revenue: 6 accounts
# Expense: 25+ accounts
```

**Validation Points:**
- [ ] Database tables created (6 accounting tables)
- [ ] 50+ default GL accounts seeded
- [ ] All account types represented (Asset, Liability, Equity, Revenue, Expense)
- [ ] Foreign key relationships established

---

### Phase 2: API Server Startup

**Objective:** Verify server starts with accounting module

```bash
# Start backend server
cd backend
npm start

# Expected output:
# 🚀 Server running on port 5000 in development mode
# ✅ Database connected
# ✅ Accounting module initialized
```

**Validation Points:**
- [ ] Server starts without errors
- [ ] All routes registered (including `/api/accounting`)
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Database connection pool active
- [ ] Logger initialized

---

### Phase 3: Manual API Tests

**Objective:** Test core endpoints manually

#### 3.1 Chart of Accounts

```bash
# Get all accounts
curl -X GET http://localhost:5000/api/accounting/accounts \
  -H "Authorization: Bearer {test-token}" \
  -H "Content-Type: application/json"

# Expected: 200, array of 50+ accounts

# Get single account
curl -X GET http://localhost:5000/api/accounting/accounts/1010 \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, {accountNumber: "1010", accountName: "Cash - Checking", ...}

# Create new account
curl -X POST http://localhost:5000/api/accounting/accounts \
  -H "Authorization: Bearer {test-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "9999",
    "accountName": "Test Account",
    "accountType": "Asset",
    "normalBalance": "Debit"
  }'

# Expected: 201, {id: "uuid", accountNumber: "9999", ...}
```

**Validation Points:**
- [ ] List accounts returns 50+ records
- [ ] Single account retrieval works
- [ ] New account creation works
- [ ] Account filtering by type works
- [ ] Duplicate account numbers are rejected

#### 3.2 Journal Entry Posting

```bash
# Post balanced journal entry
curl -X POST http://localhost:5000/api/accounting/journal-entries \
  -H "Authorization: Bearer {test-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "entryDate": "2024-01-15",
    "description": "Test entry",
    "reference": "TEST-001",
    "entries": [
      {"accountNumber": "1010", "debitAmount": 1000, "creditAmount": 0, "description": "Cash"},
      {"accountNumber": "3000", "debitAmount": 0, "creditAmount": 1000, "description": "Capital"}
    ]
  }'

# Expected: 201, entry posted successfully

# Try unbalanced entry
curl -X POST http://localhost:5000/api/accounting/journal-entries \
  -H "Authorization: Bearer {test-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "entries": [
      {"accountNumber": "1010", "debitAmount": 1000, "creditAmount": 0},
      {"accountNumber": "3000", "debitAmount": 0, "creditAmount": 500}
    ]
  }'

# Expected: 400, "Journal entry not balanced"
```

**Validation Points:**
- [ ] Balanced entries post successfully
- [ ] Unbalanced entries are rejected
- [ ] Account balances update correctly
- [ ] Entry numbers are generated (JE20240001, etc.)
- [ ] Journal entries with multiple GL entries work

#### 3.3 General Ledger

```bash
# View GL for account
curl -X GET http://localhost:5000/api/accounting/general-ledger/1010 \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, array of GL entries with running balance

# View GL with date filter
curl -X GET "http://localhost:5000/api/accounting/general-ledger/1010?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, filtered GL entries
```

**Validation Points:**
- [ ] GL entries visible for posted accounts
- [ ] Running balance calculates correctly
- [ ] Date range filtering works
- [ ] GL entries linked to Journal Entries

#### 3.4 Trial Balance

```bash
# Get trial balance
curl -X GET http://localhost:5000/api/accounting/trial-balance \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, with totals.totalDebits === totals.totalCredits
```

**Validation Points:**
- [ ] Trial balance returns all accounts
- [ ] Total debits equal total credits
- [ ] `isBalanced` flag is true
- [ ] All account balances displayed

#### 3.5 Financial Statements

```bash
# Get P&L
curl -X GET "http://localhost:5000/api/accounting/income-statement?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, with revenues, expenses, netIncome

# Get Balance Sheet
curl -X GET "http://localhost:5000/api/accounting/balance-sheet?asOfDate=2024-12-31" \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, with assets, liabilities, equity (balanced)

# Get Cash Flow
curl -X GET "http://localhost:5000/api/accounting/cash-flow?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, with operating, investing, financing activities
```

**Validation Points:**
- [ ] P&L calculates net income correctly
- [ ] Balance Sheet balances (Assets = Liab + Equity)
- [ ] Cash Flow shows activity sections
- [ ] All statements generate in <100ms

#### 3.6 Expenses

```bash
# Record expense
curl -X POST http://localhost:5000/api/accounting/expenses \
  -H "Authorization: Bearer {test-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "expenseDate": "2024-01-15",
    "category": "Office Supplies",
    "amount": 250.50,
    "description": "Test supplies"
  }'

# Expected: 201, expense created with status: "pending"

# Get expenses
curl -X GET http://localhost:5000/api/accounting/expenses \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, array of expenses

# Approve expense
curl -X PUT http://localhost:5000/api/accounting/expenses/{expenseId}/approve \
  -H "Authorization: Bearer {test-token}"

# Expected: 200, status changed to "approved", GL entries created
```

**Validation Points:**
- [ ] Expense recording works
- [ ] Expense approval creates GL entries
- [ ] Expense filtering by status works
- [ ] GL balances update after approval

---

### Phase 4: Automated Test Suite

**Objective:** Run comprehensive automated tests

```bash
# Run full test suite
node tests/accounting.test.js

# Or with npm script (add to package.json):
npm run test:accounting
```

**Expected Output:**
```
✅ GET /api/accounting/accounts - List all accounts
✅ POST /api/accounting/accounts - Create new account
✅ GET /api/accounting/accounts/:accountNumber - Get single account
✅ PUT /api/accounting/accounts/:accountNumber - Update account
✅ POST /api/accounting/journal-entries - Post balanced entry
✅ POST /api/accounting/journal-entries - Reject unbalanced entry
✅ GET /api/accounting/general-ledger/:accountNumber - View GL
✅ GET /api/accounting/trial-balance - Get trial balance
✅ GET /api/accounting/income-statement - Get P&L
✅ GET /api/accounting/balance-sheet - Get balance sheet
✅ GET /api/accounting/cash-flow - Get cash flow statement
✅ POST /api/accounting/expenses - Record expense
✅ GET /api/accounting/expenses - List expenses
✅ PUT /api/accounting/expenses/:id/approve - Approve expense
✅ POST /api/accounting/suppliers - Create supplier
✅ GET /api/accounting/suppliers - List suppliers

📊 TEST SUMMARY
✅ Passed: 16
❌ Failed: 0
📝 Total:  16

🎉 ALL TESTS PASSED!
```

**Validation Points:**
- [ ] All 16+ tests pass
- [ ] No failed assertions
- [ ] Response times < 500ms
- [ ] No database errors

---

### Phase 5: Integration Testing

**Objective:** Test integration with other modules

#### 5.1 Auto-Posting from Sales

```javascript
// Simulate a sale
const sale = await Sale.create({
  totalAmount: 1000,
  saleDate: new Date()
});

// Auto-post to GL
await accountingService.autoPostSale({
  saleId: sale.id,
  amount: 1000,
  date: new Date()
});

// Verify GL entries created
const cashAccount = await ChartOfAccounts.findOne({ where: { accountNumber: '1010' } });
assert(parseFloat(cashAccount.balance) === 1000); // ✅ Balance updated

const revenueAccount = await ChartOfAccounts.findOne({ where: { accountNumber: '4000' } });
assert(parseFloat(revenueAccount.balance) === -1000); // ✅ Revenue credited
```

**Validation Points:**
- [ ] Sales create GL entries automatically
- [ ] Cash account debited
- [ ] Revenue account credited
- [ ] Balances update immediately
- [ ] GL entries link correctly

#### 5.2 Auto-Posting from Orders

```javascript
// Similar test for order posting
// Orders should create AR (debit) and Revenue (credit)
```

**Validation Points:**
- [ ] Orders create GL entries
- [ ] AR account debited
- [ ] Revenue account credited

#### 5.3 Licensing Integration

Test that only Professional+ tiers can access accounting:

```bash
# Test with Freemium token (should be blocked)
curl -X GET http://localhost:5000/api/accounting/accounts \
  -H "Authorization: Bearer {freemium-token}"

# Expected: 403, "Insufficient license tier"

# Test with Professional token (should work)
curl -X GET http://localhost:5000/api/accounting/accounts \
  -H "Authorization: Bearer {professional-token}"

# Expected: 200, accounts returned
```

**Validation Points:**
- [ ] Freemium tier blocked from accounting
- [ ] Starter tier blocked from accounting
- [ ] Professional tier can access all features
- [ ] Enterprise tier can access all features

---

### Phase 6: Frontend Component Testing

**Objective:** Verify React components work

#### 6.1 Component Mounting

```bash
# In browser console or React test environment
import ChartOfAccounts from './components/ChartOfAccounts';
import GeneralLedger from './components/GeneralLedger';
import FinancialStatements from './components/FinancialStatements';
import ExpenseTracker from './components/ExpenseTracker';

// Each component should:
// ✅ Mount without errors
// ✅ Render UI elements
// ✅ Handle API calls
// ✅ Display data correctly
```

**Validation Points:**
- [ ] All 4 components load
- [ ] No console errors
- [ ] Buttons and inputs present
- [ ] API calls made on mount

#### 6.2 Component Interactions

- [ ] ChartOfAccounts: Can create/edit/view accounts
- [ ] GeneralLedger: Can select account and view GL
- [ ] FinancialStatements: Can generate all 3 statements
- [ ] ExpenseTracker: Can record/approve expenses

---

## Test Coverage Matrix

| Component | Unit Tests | Integration | E2E |
|-----------|-----------|------------|-----|
| GL Posting | ✅ | ✅ | ✅ |
| COA Management | ✅ | ✅ | ✅ |
| Trial Balance | ✅ | ✅ | ✅ |
| P&L Report | ✅ | ✅ | ✅ |
| Balance Sheet | ✅ | ✅ | ✅ |
| Cash Flow | ✅ | ✅ | ✅ |
| Expense Workflow | ✅ | ✅ | ✅ |
| Auto-Posting | ✅ | ✅ | 🟡 |
| Licensing | ✅ | ✅ | 🟡 |
| Frontend UI | 🟡 | 🟡 | ✅ |

---

## Performance Benchmarks

Expected performance targets:

| Operation | Target | Status |
|-----------|--------|--------|
| Create Account | <50ms | 🟡 Pending |
| Post Entry | <100ms | 🟡 Pending |
| Generate P&L | <100ms | 🟡 Pending |
| Generate BS | <50ms | 🟡 Pending |
| Trial Balance | <50ms | 🟡 Pending |
| List GL (1000 entries) | <500ms | 🟡 Pending |

---

## Known Issues & Limitations

- [ ] None identified yet

---

## Success Criteria

All of the following must be true:

- [ ] All 16+ automated tests pass
- [ ] All manual API tests work
- [ ] Trial balance always balances
- [ ] Financial statements calculate correctly
- [ ] GL entries post without errors
- [ ] Expense approval workflow functions
- [ ] All 4 React components render
- [ ] Performance meets benchmarks
- [ ] Licensing controls work
- [ ] No console errors
- [ ] All database operations complete
- [ ] All responses have proper error handling

---

## Sign-Off

**Date:** _______  
**Tester:** _______  
**Result:** ⬜ PASS | ⬜ FAIL  

### Summary:
- ✅ Total Tests Run: ______
- ✅ Total Tests Passed: ______
- ❌ Total Tests Failed: ______

**Notes:**
