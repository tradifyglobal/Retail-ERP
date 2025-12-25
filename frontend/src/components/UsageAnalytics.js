import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * UsageAnalytics Component
 * Display feature usage, user count, API calls, and storage
 * Shows visualizations and trends
 */
const UsageAnalytics = ({ usage }) => {
  const [chartType, setChartType] = useState('usage');

  if (!usage) {
    return (
      <div className="usage-analytics">
        <h2>Usage Analytics</h2>
        <div className="empty-state">
          <p>📊 No usage data available yet</p>
          <p className="subtext">Your usage statistics will appear here as you use the platform</p>
        </div>
      </div>
    );
  }

  return (
    <div className="usage-analytics">
      <h2>Usage Analytics</h2>

      {/* Key Metrics */}
      <div className="usage-metrics-grid">
        <MetricCard
          title="Active Users"
          value={usage.usersCount || 0}
          unit={`/ ${usage.maxUsers || 'Unlimited'}`}
          icon="👥"
          percentage={usage.maxUsers ? ((usage.usersCount || 0) / usage.maxUsers) * 100 : 0}
        />

        <MetricCard
          title="API Calls"
          value={(usage.apiCalls || 0).toLocaleString()}
          unit={`/ ${(usage.maxApiCalls || 0).toLocaleString()}`}
          icon="⚙️"
          percentage={usage.maxApiCalls ? ((usage.apiCalls || 0) / usage.maxApiCalls) * 100 : 0}
        />

        <MetricCard
          title="Storage Used"
          value={formatBytes(usage.storageUsed || 0)}
          unit={`/ ${formatBytes(usage.maxStorage || 1000000000)}`}
          icon="💾"
          percentage={usage.maxStorage ? ((usage.storageUsed || 0) / usage.maxStorage) * 100 : 0}
        />

        <MetricCard
          title="Data Exported"
          value={(usage.exportsCount || 0).toLocaleString()}
          unit="exports this month"
          icon="📤"
        />
      </div>

      {/* Charts */}
      <div className="usage-charts">
        {/* Chart Type Selector */}
        <div className="chart-selector">
          <button
            className={`chart-btn ${chartType === 'usage' ? 'active' : ''}`}
            onClick={() => setChartType('usage')}
          >
            Usage Trend
          </button>
          <button
            className={`chart-btn ${chartType === 'api' ? 'active' : ''}`}
            onClick={() => setChartType('api')}
          >
            API Calls
          </button>
          <button
            className={`chart-btn ${chartType === 'features' ? 'active' : ''}`}
            onClick={() => setChartType('features')}
          >
            Feature Usage
          </button>
        </div>

        {/* Usage Trend Chart */}
        {chartType === 'usage' && (
          <div className="chart-container">
            <h3>Daily Usage Trend (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usage.dailyUsage || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  name="Active Users"
                />
                <Line
                  type="monotone"
                  dataKey="apiCalls"
                  stroke="#82ca9d"
                  name="API Calls"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* API Calls Chart */}
        {chartType === 'api' && (
          <div className="chart-container">
            <h3>API Calls by Endpoint (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usage.apiCallsByEndpoint || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="endpoint" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calls" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Feature Usage Chart */}
        {chartType === 'features' && (
          <div className="chart-container">
            <h3>Feature Usage</h3>
            <div className="features-usage-list">
              {usage.featureUsage && usage.featureUsage.length > 0 ? (
                usage.featureUsage.map((feature) => (
                  <div key={feature.name} className="feature-usage-item">
                    <div className="feature-info">
                      <span className="feature-name">{feature.name}</span>
                      <span className="feature-percentage">
                        {feature.percentage}% used
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${feature.percentage}%` }}
                      ></div>
                    </div>
                    <span className="feature-count">
                      {feature.count} {feature.unit}
                    </span>
                  </div>
                ))
              ) : (
                <p>No feature usage data</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Usage Details */}
      <div className="usage-details">
        <h3>Usage Breakdown</h3>

        <div className="details-grid">
          {/* POS System */}
          <div className="detail-section">
            <h4>📊 POS System</h4>
            <ul>
              <li>
                <span>Transactions:</span>
                <strong>{(usage.posTransactions || 0).toLocaleString()}</strong>
              </li>
              <li>
                <span>Total Sales:</span>
                <strong>${(usage.posSalesAmount || 0).toFixed(2)}</strong>
              </li>
              <li>
                <span>Avg. Daily Transactions:</span>
                <strong>{(usage.posAvgDaily || 0).toLocaleString()}</strong>
              </li>
            </ul>
          </div>

          {/* Inventory */}
          <div className="detail-section">
            <h4>📦 Inventory</h4>
            <ul>
              <li>
                <span>Products:</span>
                <strong>{(usage.productCount || 0).toLocaleString()}</strong>
              </li>
              <li>
                <span>SKUs:</span>
                <strong>{(usage.skuCount || 0).toLocaleString()}</strong>
              </li>
              <li>
                <span>Stock Movements:</span>
                <strong>{(usage.stockMovements || 0).toLocaleString()}</strong>
              </li>
            </ul>
          </div>

          {/* Orders */}
          <div className="detail-section">
            <h4>📦 Orders</h4>
            <ul>
              <li>
                <span>Total Orders:</span>
                <strong>{(usage.totalOrders || 0).toLocaleString()}</strong>
              </li>
              <li>
                <span>Pending Fulfillment:</span>
                <strong>{(usage.pendingOrders || 0).toLocaleString()}</strong>
              </li>
              <li>
                <span>Avg Order Value:</span>
                <strong>${(usage.avgOrderValue || 0).toFixed(2)}</strong>
              </li>
            </ul>
          </div>

          {/* Users & Access */}
          <div className="detail-section">
            <h4>👥 Users & Access</h4>
            <ul>
              <li>
                <span>Active Users:</span>
                <strong>{(usage.usersCount || 0)}</strong>
              </li>
              <li>
                <span>Login Attempts:</span>
                <strong>{(usage.loginAttempts || 0).toLocaleString()}</strong>
              </li>
              <li>
                <span>Failed Logins:</span>
                <strong>{(usage.failedLogins || 0).toLocaleString()}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reset Usage Stats */}
      <div className="usage-footer">
        <p className="info-text">
          💡 Usage data is calculated based on your account activity and updated daily.
        </p>
        <p className="info-text">
          📅 Billing cycle resets on {usage.billingResetDate ? new Date(usage.billingResetDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
          }) : 'your billing date'}.
        </p>
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard = ({ title, value, unit, icon, percentage }) => {
  const getColorClass = (pct) => {
    if (pct >= 90) return 'critical';
    if (pct >= 75) return 'warning';
    return 'normal';
  };

  return (
    <div className={`metric-card ${percentage ? getColorClass(percentage) : ''}`}>
      <div className="metric-header">
        <h3>{icon} {title}</h3>
      </div>

      <div className="metric-value">
        <span className="value">{value}</span>
        {unit && <span className="unit">{unit}</span>}
      </div>

      {percentage !== undefined && (
        <div className="metric-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
          <span className="percentage">{percentage.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};

/**
 * Helper function to format bytes to human readable
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default UsageAnalytics;
