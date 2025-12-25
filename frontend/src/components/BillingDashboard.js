import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import SubscriptionManager from './SubscriptionManager';
import InvoiceViewer from './InvoiceViewer';
import PaymentMethodManager from './PaymentMethodManager';
import UsageAnalytics from './UsageAnalytics';
import '../styles/billingStyles.css';

/**
 * BillingDashboard Component
 * Main hub for managing subscription, billing, and usage
 * Displays subscription status, invoices, payment methods, and usage analytics
 */
const BillingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/billing/dashboard');
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="billing-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-container">
        <div className="error-banner">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboard} className="btn-secondary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-container">
      {/* Header */}
      <div className="billing-header">
        <h1>Billing & Subscription</h1>
        <p>Manage your subscription, invoices, and payment methods</p>
      </div>

      {/* Navigation Tabs */}
      <div className="billing-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          🔄 Subscription
        </button>
        <button
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          📄 Invoices
        </button>
        <button
          className={`tab ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          💳 Payment Methods
        </button>
        <button
          className={`tab ${activeTab === 'usage' ? 'active' : ''}`}
          onClick={() => setActiveTab('usage')}
        >
          📈 Usage
        </button>
      </div>

      {/* Tab Content */}
      <div className="billing-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <OverviewPanel dashboard={dashboard} onRefresh={fetchDashboard} />
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="tab-panel">
            <SubscriptionManager
              currentPlan={dashboard?.subscription}
              onUpdate={fetchDashboard}
            />
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="tab-panel">
            <InvoiceViewer />
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment' && (
          <div className="tab-panel">
            <PaymentMethodManager onUpdate={fetchDashboard} />
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="tab-panel">
            <UsageAnalytics usage={dashboard?.usage} />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Overview Panel
 * Shows current subscription status, next billing date, total paid, etc.
 */
const OverviewPanel = ({ dashboard, onRefresh }) => {
  const subscription = dashboard?.subscription;
  const stats = dashboard?.stats;

  if (!subscription || !stats) {
    return <div className="empty-state">No subscription data available</div>;
  }

  const isActive = subscription.status === 'active';
  const statusColor = isActive ? 'success' : 'warning';

  return (
    <div className="overview-panel">
      {/* Status Cards */}
      <div className="stats-grid">
        {/* Current Plan Card */}
        <div className="stat-card primary">
          <h3>Current Plan</h3>
          <p className="plan-name">{subscription.planTier?.toUpperCase()}</p>
          <div className="plan-price">
            ${subscription.monthlyPrice}
            <span className="period">
              {subscription.billingCycle === 'monthly' ? '/month' : '/year'}
            </span>
          </div>
          <p className={`status status-${statusColor}`}>
            {subscription.status === 'active' ? '✓ Active' : '⚠ ' + subscription.status}
          </p>
        </div>

        {/* Next Billing Card */}
        <div className="stat-card">
          <h3>Next Billing</h3>
          <p className="next-date">
            {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="amount">
            ${subscription.monthlyPrice}
            {subscription.billingCycle === 'annual' && (
              <span className="save-badge">Save 17%</span>
            )}
          </p>
        </div>

        {/* Total Paid Card */}
        <div className="stat-card">
          <h3>Total Paid</h3>
          <p className="total-amount">${stats.totalPaid || 0}</p>
          <p className="stat-subtext">
            {stats.totalInvoices || 0} invoices
          </p>
        </div>

        {/* Users Card */}
        <div className="stat-card">
          <h3>Seats Used</h3>
          <p className="users-count">
            {stats.usersCount || 0} / {subscription.maxUsers}
          </p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((stats.usersCount || 0) / subscription.maxUsers) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Preview */}
      <div className="recent-section">
        <h2>Recent Invoices</h2>
        {stats.recentInvoices && stats.recentInvoices.length > 0 ? (
          <div className="invoices-preview">
            {stats.recentInvoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="invoice-item">
                <div className="invoice-info">
                  <p className="invoice-id">Invoice #{invoice.number}</p>
                  <p className="invoice-date">
                    {new Date(invoice.createdAt).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div className="invoice-amount">
                  <p className="amount">${invoice.total}</p>
                  <span className={`badge status-${invoice.status}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No invoices yet</p>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="features-section">
        <h2>Your Features</h2>
        <div className="features-grid">
          {subscription.features && subscription.features.length > 0 ? (
            subscription.features.map((feature) => (
              <div key={feature} className="feature-badge">
                ✓ {formatFeatureName(feature)}
              </div>
            ))
          ) : (
            <p className="empty-state">No features included in this plan</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={onRefresh} className="btn-secondary">
          🔄 Refresh
        </button>
        <button className="btn-primary">
          💬 Contact Support
        </button>
      </div>
    </div>
  );
};

/**
 * Helper function to format feature names
 */
const formatFeatureName = (feature) => {
  const featureNames = {
    pos: 'Point of Sale',
    inventory: 'Inventory Management',
    orders: 'Order Management',
    reports: 'Reports & Analytics',
    branding: 'Custom Branding',
    users: 'Multi-User Access',
    api: 'API Access',
    webhooks: 'Webhooks',
    all: 'All Features'
  };
  return featureNames[feature] || feature;
};

export default BillingDashboard;
