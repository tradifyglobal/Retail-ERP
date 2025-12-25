/**
 * Billing Routes
 * REST API endpoints for billing and subscription management
 */

const express = require('express');
const router = express.Router();

module.exports = (billingController, webhookController, authMiddleware) => {
  /**
   * Public endpoints
   */

  // Webhook for Stripe events (public - no auth required)
  router.post('/webhooks/stripe', (req, res) => {
    webhookController.handleStripeWebhook(req, res);
  });

  /**
   * Authenticated endpoints
   */

  // Create payment intent
  router.post('/create-payment-intent', authMiddleware.authenticate, (req, res) => {
    billingController.createPaymentIntent(req, res);
  });

  // Create subscription
  router.post('/create-subscription', authMiddleware.authenticate, (req, res) => {
    billingController.createSubscription(req, res);
  });

  // Get current subscription
  router.get('/subscription', authMiddleware.authenticate, (req, res) => {
    billingController.getSubscription(req, res);
  });

  // Upgrade subscription
  router.post('/upgrade', authMiddleware.authenticate, (req, res) => {
    billingController.upgradeSubscription(req, res);
  });

  // Cancel subscription
  router.post('/cancel', authMiddleware.authenticate, (req, res) => {
    billingController.cancelSubscription(req, res);
  });

  // Get invoices/billing history
  router.get('/invoices', authMiddleware.authenticate, (req, res) => {
    billingController.getInvoices(req, res);
  });

  // Get specific invoice
  router.get('/invoices/:invoiceId', authMiddleware.authenticate, (req, res) => {
    billingController.getInvoice(req, res);
  });

  // Get payment methods
  router.get('/payment-methods', authMiddleware.authenticate, (req, res) => {
    billingController.getPaymentMethods(req, res);
  });

  // Add payment method
  router.post('/payment-methods', authMiddleware.authenticate, (req, res) => {
    billingController.addPaymentMethod(req, res);
  });

  // Remove payment method
  router.delete('/payment-methods/:paymentMethodId', authMiddleware.authenticate, (req, res) => {
    billingController.removePaymentMethod(req, res);
  });

  // Get billing dashboard
  router.get('/dashboard', authMiddleware.authenticate, (req, res) => {
    billingController.getBillingDashboard(req, res);
  });

  return router;
};
