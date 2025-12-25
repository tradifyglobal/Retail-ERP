import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../styles/accountingStyles.css';

/**
 * Financial Statements Component
 * Display P&L, Balance Sheet, Cash Flow statements
 */
const FinancialStatements = ({ authStore }) => {
  const [activeTab, setActiveTab] = useState('income-statement');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [asOfDate, setAsOfDate] = useState('');
  const [statements, setStatements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch financial statements
  const fetchStatement = async (type) => {
    setLoading(true);
    setError('');
    try {
      const endpoint =
        type === 'income-statement' ? `/api/accounting/income-statement?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` :
        type === 'balance-sheet' ? `/api/accounting/balance-sheet?asOfDate=${asOfDate}` :
        `/api/accounting/cash-flow?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${authStore.token}` }
      });

      const result = await response.json();
      if (result.success) {
        setStatements(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch statement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Income Statement (P&L)
  const renderIncomeStatement = () => {
    if (!statements) return null;

    return (
      <div className="statement-container">
        <h3>Income Statement (P&L)</h3>
        <p className="statement-period">
          For Period: {dateRange.startDate} to {dateRange.endDate}
        </p>

        <div className="statement-section">
          <h4>Revenue</h4>
          <table className="statement-table">
            <tbody>
              {statements.revenues?.map((item, idx) => (
                <tr key={idx} className="indent-1">
                  <td>{item.accountName}</td>
                  <td className="amount">${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>Total Revenue</strong></td>
                <td className="amount"><strong>${statements.totalRevenue?.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="statement-section">
          <h4>Expenses</h4>
          <table className="statement-table">
            <tbody>
              {statements.expenses?.map((item, idx) => (
                <tr key={idx} className="indent-1">
                  <td>{item.accountName}</td>
                  <td className="amount">${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>Total Expenses</strong></td>
                <td className="amount"><strong>${statements.totalExpenses?.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="statement-section highlight">
          <table className="statement-table">
            <tbody>
              <tr className="net-income-row">
                <td><strong>Net Income</strong></td>
                <td className="amount"><strong>${statements.netIncome?.toFixed(2)}</strong></td>
              </tr>
              <tr className="profit-margin-row">
                <td><strong>Profit Margin</strong></td>
                <td className="amount"><strong>{statements.profitMargin?.toFixed(2)}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Balance Sheet
  const renderBalanceSheet = () => {
    if (!statements) return null;

    return (
      <div className="statement-container">
        <h3>Balance Sheet</h3>
        <p className="statement-period">As of: {asOfDate}</p>

        <div className="bs-two-column">
          <div className="bs-column">
            <div className="statement-section">
              <h4>Assets</h4>
              <table className="statement-table">
                <tbody>
                  {statements.assets?.map((item, idx) => (
                    <tr key={idx} className="indent-1">
                      <td>{item.accountName}</td>
                      <td className="amount">${parseFloat(item.balance).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>Total Assets</strong></td>
                    <td className="amount"><strong>${statements.totalAssets?.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bs-column">
            <div className="statement-section">
              <h4>Liabilities & Equity</h4>

              <div className="statement-subsection">
                <h5>Liabilities</h5>
                <table className="statement-table">
                  <tbody>
                    {statements.liabilities?.map((item, idx) => (
                      <tr key={idx} className="indent-1">
                        <td>{item.accountName}</td>
                        <td className="amount">${parseFloat(item.balance).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="subtotal-row">
                      <td><strong>Total Liabilities</strong></td>
                      <td className="amount"><strong>${statements.totalLiabilities?.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="statement-subsection">
                <h5>Equity</h5>
                <table className="statement-table">
                  <tbody>
                    {statements.equity?.map((item, idx) => (
                      <tr key={idx} className="indent-1">
                        <td>{item.accountName}</td>
                        <td className="amount">${parseFloat(item.balance).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="subtotal-row">
                      <td><strong>Total Equity</strong></td>
                      <td className="amount"><strong>${statements.totalEquity?.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="statement-section highlight">
                <table className="statement-table">
                  <tbody>
                    <tr className="total-row">
                      <td><strong>Total Liabilities & Equity</strong></td>
                      <td className="amount"><strong>${(statements.totalLiabilities + statements.totalEquity)?.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Verification */}
        <div className="balance-check">
          <p>
            Assets = Liabilities + Equity:
            <span className={statements.totalAssets === (statements.totalLiabilities + statements.totalEquity) ? 'balanced' : 'unbalanced'}>
              ${statements.totalAssets?.toFixed(2)} = ${(statements.totalLiabilities + statements.totalEquity)?.toFixed(2)}
            </span>
          </p>
        </div>
      </div>
    );
  };

  // Cash Flow Statement
  const renderCashFlowStatement = () => {
    if (!statements) return null;

    const sections = [
      { name: 'Operating Activities', data: statements.operatingActivities },
      { name: 'Investing Activities', data: statements.investingActivities },
      { name: 'Financing Activities', data: statements.financingActivities }
    ];

    return (
      <div className="statement-container">
        <h3>Cash Flow Statement</h3>
        <p className="statement-period">
          For Period: {dateRange.startDate} to {dateRange.endDate}
        </p>

        {sections.map((section, idx) => (
          <div key={idx} className="statement-section">
            <h4>{section.name}</h4>
            <table className="statement-table">
              <tbody>
                {section.data?.map((item, itemIdx) => (
                  <tr key={itemIdx} className="indent-1">
                    <td>{item.description}</td>
                    <td className="amount">${parseFloat(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="subtotal-row">
                  <td><strong>Net {section.name}</strong></td>
                  <td className="amount"><strong>${section.data?.reduce((sum, item) => sum + item.amount, 0)?.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        <div className="statement-section highlight">
          <table className="statement-table">
            <tbody>
              <tr className="total-row">
                <td><strong>Net Change in Cash</strong></td>
                <td className="amount"><strong>${statements.netChangeInCash?.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="accounting-container">
      <h2>Financial Statements</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'income-statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('income-statement')}
        >
          Income Statement (P&L)
        </button>
        <button
          className={`tab ${activeTab === 'balance-sheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('balance-sheet')}
        >
          Balance Sheet
        </button>
        <button
          className={`tab ${activeTab === 'cash-flow' ? 'active' : ''}`}
          onClick={() => setActiveTab('cash-flow')}
        >
          Cash Flow
        </button>
      </div>

      {/* Date Inputs */}
      <div className="filter-section">
        {activeTab !== 'balance-sheet' ? (
          <>
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
          </>
        ) : (
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            placeholder="As Of Date"
          />
        )}

        <button onClick={() => fetchStatement(activeTab)} disabled={loading}>
          {loading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statements */}
      {activeTab === 'income-statement' && renderIncomeStatement()}
      {activeTab === 'balance-sheet' && renderBalanceSheet()}
      {activeTab === 'cash-flow' && renderCashFlowStatement()}
    </div>
  );
};

export default FinancialStatements;
