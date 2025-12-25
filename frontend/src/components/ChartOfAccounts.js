import React, { useState, useEffect } from 'react';
import styles from '../styles/accountingStyles.css';

/**
 * Chart of Accounts Component
 * Manage GL chart of accounts
 */
const ChartOfAccounts = ({ authStore }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [filters, setFilters] = useState({ type: '', isActive: '' });
  const [editingId, setEditingId] = useState(null);

  // New account form
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    accountType: 'Asset',
    subType: '',
    normalBalance: 'Debit',
    description: ''
  });

  const accountTypes = [
    'Asset',
    'Liability',
    'Equity',
    'Revenue',
    'Expense',
    'Contra-Asset',
    'Contra-Liability'
  ];

  // Fetch accounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async (type = '', isActive = '') => {
    setLoading(true);
    try {
      let url = '/api/accounting/accounts';
      const params = [];
      if (type) params.push(`accountType=${type}`);
      if (isActive) params.push(`isActive=${isActive}`);
      if (params.length > 0) url += '?' + params.join('&');

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      const result = await response.json();
      if (result.success) {
        setAccounts(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.accountNumber || !formData.accountName) {
      setError('Account number and name are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Account created successfully');
        setFormData({
          accountNumber: '',
          accountName: '',
          accountType: 'Asset',
          subType: '',
          normalBalance: 'Debit',
          description: ''
        });
        fetchAccounts(filters.type, filters.isActive);
        setActiveTab('list');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to create account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update account
  const handleUpdateAccount = async (accountNumber) => {
    const account = accounts.find(a => a.accountNumber === accountNumber);
    if (!account) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/accounting/accounts/${accountNumber}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authStore.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountName: account.accountName,
          subType: account.subType,
          isActive: account.isActive,
          description: account.description
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Account updated successfully');
        setEditingId(null);
        fetchAccounts(filters.type, filters.isActive);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update account');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = async (type, isActive) => {
    setFilters({ type, isActive });
    await fetchAccounts(type, isActive);
  };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.accountType]) {
      acc[account.accountType] = [];
    }
    acc[account.accountType].push(account);
    return acc;
  }, {});

  // Calculate totals by type
  const calculateTypeTotal = (type) => {
    return accounts
      .filter(a => a.accountType === type)
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);
  };

  return (
    <div className="accounting-container">
      <h2>Chart of Accounts</h2>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          View Accounts
        </button>
        <button
          className={`tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          Add Account
        </button>
      </div>

      {/* Accounts List */}
      {activeTab === 'list' && (
        <div>
          <div className="filter-section">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange(e.target.value, filters.isActive)}
            >
              <option value="">All Account Types</option>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange(filters.type, e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {accounts.length > 0 ? (
            <div className="accordion">
              {Object.keys(groupedAccounts).sort().map(type => (
                <div key={type} className="accordion-item">
                  <div className="accordion-header">
                    <h3>{type}</h3>
                    <span className="total">${calculateTypeTotal(type).toFixed(2)}</span>
                  </div>
                  <div className="accordion-body">
                    <table className="coa-table">
                      <thead>
                        <tr>
                          <th>Account #</th>
                          <th>Account Name</th>
                          <th>Sub Type</th>
                          <th>Balance</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedAccounts[type].map(account => (
                          <tr key={account.id} className={!account.isActive ? 'inactive' : ''}>
                            <td className="account-number">{account.accountNumber}</td>
                            <td>{account.accountName}</td>
                            <td>{account.subType || '-'}</td>
                            <td className="amount">${parseFloat(account.balance).toFixed(2)}</td>
                            <td>
                              <span className={`status-badge status-${account.isActive ? 'active' : 'inactive'}`}>
                                {account.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              {editingId === account.id ? (
                                <button
                                  className="btn-save"
                                  onClick={() => handleUpdateAccount(account.accountNumber)}
                                  disabled={loading}
                                >
                                  Save
                                </button>
                              ) : (
                                <button
                                  className="btn-edit"
                                  onClick={() => setEditingId(account.id)}
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No accounts found.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Account Form */}
      {activeTab === 'new' && (
        <form onSubmit={handleCreateAccount} className="form-section">
          <div className="form-grid">
            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g., 1010"
                required
              />
            </div>

            <div className="form-group">
              <label>Account Name</label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="e.g., Cash - Checking"
                required
              />
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                required
              >
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Sub Type</label>
              <input
                type="text"
                value={formData.subType}
                onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                placeholder="e.g., Current Asset"
              />
            </div>

            <div className="form-group">
              <label>Normal Balance</label>
              <select
                value={formData.normalBalance}
                onChange={(e) => setFormData({ ...formData, normalBalance: e.target.value })}
                required
              >
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Account description"
                rows="2"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ChartOfAccounts;
