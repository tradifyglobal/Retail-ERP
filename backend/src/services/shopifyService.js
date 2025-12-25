const axios = require('axios');
const crypto = require('crypto');

/**
 * Shopify Integration Service
 * Handles Shopify API operations, webhook verification, and license synchronization
 * Optional module for customers who use Shopify storefronts
 */
class ShopifyService {
  constructor(models) {
    this.models = models;
    this.shopifyApiVersion = '2024-01';
    this.timeout = 10000;
  }

  /**
   * Verify Shopify webhook signature
   * Critical for security - ensures webhook came from Shopify
   */
  verifyWebhookSignature(req) {
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-api-version'];

    if (!hmacHeader || !topic) {
      throw new Error('Missing Shopify webhook headers');
    }

    const body = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const hash = crypto.createHmac('sha256', process.env.SHOPIFY_API_SECRET || 'dev-secret')
      .update(body, 'utf8')
      .digest('base64');

    if (hash !== hmacHeader) {
      throw new Error('Invalid Shopify webhook signature');
    }

    return { topic, shop };
  }

  /**
   * OAuth callback - user installs app from Shopify App Store
   * Exchanges temporary code for permanent access token
   */
  async handleOAuthCallback(shop, code) {
    if (!shop || !code) {
      throw new Error('Missing shop or code parameter');
    }

    const apiUrl = `https://${shop}/admin/oauth/access_token`;
    
    try {
      const response = await axios.post(apiUrl, {
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code: code
      }, { timeout: this.timeout });

      const { access_token, scope } = response.data;

      // Store integration record
      await this.models.ShopifyIntegration.create({
        shopUrl: shop,
        accessToken: access_token,
        scopes: scope,
        isActive: true,
        webhooksConfigured: false
      });

      return {
        success: true,
        shop: shop,
        message: 'Shopify app installed successfully'
      };
    } catch (error) {
      console.error('[Shopify OAuth Error]', error.message);
      throw new Error(`OAuth failed: ${error.message}`);
    }
  }

  /**
   * Register webhooks with Shopify
   * Called after OAuth to set up event listeners
   */
  async registerWebhooks(shop, accessToken) {
    const webhookUrl = `${process.env.API_BASE_URL}/api/webhooks/shopify`;

    const webhooks = [
      {
        topic: 'orders/created',
        address: webhookUrl,
        format: 'json'
      },
      {
        topic: 'orders/fulfilled',
        address: webhookUrl,
        format: 'json'
      },
      {
        topic: 'customers/create',
        address: webhookUrl,
        format: 'json'
      },
      {
        topic: 'app/uninstalled',
        address: webhookUrl,
        format: 'json'
      }
    ];

    try {
      for (const webhook of webhooks) {
        await this._makeShopifyRequest(
          shop,
          accessToken,
          'POST',
          '/admin/api/2024-01/webhooks.json',
          { webhook }
        );
      }

      // Update integration record
      await this.models.ShopifyIntegration.update(
        { webhooksConfigured: true },
        { where: { shopUrl: shop } }
      );

      return { success: true, registered: webhooks.length };
    } catch (error) {
      console.error('[Webhook Registration Error]', error.message);
      throw new Error(`Webhook registration failed: ${error.message}`);
    }
  }

  /**
   * Fetch shop details from Shopify
   */
  async getShopInfo(shop, accessToken) {
    try {
      const response = await this._makeShopifyRequest(
        shop,
        accessToken,
        'GET',
        '/admin/api/2024-01/shop.json'
      );

      return {
        name: response.shop.name,
        email: response.shop.email,
        domain: response.shop.domain,
        myshopifyDomain: response.shop.myshopify_domain,
        plan: response.shop.plan_name,
        timezone: response.shop.timezone
      };
    } catch (error) {
      console.error('[Shop Info Error]', error.message);
      throw new Error(`Failed to fetch shop info: ${error.message}`);
    }
  }

  /**
   * Process order from Shopify webhook
   * Creates license for customer based on product purchased
   */
  async processOrder(shop, order) {
    try {
      // Find customer in local database
      let customer = await this.models.Customer.findOne({
        where: { email: order.email }
      });

      // Create customer if doesn't exist
      if (!customer) {
        customer = await this.models.Customer.create({
          email: order.email,
          firstName: order.billing_address?.first_name || order.customer?.first_name || 'Shopify',
          lastName: order.billing_address?.last_name || order.customer?.last_name || 'Customer',
          phone: order.customer?.phone || order.billing_address?.phone,
          shopifyCustomerId: order.customer?.id || null
        });
      }

      // Update Shopify customer ID if not already set
      if (!customer.shopifyCustomerId && order.customer?.id) {
        await customer.update({ shopifyCustomerId: order.customer.id });
      }

      // Process each line item
      const createdLicenses = [];
      for (const lineItem of order.line_items) {
        // Map Shopify product to license tier
        const licenseType = this._mapProductToLicenseType(lineItem.sku, lineItem.title);
        
        if (licenseType) {
          // Create or update license
          const license = await this.models.License.create({
            customerId: customer.id,
            licenseKey: this._generateLicenseKey(),
            licenseType: licenseType,
            status: 'active',
            activationDate: new Date(),
            expirationDate: this._calculateExpirationDate(licenseType, 30), // 30 day trial default
            shopifyOrderId: order.id,
            maxUsers: this._getLicenseMaxUsers(licenseType),
            features: this._getLicenseFeatures(licenseType)
          });

          createdLicenses.push({
            customerId: customer.id,
            licenseKey: license.licenseKey,
            licenseType: licenseType,
            orderId: order.id
          });
        }
      }

      return {
        success: createdLicenses.length > 0,
        customerId: customer.id,
        licensesCreated: createdLicenses.length,
        licenses: createdLicenses
      };
    } catch (error) {
      console.error('[Order Processing Error]', error.message);
      throw new Error(`Failed to process Shopify order: ${error.message}`);
    }
  }

  /**
   * Sync customer from Shopify
   * Called when customer is created in Shopify
   */
  async syncCustomer(shop, shopifyCustomer) {
    try {
      const customer = await this.models.Customer.findOrCreate({
        where: { email: shopifyCustomer.email },
        defaults: {
          email: shopifyCustomer.email,
          firstName: shopifyCustomer.first_name || 'Shopify',
          lastName: shopifyCustomer.last_name || 'Customer',
          phone: shopifyCustomer.phone,
          shopifyCustomerId: shopifyCustomer.id,
          source: 'shopify'
        }
      });

      return {
        success: true,
        customerId: customer[0].id,
        isNewCustomer: customer[1] // true if created, false if found
      };
    } catch (error) {
      console.error('[Customer Sync Error]', error.message);
      throw new Error(`Failed to sync customer: ${error.message}`);
    }
  }

  /**
   * Handle app uninstallation
   * Clean up integration when customer removes app
   */
  async handleAppUninstall(shop) {
    try {
      // Mark integration as inactive
      const integration = await this.models.ShopifyIntegration.update(
        { isActive: false, deactivatedAt: new Date() },
        { where: { shopUrl: shop } }
      );

      // Optionally revoke all licenses associated with this shop
      // await this.models.License.update(
      //   { status: 'revoked', revokeReason: 'Shopify app uninstalled' },
      //   { where: { shopifyIntegration: shop } }
      // );

      return { success: true, shop: shop };
    } catch (error) {
      console.error('[App Uninstall Error]', error.message);
      throw new Error(`Failed to handle app uninstall: ${error.message}`);
    }
  }

  /**
   * Get integration status for a shop
   */
  async getIntegrationStatus(shop) {
    try {
      const integration = await this.models.ShopifyIntegration.findOne({
        where: { shopUrl: shop },
        attributes: ['shopUrl', 'isActive', 'webhooksConfigured', 'createdAt', 'deactivatedAt']
      });

      if (!integration) {
        return { found: false };
      }

      return {
        found: true,
        shop: integration.shopUrl,
        isActive: integration.isActive,
        webhooksConfigured: integration.webhooksConfigured,
        installedAt: integration.createdAt,
        deactivatedAt: integration.deactivatedAt
      };
    } catch (error) {
      console.error('[Integration Status Error]', error.message);
      throw new Error(`Failed to get integration status: ${error.message}`);
    }
  }

  /**
   * Fetch customer's orders from Shopify
   */
  async getCustomerOrders(shop, accessToken, customerId) {
    try {
      const response = await this._makeShopifyRequest(
        shop,
        accessToken,
        'GET',
        `/admin/api/2024-01/customers/${customerId}/orders.json`
      );

      return response.orders || [];
    } catch (error) {
      console.error('[Fetch Orders Error]', error.message);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  /**
   * Create refund in Shopify
   * When license is revoked, optionally trigger refund
   */
  async createRefund(shop, accessToken, orderId, refundReason) {
    try {
      const response = await this._makeShopifyRequest(
        shop,
        accessToken,
        'POST',
        `/admin/api/2024-01/orders/${orderId}/refunds.json`,
        {
          refund: {
            note: refundReason || 'License revocation',
            restock: true
          }
        }
      );

      return {
        success: true,
        refundId: response.refund.id
      };
    } catch (error) {
      console.error('[Refund Error]', error.message);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Private: Make authenticated request to Shopify API
   */
  async _makeShopifyRequest(shop, accessToken, method = 'GET', endpoint, data = null) {
    const url = `https://${shop}${endpoint}`;
    
    try {
      const config = {
        method: method,
        url: url,
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`[Shopify API Error - ${method} ${endpoint}]`, error.message);
      throw error;
    }
  }

  /**
   * Private: Map Shopify product to license type
   * Customize this based on your product catalog
   */
  _mapProductToLicenseType(sku, productTitle) {
    // Map SKU or title to license tier
    if (sku?.includes('STARTER') || productTitle?.includes('Starter')) {
      return 'starter';
    }
    if (sku?.includes('PRO') || productTitle?.includes('Professional')) {
      return 'professional';
    }
    if (sku?.includes('ENTERPRISE') || productTitle?.includes('Enterprise')) {
      return 'enterprise';
    }
    if (sku?.includes('FREE') || productTitle?.includes('Free')) {
      return 'freemium';
    }
    return null;
  }

  /**
   * Private: Generate license key
   */
  _generateLicenseKey() {
    return `SHOP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Private: Calculate expiration date
   */
  _calculateExpirationDate(licenseType, daysFromNow = 30) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }

  /**
   * Private: Get max users for license type
   */
  _getLicenseMaxUsers(licenseType) {
    const limits = {
      freemium: 1,
      starter: 5,
      professional: 25,
      enterprise: 999
    };
    return limits[licenseType] || 1;
  }

  /**
   * Private: Get features for license type
   */
  _getLicenseFeatures(licenseType) {
    const features = {
      freemium: ['pos', 'basic_inventory'],
      starter: ['pos', 'inventory', 'orders', 'basic_reports'],
      professional: ['pos', 'inventory', 'orders', 'reports', 'branding', 'users'],
      enterprise: ['all']
    };
    return features[licenseType] || [];
  }
}

module.exports = ShopifyService;
