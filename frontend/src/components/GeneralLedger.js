import React, { useState, useEffect } from 'react';
import styles from '../styles/accountingStyles.css';

/**
 * General Ledger Component
 * View GL entries for specific accounts
 */
const GeneralLedger = ({ authStore }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch chart of accounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounting/accounts', {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      const result = await response.json();
      if (result.success) {
        setAccounts(result.data);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  // Fetch GL entries for selected account
  const fetchGeneralLedger = async () => {
    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let url = `/api/accounting/general-ledger/${selectedAccount}`;
      if (dateRange.startDate) url += `?startDate=${dateRange.startDate}`;
      if (dateRange.endDate) url += `${dateRange.startDate ? '&' : '?'}endDate=${dateRange.endDate}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      const result = await response.json();
      if (result.success) {
        setLedgerEntries(result.entries || []);
        setPage(1);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch GL entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get paginated entries
  const paginatedEntries = ledgerEntries.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Calculate account balance
  const currentAccount = accounts.find(a => a.accountNumber === selectedAccount);

  return (
    <div className="accounting-container">
      <h2>General Ledger</h2>

      {/* Filters */}
      <div className="filter-section">
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
        >
          <option value="">Select Account...</option>
          {accounts.map(account => (
            <option key={account.id} value={account.accountNumber}>
              {account.accountNumber} - {account.accountName}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          placeholder="End Date"
        />

        <button onClick={fetchGeneralLedger} disabled={loading}>
          {loading ? 'Loading...' : 'View Ledger'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Account Info */}
      {selectedAccount && currentAccount && (
        <div className="account-info">
          <h3>{currentAccount.accountNumber} - {currentAccount.accountName}</h3>
          <p><strong>Type:</strong> {currentAccount.accountType}</p>
          <p><strong>Balance:</strong> ${parseFloat(currentAccount.balance).toFixed(2)}</p>
        </div>
      )}

      {/* GL Entries Table */}
      {ledgerEntries.length > 0 && (
        <div className="table-container">
          <table className="gl-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Entry #</th>
                <th>Description</th>
                <th>Reference</th>
                <th className="amount">Debit</th>
                <th className="amount">Credit</th>
                <th className="amount">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.map((entry, idx) => (
                <tr key={idx}>
                  <td>{new Date(entry.entryDate).toLocaleDateString()}</td>
                  <td>{entry.JournalEntry?.entryNumber || '-'}</td>
                  <td>{entry.description}</td>
                  <td>{entry.reference || '-'}</td>
                  <td className="amount debit">
                    {entry.debitAmount > 0 ? `$${parseFloat(entry.debitAmount).toFixed(2)}` : '-'}
                  </td>
                  <td className="amount credit">
                    {entry.creditAmount > 0 ? `$${parseFloat(entry.creditAmount).toFixed(2)}` : '-'}
                  </td>
                  <td className="amount balance">
                    ${parseFloat(entry.runningBalance).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </button>

            <span>
              Page {page} of {Math.ceil(ledgerEntries.length / pageSize)}
            </span>

            <button
              onClick={() => setPage(Math.min(Math.ceil(ledgerEntries.length / pageSize), page + 1))}
              disabled={page >= Math.ceil(ledgerEntries.length / pageSize)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {ledgerEntries.length === 0 && selectedAccount && !loading && (
        <div className="empty-state">
          <p>No entries found for this account.</p>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
