import React, { useState, useEffect } from 'react';
import styles from '../styles/accountingStyles.css';

/**
 * Expense Tracker Component
 * Record expenses and manage approval workflow
 */
const ExpenseTracker = ({ authStore }) => {
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({ status: '', category: '' });

  // New expense form
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    category: 'Office Supplies',
    amount: '',
    description: '',
    receiptUrl: ''
  });

  const categories = [
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

  // Fetch data on mount
  useEffect(() => {
    fetchExpenses();
    fetchSuppliers();
  }, []);

  // Fetch expenses with filters
  const fetchExpenses = async (status = '', category = '') => {
    setLoading(true);
    try {
      let url = '/api/accounting/expenses';
      const params = [];
      if (status) params.push(`status=${status}`);
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      const result = await response.json();
      if (result.success) {
        setExpenses(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/accounting/suppliers', {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      const result = await response.json();
      if (result.success) {
        setSuppliers(result.data);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  // Record new expense
  const handleRecordExpense = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Expense recorded successfully');
        setFormData({
          expenseDate: new Date().toISOString().split('T')[0],
          supplierId: '',
          category: 'Office Supplies',
          amount: '',
          description: '',
          receiptUrl: ''
        });
        fetchExpenses(filters.status, filters.category);
        setActiveTab('list');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to record expense');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Approve expense
  const handleApproveExpense = async (expenseId) => {
    if (!window.confirm('Approve this expense and post to GL?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/accounting/expenses/${expenseId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Expense approved and posted to GL');
        fetchExpenses(filters.status, filters.category);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to approve expense');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses
  const handleFilterChange = async (newStatus, newCategory) => {
    setFilters({ status: newStatus, category: newCategory });
    await fetchExpenses(newStatus, newCategory);
  };

  // Calculate totals
  const calculateTotals = (expenseList) => {
    return {
      pending: expenseList.filter(e => e.status === 'pending').reduce((sum, e) => sum + parseFloat(e.amount), 0),
      approved: expenseList.filter(e => e.status === 'approved').reduce((sum, e) => sum + parseFloat(e.amount), 0),
      paid: expenseList.filter(e => e.status === 'paid').reduce((sum, e) => sum + parseFloat(e.amount), 0),
      total: expenseList.reduce((sum, e) => sum + parseFloat(e.amount), 0)
    };
  };

  const totals = calculateTotals(expenses);

  return (
    <div className="accounting-container">
      <h2>Expense Tracker</h2>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card pending">
          <h4>Pending Approval</h4>
          <p className="amount">${totals.pending.toFixed(2)}</p>
        </div>
        <div className="card approved">
          <h4>Approved</h4>
          <p className="amount">${totals.approved.toFixed(2)}</p>
        </div>
        <div className="card paid">
          <h4>Paid</h4>
          <p className="amount">${totals.paid.toFixed(2)}</p>
        </div>
        <div className="card total">
          <h4>Total</h4>
          <p className="amount">${totals.total.toFixed(2)}</p>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Expenses List
        </button>
        <button
          className={`tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          Record Expense
        </button>
      </div>

      {/* Expenses List */}
      {activeTab === 'list' && (
        <div>
          <div className="filter-section">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange(e.target.value, filters.category)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange(filters.status, e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {expenses.length > 0 ? (
            <div className="table-container">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Supplier</th>
                    <th className="amount">Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                      <td>{expense.category}</td>
                      <td>{expense.description || '-'}</td>
                      <td>{expense.Supplier?.supplierName || 'N/A'}</td>
                      <td className="amount">${parseFloat(expense.amount).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge status-${expense.status}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td>
                        {expense.status === 'pending' && (
                          <button
                            className="btn-approve"
                            onClick={() => handleApproveExpense(expense.id)}
                            disabled={loading}
                          >
                            Approve
                          </button>
                        )}
                        {expense.receiptUrl && (
                          <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-view">
                            Receipt
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No expenses found.</p>
            </div>
          )}
        </div>
      )}

      {/* Record Expense Form */}
      {activeTab === 'new' && (
        <form onSubmit={handleRecordExpense} className="form-section">
          <div className="form-group">
            <label>Expense Date</label>
            <input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Supplier</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            >
              <option value="">Select Supplier (Optional)</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this expense for?"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Receipt URL</label>
            <input
              type="url"
              value={formData.receiptUrl}
              onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Record Expense'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ExpenseTracker;
