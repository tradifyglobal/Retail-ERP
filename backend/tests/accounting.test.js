/**
 * Accounting Module Test Suite
 * Tests all API endpoints and business logic
 * Run: node tests/accounting.test.js
 */

const axios = require('axios');
const assert = require('assert');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Test configuration
const config = {
  testToken: process.env.TEST_TOKEN || 'test-jwt-token',
  headers: (token) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  })
};

// Test Results
let passed = 0;
let failed = 0;
const results = [];

// Test Helper Functions
async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ test: name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    failed++;
    results.push({ test: name, status: '❌ FAIL', error: error.message });
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n🧪 ACCOUNTING MODULE TEST SUITE');
  console.log('=' .repeat(60));
  console.log(`Testing: ${BASE_URL}\n`);

  // ===== 1. Chart of Accounts Tests =====
  console.log('\n📋 CHART OF ACCOUNTS TESTS');
  console.log('-'.repeat(60));

  let createdAccountId = null;

  await test('GET /api/accounting/accounts - List all accounts', async () => {
    const response = await axios.get(`${BASE_URL}/api/accounting/accounts`, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data.data), 'Should return array of accounts');
    assert.ok(response.data.data.length > 0, 'Should have accounts');
  });

  await test('POST /api/accounting/accounts - Create new account', async () => {
    const response = await axios.post(`${BASE_URL}/api/accounting/accounts`, {
      accountNumber: '9999',
      accountName: 'Test Account',
      accountType: 'Asset',
      subType: 'Current Asset',
      normalBalance: 'Debit',
      description: 'Test account for validation'
    }, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 201);
    assert.ok(response.data.data.id, 'Should return created account with ID');
    createdAccountId = response.data.data.id;
  });

  await test('GET /api/accounting/accounts/:accountNumber - Get single account', async () => {
    const response = await axios.get(`${BASE_URL}/api/accounting/accounts/9999`, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.data.accountNumber, '9999');
    assert.strictEqual(response.data.data.accountName, 'Test Account');
  });

  await test('PUT /api/accounting/accounts/:accountNumber - Update account', async () => {
    const response = await axios.put(`${BASE_URL}/api/accounting/accounts/9999`, {
      accountName: 'Updated Test Account',
      isActive: true
    }, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.data.accountName, 'Updated Test Account');
  });

  // ===== 2. Journal Entry Tests =====
  console.log('\n📝 JOURNAL ENTRY TESTS');
  console.log('-'.repeat(60));

  await test('POST /api/accounting/journal-entries - Post balanced entry', async () => {
    const response = await axios.post(`${BASE_URL}/api/accounting/journal-entries`, {
      entryDate: new Date().toISOString().split('T')[0],
      description: 'Test journal entry',
      reference: 'TEST-001',
      referenceType: 'test',
      entries: [
        {
          accountNumber: '1010',  // Cash
          debitAmount: 1000,
          creditAmount: 0,
          description: 'Cash deposit'
        },
        {
          accountNumber: '3000',  // Owner\'s Capital
          debitAmount: 0,
          creditAmount: 1000,
          description: 'Capital contribution'
        }
      ]
    }, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 201);
    assert.ok(response.data.data.entryNumber, 'Should have entry number');
  });

  await test('POST /api/accounting/journal-entries - Reject unbalanced entry', async () => {
    try {
      await axios.post(`${BASE_URL}/api/accounting/journal-entries`, {
        entryDate: new Date().toISOString().split('T')[0],
        description: 'Unbalanced entry',
        entries: [
          { accountNumber: '1010', debitAmount: 1000, creditAmount: 0 },
          { accountNumber: '3000', debitAmount: 0, creditAmount: 500 } // Unbalanced!
        ]
      }, {
        headers: config.headers(config.testToken)
      });
      throw new Error('Should have rejected unbalanced entry');
    } catch (error) {
      assert.ok(error.response.status === 400, 'Should return 400 for unbalanced entry');
      assert.ok(error.response.data.message.includes('not balanced'), 'Should indicate balance issue');
    }
  });

  // ===== 3. General Ledger Tests =====
  console.log('\n📊 GENERAL LEDGER TESTS');
  console.log('-'.repeat(60));

  await test('GET /api/accounting/general-ledger/:accountNumber - View GL', async () => {
    const response = await axios.get(`${BASE_URL}/api/accounting/general-ledger/1010`, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.account, 'Should return account info');
    assert.ok(Array.isArray(response.data.entries), 'Should return GL entries');
  });

  await test('GET /api/accounting/general-ledger/:accountNumber with date range', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const response = await axios.get(
      `${BASE_URL}/api/accounting/general-ledger/1010?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
      { headers: config.headers(config.testToken) }
    );
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data.entries), 'Should filter by date range');
  });

  // ===== 4. Trial Balance Tests =====
  console.log('\n⚖️  TRIAL BALANCE TESTS');
  console.log('-'.repeat(60));

  await test('GET /api/accounting/trial-balance - Get trial balance', async () => {
    const response = await axios.get(`${BASE_URL}/api/accounting/trial-balance`, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.balances, 'Should return account balances');
    assert.ok(response.data.totals, 'Should return totals');
    assert.ok(response.data.totals.totalDebits !== undefined, 'Should have total debits');
    assert.ok(response.data.totals.totalCredits !== undefined, 'Should have total credits');
  });

  // ===== 5. Financial Statement Tests =====
  console.log('\n📈 FINANCIAL STATEMENT TESTS');
  console.log('-'.repeat(60));

  const today = new Date().toISOString().split('T')[0];
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

  await test('GET /api/accounting/income-statement - Get P&L', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/accounting/income-statement?startDate=${startOfYear}&endDate=${today}`,
      { headers: config.headers(config.testToken) }
    );
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.data, 'Should return statement data');
    assert.ok(response.data.data.revenues !== undefined, 'Should have revenues');
    assert.ok(response.data.data.expenses !== undefined, 'Should have expenses');
    assert.ok(response.data.data.netIncome !== undefined, 'Should calculate net income');
  });

  await test('GET /api/accounting/balance-sheet - Get balance sheet', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/accounting/balance-sheet?asOfDate=${today}`,
      { headers: config.headers(config.testToken) }
    );
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.data, 'Should return statement data');
    assert.ok(response.data.data.assets !== undefined, 'Should have assets');
    assert.ok(response.data.data.liabilities !== undefined, 'Should have liabilities');
    assert.ok(response.data.data.equity !== undefined, 'Should have equity');
  });

  await test('GET /api/accounting/cash-flow - Get cash flow statement', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/accounting/cash-flow?startDate=${startOfYear}&endDate=${today}`,
      { headers: config.headers(config.testToken) }
    );
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.data, 'Should return statement data');
  });

  // ===== 6. Expense Tests =====
  console.log('\n💰 EXPENSE TESTS');
  console.log('-'.repeat(60));

  let createdExpenseId = null;

  await test('POST /api/accounting/expenses - Record expense', async () => {
    const response = await axios.post(`${BASE_URL}/api/accounting/expenses`, {
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'Office Supplies',
      amount: 150.50,
      description: 'Test office supplies',
      receiptUrl: 'https://example.com/receipt.pdf'
    }, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.data.status, 'pending');
    createdExpenseId = response.data.data.id;
  });

  await test('GET /api/accounting/expenses - List expenses', async () => {
    const response = await axios.get(`${BASE_URL}/api/accounting/expenses`, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data.data), 'Should return array of expenses');
  });

  if (createdExpenseId) {
    await test('PUT /api/accounting/expenses/:id/approve - Approve expense', async () => {
      const response = await axios.put(
        `${BASE_URL}/api/accounting/expenses/${createdExpenseId}/approve`,
        {},
        { headers: config.headers(config.testToken) }
      );
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.data.status, 'approved');
    });
  }

  // ===== 7. Supplier Tests =====
  console.log('\n🏢 SUPPLIER TESTS');
  console.log('-'.repeat(60));

  await test('POST /api/accounting/suppliers - Create supplier', async () => {
    const response = await axios.post(`${BASE_URL}/api/accounting/suppliers`, {
      supplierName: 'Test Supplier Inc',
      contactPerson: 'John Doe',
      email: 'john@testsupplier.com',
      phone: '555-1234',
      address: '123 Business Ave',
      taxId: '12-3456789',
      paymentTerms: 'Net 30'
    }, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 201);
    assert.ok(response.data.data.id, 'Should create supplier with ID');
  });

  await test('GET /api/accounting/suppliers - List suppliers', async () => {
    const response = await axios.get(`${BASE_URL}/api/accounting/suppliers`, {
      headers: config.headers(config.testToken)
    });
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data.data), 'Should return array of suppliers');
  });

  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total:  ${passed + failed}\n`);

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED\n');
    console.log('Failed Tests:');
    results.filter(r => r.status.includes('FAIL')).forEach(r => {
      console.log(`  - ${r.test}`);
      if (r.error) console.log(`    ${r.error}`);
    });
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error.message);
  process.exit(1);
});
