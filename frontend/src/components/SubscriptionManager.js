import React, { useState } from 'react';
import { api } from '../services/api';

/**
 * SubscriptionManager Component
 * Handle plan upgrades, downgrades, and cancellations
 * Shows pricing comparison and prorating info
 */
const SubscriptionManager = ({ currentPlan, onUpdate }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [prorationInfo, setProrationInfo] = useState(null);

  const plans = [
    {
      id: 'freemium',
      name: 'Freemium',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      annualPrice: 0,
      maxUsers: 1,
      features: ['pos', 'basic_inventory'],
      color: '#f0f0f0'
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For small businesses',
      monthlyPrice: 99,
      annualPrice: 999,
      maxUsers: 5,
      features: ['pos', 'inventory', 'orders', 'basic_reports'],
      color: '#e3f2fd'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For growing businesses',
      monthlyPrice: 299,
      annualPrice: 2999,
      maxUsers: 25,
      features: ['pos', 'inventory', 'orders', 'reports', 'branding', 'users'],
      color: '#f3e5f5',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      monthlyPrice: 599,
      annualPrice: 5999,
      maxUsers: 999,
      features: ['all'],
      color: '#fff3e0'
    }
  ];

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    setError(null);

    // Calculate proration if upgrading/downgrading
    if (currentPlan && plan.id !== currentPlan.planTier) {
      try {
        const response = await api.post('/billing/calculate-proration', {
          currentPlan: currentPlan.planTier,
          newPlan: plan.id,
          billingCycle: selectedCycle
        });
        setProrationInfo(response.data);
      } catch (err) {
        console.error('Proration calc error:', err);
      }
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/billing/upgrade', {
        newPlan: selectedPlan.id,
        billingCycle: selectedCycle
      });

      if (response.data.success) {
        alert('Subscription updated successfully!');
        setSelectedPlan(null);
        onUpdate();
      } else {
        setError(response.data.message || 'Failed to upgrade');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upgrade failed');
      console.error('Upgrade error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/billing/cancel');

      if (response.data.success) {
        alert('Subscription cancelled. You can reactivate anytime.');
        setShowCancelModal(false);
        onUpdate();
      } else {
        setError(response.data.message || 'Failed to cancel');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-manager">
      <h2>Manage Your Subscription</h2>

      {error && <div className="error-banner">{error}</div>}

      {/* Current Plan Display */}
      {currentPlan && (
        <div className="current-plan-banner">
          <div className="plan-info">
            <h3>Current Plan: {currentPlan.planTier?.toUpperCase()}</h3>
            <p>
              ${currentPlan.monthlyPrice}/
              {currentPlan.billingCycle === 'monthly' ? 'month' : 'year'}
            </p>
          </div>
          <button
            onClick={() => setShowCancelModal(true)}
            className="btn-danger"
            disabled={loading || currentPlan.planTier === 'freemium'}
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Billing Cycle Selector */}
      <div className="billing-cycle-selector">
        <h3>Billing Cycle</h3>
        <div className="cycle-buttons">
          <button
            className={`cycle-btn ${selectedCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setSelectedCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={`cycle-btn ${selectedCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setSelectedCycle('annual')}
          >
            Annual
            <span className="save-badge">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="plans-grid">
        {plans.map((plan) => {
          const price =
            selectedCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
          const isCurrentPlan = currentPlan?.planTier === plan.id;
          const isSelected = selectedPlan?.id === plan.id;

          return (
            <div
              key={plan.id}
              className={`plan-card ${isSelected ? 'selected' : ''} ${
                isCurrentPlan ? 'current' : ''
              } ${plan.popular ? 'popular' : ''}`}
              style={{ borderColor: plan.color }}
              onClick={() => handlePlanSelect(plan)}
            >
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              {isCurrentPlan && <div className="current-badge">Current Plan</div>}

              <h3>{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>

              <div className="plan-price">
                {price === 0 ? (
                  <span className="free">FREE</span>
                ) : (
                  <>
                    <span className="price">${price}</span>
                    <span className="period">
                      {selectedCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                  </>
                )}
              </div>

              <div className="plan-users">
                <strong>{plan.maxUsers === 999 ? 'Unlimited' : plan.maxUsers}</strong>
                <span> {plan.maxUsers === 1 ? 'user' : 'users'}</span>
              </div>

              <div className="plan-features">
                <h4>Features:</h4>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      ✓ {formatFeatureName(feature)}
                    </li>
                  ))}
                </ul>
              </div>

              {!isCurrentPlan && (
                <button
                  className={`btn-plan ${isSelected ? 'selected' : ''}`}
                  disabled={loading}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Proration Info */}
      {selectedPlan && prorationInfo && (
        <div className="proration-info">
          <h4>Proration Calculation</h4>
          <div className="proration-details">
            <p>
              <strong>Current plan credit:</strong> ${prorationInfo.currentCredit}
            </p>
            <p>
              <strong>New plan charge:</strong> ${prorationInfo.newCharge}
            </p>
            <p className="total">
              <strong>Amount due:</strong>{' '}
              {prorationInfo.amountDue > 0 ? (
                <span className="charge">${prorationInfo.amountDue}</span>
              ) : (
                <span className="credit">-${Math.abs(prorationInfo.amountDue)} credit</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {selectedPlan && !currentPlan?.planTier === selectedPlan.id && (
        <div className="action-buttons">
          <button
            onClick={() => setSelectedPlan(null)}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upgrade Plan'}
          </button>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <CancelModal
          onConfirm={handleCancel}
          onCancel={() => setShowCancelModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

/**
 * Cancel Subscription Modal
 */
const CancelModal = ({ onConfirm, onCancel, loading }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cancel Subscription</h2>
        <p>
          Are you sure you want to cancel your subscription? You will lose access
          to premium features immediately.
        </p>
        <div className="warning-box">
          <p>
            ⚠️ Your data will be preserved, and you can reactivate your subscription
            at any time.
          </p>
        </div>
        <div className="modal-buttons">
          <button onClick={onCancel} className="btn-secondary" disabled={loading}>
            Keep Subscription
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger"
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
};

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

export default SubscriptionManager;
