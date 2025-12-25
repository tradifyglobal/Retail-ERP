const express = require('express');
const ShopifyWebhookController = require('../controllers/shopifyWebhookController');
const auth = require('../middleware/auth');

module.exports = (models) => {
  const router = express.Router();
  const webhookController = new ShopifyWebhookController(models);

  /**
   * Public Routes (no authentication required)
   */

  // Webhook receiver - must be accessible from Shopify
  // Shopify verifies signature before sending
  router.post('/webhooks/shopify', (req, res) => {
    webhookController.handleWebhook(req, res);
  });

  // OAuth callback - user installs app from Shopify App Store
  router.get('/oauth/callback', (req, res) => {
    webhookController.handleOAuthCallback(req, res);
  });

  // Check integration status (public, no auth)
  router.get('/integration/status', (req, res) => {
    webhookController.getIntegrationStatus(req, res);
  });

  /**
   * Authenticated Routes (require valid JWT)
   */

  // Get current customer's Shopify integration
  router.get('/integration', auth, (req, res) => {
    webhookController.getShopIntegration(req, res);
  });

  // Disconnect Shopify integration
  router.post('/integration/disconnect', auth, (req, res) => {
    webhookController.disconnectIntegration(req, res);
  });

  return router;
};
