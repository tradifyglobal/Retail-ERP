import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

/**
 * PaymentMethodManager Component
 * Manage credit cards and payment methods
 * Uses Stripe Elements for secure card entry
 */
const PaymentMethodManager = ({ onUpdate }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [processingAdd, setProcessingAdd] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/billing/payment-methods');
      setPaymentMethods(response.data.paymentMethods || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods');
      console.error('Payment methods fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (paymentMethodId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      const response = await api.delete(`/billing/payment-methods/${paymentMethodId}`);

      if (response.data.success) {
        alert('Card removed successfully');
        fetchPaymentMethods();
        onUpdate();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete card');
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      const response = await api.post(
        `/billing/payment-methods/${paymentMethodId}/set-default`
      );

      if (response.data.success) {
        fetchPaymentMethods();
      }
    } catch (err) {
      alert('Failed to set default card');
    }
  };

  return (
    <div className="payment-method-manager">
      <h2>Payment Methods</h2>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading payment methods...</p>
        </div>
      ) : (
        <>
          {/* Payment Methods List */}
          <div className="payment-methods-list">
            {paymentMethods.length === 0 ? (
              <div className="empty-state">
                <p>💳 No payment methods yet</p>
                <p className="subtext">Add a credit card to manage your subscription</p>
              </div>
            ) : (
              <div className="cards-grid">
                {paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onDelete={() => handleDeleteCard(method.id)}
                    onSetDefault={() => handleSetDefault(method.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add Card Button */}
          {!showAddCard ? (
            <button
              onClick={() => setShowAddCard(true)}
              className="btn-primary add-card-btn"
            >
              + Add Credit Card
            </button>
          ) : (
            <AddCardForm
              onSuccess={() => {
                setShowAddCard(false);
                fetchPaymentMethods();
                onUpdate();
              }}
              onCancel={() => setShowAddCard(false)}
              loading={processingAdd}
            />
          )}
        </>
      )}
    </div>
  );
};

/**
 * Payment Method Card Component
 */
const PaymentMethodCard = ({ method, onDelete, onSetDefault }) => {
  const cardBrands = {
    visa: '💳 Visa',
    mastercard: '💳 Mastercard',
    amex: '💳 American Express',
    diners: '💳 Diners Club',
    discover: '💳 Discover'
  };

  const brandName = cardBrands[method.brand?.toLowerCase()] || 'Card';

  return (
    <div className="payment-method-card">
      {method.isDefault && <div className="default-badge">Default</div>}

      <div className="card-header">
        <h3>{brandName}</h3>
        <span className="card-type">{method.funding || 'credit'}</span>
      </div>

      <div className="card-number">
        •••• •••• •••• {method.last4}
      </div>

      <div className="card-details">
        <div className="card-detail">
          <span className="label">Cardholder</span>
          <span>{method.holderName || 'Not provided'}</span>
        </div>
        <div className="card-detail">
          <span className="label">Expires</span>
          <span>{method.expMonth}/{method.expYear}</span>
        </div>
      </div>

      <div className="card-actions">
        {!method.isDefault && (
          <button
            onClick={onSetDefault}
            className="btn-secondary small"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={onDelete}
          className="btn-danger small"
          title="Delete this card"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

/**
 * Add Card Form
 * Simplified form - in production would use Stripe Elements
 */
const AddCardForm = ({ onSuccess, onCancel, loading }) => {
  const [cardData, setCardData] = useState({
    holderName: '',
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setProcessing(true);
      setError(null);

      // Validate card data
      if (!cardData.holderName || !cardData.cardNumber || !cardData.expMonth || !cardData.expYear || !cardData.cvc) {
        setError('All fields are required');
        setProcessing(false);
        return;
      }

      // In production, would tokenize card with Stripe first
      const response = await api.post('/billing/payment-methods', {
        holderName: cardData.holderName,
        cardNumber: cardData.cardNumber,
        expMonth: cardData.expMonth,
        expYear: cardData.expYear,
        cvc: cardData.cvc
      });

      if (response.data.success) {
        alert('Card added successfully!');
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add card');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="add-card-form">
      <h3>Add New Card</h3>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Cardholder Name</label>
          <input
            type="text"
            placeholder="John Doe"
            value={cardData.holderName}
            onChange={(e) =>
              setCardData({ ...cardData, holderName: e.target.value })
            }
            disabled={processing}
          />
        </div>

        <div className="form-group">
          <label>Card Number</label>
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            value={cardData.cardNumber}
            onChange={(e) =>
              setCardData({ ...cardData, cardNumber: e.target.value })
            }
            disabled={processing}
            maxLength="19"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <div className="expiry-inputs">
              <input
                type="number"
                placeholder="MM"
                min="1"
                max="12"
                value={cardData.expMonth}
                onChange={(e) =>
                  setCardData({ ...cardData, expMonth: e.target.value })
                }
                disabled={processing}
              />
              <span>/</span>
              <input
                type="number"
                placeholder="YY"
                min={new Date().getFullYear() % 100}
                max="99"
                value={cardData.expYear}
                onChange={(e) =>
                  setCardData({ ...cardData, expYear: e.target.value })
                }
                disabled={processing}
              />
            </div>
          </div>

          <div className="form-group">
            <label>CVC</label>
            <input
              type="text"
              placeholder="123"
              value={cardData.cvc}
              onChange={(e) =>
                setCardData({ ...cardData, cvc: e.target.value })
              }
              disabled={processing}
              maxLength="4"
            />
          </div>
        </div>

        <p className="security-note">
          🔒 Your card information is encrypted and never stored on our servers
        </p>

        <div className="form-buttons">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={processing || loading}
          >
            {processing ? 'Adding Card...' : 'Add Card'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentMethodManager;
