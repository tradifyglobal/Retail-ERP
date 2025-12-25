const ShopifyService = require('../services/shopifyService');

/**
 * Shopify Webhook Controller
 * Handles incoming Shopify events (orders, customers, app uninstall)
 * Verifies webhook signatures and triggers license synchronization
 */
class ShopifyWebhookController {
  constructor(models) {
    this.models = models;
    this.shopifyService = new ShopifyService(models);
  }

  /**
   * Main webhook handler
   * Routes to specific handlers based on event topic
   */
  async handleWebhook(req, res) {
    try {
      // Verify Shopify signature
      const { topic, shop } = this.shopifyService.verifyWebhookSignature(req);

      console.log(`[Shopify Webhook] Topic: ${topic}, Shop: ${shop}`);

      // Route to appropriate handler
      switch (topic) {
        case 'orders/created':
          return await this._handleOrderCreated(req.body, shop, res);

        case 'orders/fulfilled':
          return await this._handleOrderFulfilled(req.body, shop, res);

        case 'customers/create':
          return await this._handleCustomerCreated(req.body, shop, res);

        case 'app/uninstalled':
          return await this._handleAppUninstalled(shop, res);

        default:
          console.warn(`[Shopify Webhook] Unhandled topic: ${topic}`);
          return res.status(200).json({ received: true, message: 'Event received but not processed' });
      }
    } catch (error) {
      console.error('[Shopify Webhook Error]', error.message);
      return res.status(401).json({ error: 'Webhook verification failed' });
    }
  }

  /**
   * Handle orders/created event
   * Create licenses when order is placed
   */
  async _handleOrderCreated(order, shop, res) {
    try {
      const result = await this.shopifyService.processOrder(shop, order);

      // Send email notification to customer if licenses created
      if (result.licensesCreated > 0) {
        await this._sendLicenseEmail(result);
      }

      console.log(`[Order Created] Shop: ${shop}, Order: ${order.id}, Licenses: ${result.licensesCreated}`);

      return res.status(200).json({
        success: true,
        message: 'Order processed',
        customerId: result.customerId,
        licensesCreated: result.licensesCreated
      });
    } catch (error) {
      console.error('[Order Created Handler Error]', error.message);
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * Handle orders/fulfilled event
   * Confirm license delivery when order is fulfilled
   */
  async _handleOrderFulfilled(order, shop, res) {
    try {
      // Update license status to confirmed if not already
      const licenses = await this.models.License.findAll({
        where: { shopifyOrderId: order.id }
      });

      for (const license of licenses) {
        if (license.status === 'active') {
          // Send confirmation email
          await this._sendFulfillmentEmail(license, order);
        }
      }

      console.log(`[Order Fulfilled] Shop: ${shop}, Order: ${order.id}, Licenses confirmed: ${licenses.length}`);

      return res.status(200).json({
        success: true,
        message: 'Order fulfillment confirmed',
        licensesConfirmed: licenses.length
      });
    } catch (error) {
      console.error('[Order Fulfilled Handler Error]', error.message);
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * Handle customers/create event
   * Sync new customer from Shopify
   */
  async _handleCustomerCreated(customer, shop, res) {
    try {
      const result = await this.shopifyService.syncCustomer(shop, customer);

      console.log(`[Customer Created] Shop: ${shop}, Customer: ${customer.id}, Local ID: ${result.customerId}`);

      return res.status(200).json({
        success: true,
        message: 'Customer synced',
        customerId: result.customerId,
        isNew: result.isNewCustomer
      });
    } catch (error) {
      console.error('[Customer Created Handler Error]', error.message);
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * Handle app/uninstalled event
   * Clean up when customer removes app from Shopify
   */
  async _handleAppUninstalled(shop, res) {
    try {
      const result = await this.shopifyService.handleAppUninstall(shop);

      console.log(`[App Uninstalled] Shop: ${shop}`);

      return res.status(200).json({
        success: true,
        message: 'App uninstalled and integration deactivated',
        shop: shop
      });
    } catch (error) {
      console.error('[App Uninstall Handler Error]', error.message);
      return res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * OAuth Callback Handler
   * User clicks "Install App" from Shopify App Store
   */
  async handleOAuthCallback(req, res) {
    try {
      const { shop, code, state } = req.query;

      if (!shop || !code) {
        return res.status(400).json({ error: 'Missing shop or code parameter' });
      }

      // Verify shop format
      if (!this._isValidShopDomain(shop)) {
        return res.status(400).json({ error: 'Invalid shop domain' });
      }

      // Exchange code for access token
      const result = await this.shopifyService.handleOAuthCallback(shop, code);

      if (!result.success) {
        return res.status(400).json({ error: result.message || 'OAuth failed' });
      }

      // Register webhooks
      const integration = await this.models.ShopifyIntegration.findOne({
        where: { shopUrl: shop }
      });

      await this.shopifyService.registerWebhooks(shop, integration.accessToken);

      // Fetch shop info for confirmation
      const shopInfo = await this.shopifyService.getShopInfo(shop, integration.accessToken);

      console.log(`[OAuth Success] Shop: ${shop}, Name: ${shopInfo.name}`);

      // Redirect to success page with embedded app
      return res.status(200).json({
        success: true,
        message: 'App installed and configured successfully',
        shop: {
          url: shop,
          name: shopInfo.name,
          plan: shopInfo.plan
        }
      });
    } catch (error) {
      console.error('[OAuth Callback Error]', error.message);
      return res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get integration status
   * Check if shop is integrated and active
   */
  async getIntegrationStatus(req, res) {
    try {
      const { shop } = req.query;

      if (!shop) {
        return res.status(400).json({ error: 'Missing shop parameter' });
      }

      const status = await this.shopifyService.getIntegrationStatus(shop);

      return res.status(200).json(status);
    } catch (error) {
      console.error('[Integration Status Error]', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get shop's current Shopify integration
   * Authenticated endpoint for customer to view their integration
   */
  async getShopIntegration(req, res) {
    try {
      const customerId = req.user.id;

      // Find integration for this customer's shop (if they have one)
      const customer = await this.models.Customer.findByPk(customerId);

      if (!customer || !customer.shopifyCustomerId) {
        return res.status(404).json({ error: 'No Shopify integration found' });
      }

      const integration = await this.models.ShopifyIntegration.findOne({
        where: { shopUrl: customer.shopifyCustomerId }
      });

      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      return res.status(200).json({
        shop: integration.shopUrl,
        isActive: integration.isActive,
        webhooksConfigured: integration.webhooksConfigured,
        installedAt: integration.createdAt,
        deactivatedAt: integration.deactivatedAt
      });
    } catch (error) {
      console.error('[Get Integration Error]', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Disconnect Shopify integration
   * Customer removes the integration
   */
  async disconnectIntegration(req, res) {
    try {
      const customerId = req.user.id;
      const customer = await this.models.Customer.findByPk(customerId);

      if (!customer || !customer.shopifyCustomerId) {
        return res.status(404).json({ error: 'No Shopify integration found' });
      }

      // Deactivate integration
      await this.models.ShopifyIntegration.update(
        { isActive: false },
        { where: { shopUrl: customer.shopifyCustomerId } }
      );

      // Clear Shopify reference from customer
      await customer.update({ shopifyCustomerId: null });

      console.log(`[Integration Disconnected] Customer: ${customerId}`);

      return res.status(200).json({
        success: true,
        message: 'Shopify integration disconnected'
      });
    } catch (error) {
      console.error('[Disconnect Error]', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Private: Send license email to customer
   */
  async _sendLicenseEmail(result) {
    try {
      const customer = await this.models.Customer.findByPk(result.customerId);
      
      if (!customer) return;

      // Email with license keys
      const emailBody = `
        <h2>License Activation</h2>
        <p>Thank you for your purchase! Your license keys are ready to use:</p>
        <ul>
          ${result.licenses.map(license => `
            <li>
              <strong>${license.licenseType.toUpperCase()}</strong><br>
              License Key: <code>${license.licenseKey}</code>
            </li>
          `).join('')}
        </ul>
        <p><a href="${process.env.APP_URL}/dashboard">Activate in your account</a></p>
      `;

      console.log(`[License Email] Sent to: ${customer.email}`);
      // Integration with email service would go here
    } catch (error) {
      console.error('[Email Send Error]', error.message);
    }
  }

  /**
   * Private: Send order fulfillment confirmation
   */
  async _sendFulfillmentEmail(license, order) {
    try {
      const customer = await this.models.Customer.findByPk(license.customerId);

      if (!customer) return;

      const emailBody = `
        <h2>Order Fulfilled</h2>
        <p>Your Shopify order #${order.id} has been fulfilled!</p>
        <p>Your license is active and ready to use:</p>
        <p><code>${license.licenseKey}</code></p>
        <p><a href="${process.env.APP_URL}/dashboard">Open Dashboard</a></p>
      `;

      console.log(`[Fulfillment Email] Sent to: ${customer.email}`);
      // Integration with email service would go here
    } catch (error) {
      console.error('[Fulfillment Email Error]', error.message);
    }
  }

  /**
   * Private: Validate Shopify shop domain format
   */
  _isValidShopDomain(shop) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
  }
}

module.exports = ShopifyWebhookController;
