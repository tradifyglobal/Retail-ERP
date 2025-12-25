/**
 * Stripe Service
 * Handles all Stripe payment processing, subscriptions, and customer management
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Initialize service with database models
   */
  constructor(models) {
    this.Customer = models.Customer;
    this.Subscription = models.Subscription;
    this.Invoice = models.Invoice;
    this.License = models.License;
  }

  /**
   * Create a Stripe customer for a new customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Created Stripe customer
   */
  async createStripeCustomer(customerData) {
    try {
      const stripeCustomer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.firstName + ' ' + customerData.lastName,
        description: customerData.companyName || 'Customer',
        metadata: {
          customerId: customerData.id,
          companyName: customerData.companyName,
          planTier: customerData.planTier
        },
        address: customerData.billingAddress ? {
          line1: customerData.billingAddress.street,
          city: customerData.billingAddress.city,
          state: customerData.billingAddress.state,
          postal_code: customerData.billingAddress.zipCode,
          country: customerData.billingAddress.country
        } : undefined
      });

      // Update customer with Stripe ID
      await this.Customer.update(
        { stripeCustomerId: stripeCustomer.id },
        { where: { id: customerData.id } }
      );

      return stripeCustomer;
    } catch (error) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  /**
   * Create a payment intent for checkout
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Payment intent
   */
  async createPaymentIntent(data) {
    const { customerId, amount, currency = 'USD', licenseType, metadata = {} } = data;

    try {
      const customer = await this.Customer.findByPk(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Ensure customer has Stripe ID
      if (!customer.stripeCustomerId) {
        await this.createStripeCustomer(customer);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: customer.stripeCustomerId,
        metadata: {
          customerId,
          licenseType,
          ...metadata
        },
        receipt_email: customer.billingEmail || customer.email,
        statement_descriptor: `Retail ERP - ${licenseType}`
      });

      return paymentIntent;
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Create a subscription
   * @param {Object} data - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  async createSubscription(data) {
    const {
      customerId,
      licenseType = 'starter',
      billingCycle = 'monthly',
      addOns = {}
    } = data;

    try {
      const customer = await this.Customer.findByPk(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Ensure customer has Stripe ID
      if (!customer.stripeCustomerId) {
        await this.createStripeCustomer(customer);
      }

      // Get pricing
      const pricing = this._getPricing(licenseType, billingCycle);
      if (!pricing) {
        throw new Error('Invalid license type or billing cycle');
      }

      // Create or get price
      const priceId = await this._getOrCreatePrice(licenseType, billingCycle, pricing.amount);

      // Create subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customer.stripeCustomerId,
        items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        billing_cycle_anchor: Math.floor(Date.now() / 1000),
        metadata: {
          customerId,
          licenseType,
          addOns: JSON.stringify(addOns)
        },
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      });

      // Save subscription to database
      const subscription = await this.Subscription.create({
        customerId,
        stripeSubscriptionId: stripeSubscription.id,
        planTier: licenseType,
        billingCycle,
        monthlyPrice: billingCycle === 'monthly' ? pricing.amount / 100 : null,
        yearlyPrice: billingCycle === 'yearly' ? pricing.amount / 100 : null,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        addOns
      });

      return {
        subscription,
        stripeSubscription,
        clientSecret: stripeSubscription.latest_invoice?.payment_intent?.client_secret
      };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Retrieve a subscription
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(stripeSubscriptionId) {
    try {
      return await stripe.subscriptions.retrieve(stripeSubscriptionId, {
        expand: ['latest_invoice']
      });
    } catch (error) {
      throw new Error(`Failed to retrieve subscription: ${error.message}`);
    }
  }

  /**
   * Update a subscription
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(stripeSubscriptionId, updateData) {
    try {
      const stripeSubscription = await stripe.subscriptions.update(
        stripeSubscriptionId,
        updateData
      );

      // Update database
      if (updateData.items || updateData.cancel_at_period_end) {
        await this.Subscription.update(
          {
            status: stripeSubscription.status,
            autoRenew: !stripeSubscription.cancel_at_period_end
          },
          { where: { stripeSubscriptionId } }
        );
      }

      return stripeSubscription;
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Cancelled subscription
   */
  async cancelSubscription(stripeSubscriptionId, reason = '') {
    try {
      const stripeSubscription = await stripe.subscriptions.del(stripeSubscriptionId);

      // Update database
      await this.Subscription.update(
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledReason: reason
        },
        { where: { stripeSubscriptionId } }
      );

      return stripeSubscription;
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Retrieve customer invoices
   * @param {string} stripeCustomerId - Stripe customer ID
   * @param {number} limit - Number of invoices to retrieve
   * @returns {Promise<Array>} Customer invoices
   */
  async getCustomerInvoices(stripeCustomerId, limit = 10) {
    try {
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit,
        expand: ['data.payment_intent']
      });

      return invoices.data;
    } catch (error) {
      throw new Error(`Failed to retrieve invoices: ${error.message}`);
    }
  }

  /**
   * Retrieve a specific invoice
   * @param {string} invoiceId - Stripe invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  async getInvoice(invoiceId) {
    try {
      return await stripe.invoices.retrieve(invoiceId, {
        expand: ['payment_intent']
      });
    } catch (error) {
      throw new Error(`Failed to retrieve invoice: ${error.message}`);
    }
  }

  /**
   * Create or retrieve a Stripe price ID
   * @private
   */
  async _getOrCreatePrice(licenseType, billingCycle, amount) {
    try {
      // For simplicity, use predefined price IDs from Stripe dashboard
      // In production, you'd create these via Stripe dashboard or API
      const priceMap = {
        'freemium_monthly': process.env.STRIPE_PRICE_FREEMIUM_MONTHLY,
        'starter_monthly': process.env.STRIPE_PRICE_STARTER_MONTHLY,
        'starter_yearly': process.env.STRIPE_PRICE_STARTER_YEARLY,
        'professional_monthly': process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
        'professional_yearly': process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
        'enterprise_monthly': process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        'enterprise_yearly': process.env.STRIPE_PRICE_ENTERPRISE_YEARLY
      };

      const key = `${licenseType}_${billingCycle}`;
      const priceId = priceMap[key];

      if (!priceId) {
        throw new Error(`No price configured for ${key}`);
      }

      return priceId;
    } catch (error) {
      throw new Error(`Failed to get price: ${error.message}`);
    }
  }

  /**
   * Get pricing for license type and billing cycle
   * @private
   */
  _getPricing(licenseType, billingCycle) {
    const pricing = {
      freemium: {
        monthly: { amount: 0, currency: 'USD' },
        yearly: { amount: 0, currency: 'USD' }
      },
      starter: {
        monthly: { amount: 9900, currency: 'USD' }, // $99
        yearly: { amount: 99900, currency: 'USD' }  // $999 (save $189)
      },
      professional: {
        monthly: { amount: 29900, currency: 'USD' }, // $299
        yearly: { amount: 299900, currency: 'USD' }  // $2999
      },
      enterprise: {
        monthly: { amount: 59900, currency: 'USD' }, // $599
        yearly: { amount: 599900, currency: 'USD' }  // $5999
      }
    };

    return pricing[licenseType]?.[billingCycle] || null;
  }

  /**
   * Upgrade a subscription to a higher tier
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {string} newLicenseType - New license type
   * @param {string} billingCycle - Billing cycle
   * @returns {Promise<Object>} Updated subscription
   */
  async upgradeSubscription(stripeSubscriptionId, newLicenseType, billingCycle) {
    try {
      const subscription = await this.getSubscription(stripeSubscriptionId);
      if (!subscription.items.data[0]) {
        throw new Error('No subscription items found');
      }

      const priceId = await this._getOrCreatePrice(newLicenseType, billingCycle);

      const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId
          }
        ],
        proration_behavior: 'create_prorations'
      });

      // Update database
      const pricing = this._getPricing(newLicenseType, billingCycle);
      await this.Subscription.update(
        {
          planTier: newLicenseType,
          billingCycle,
          monthlyPrice: billingCycle === 'monthly' ? pricing.amount / 100 : null,
          yearlyPrice: billingCycle === 'yearly' ? pricing.amount / 100 : null
        },
        { where: { stripeSubscriptionId } }
      );

      return updated;
    } catch (error) {
      throw new Error(`Failed to upgrade subscription: ${error.message}`);
    }
  }

  /**
   * Retrieve payment methods for customer
   * @param {string} stripeCustomerId - Stripe customer ID
   * @returns {Promise<Array>} Payment methods
   */
  async getPaymentMethods(stripeCustomerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      throw new Error(`Failed to retrieve payment methods: ${error.message}`);
    }
  }

  /**
   * Add a payment method to customer
   * @param {string} stripeCustomerId - Stripe customer ID
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Updated customer
   */
  async attachPaymentMethod(stripeCustomerId, paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      // Set as default
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      return paymentMethod;
    } catch (error) {
      throw new Error(`Failed to attach payment method: ${error.message}`);
    }
  }

  /**
   * Remove a payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Detached payment method
   */
  async removePaymentMethod(paymentMethodId) {
    try {
      return await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      throw new Error(`Failed to remove payment method: ${error.message}`);
    }
  }

  /**
   * Generate invoice for subscription
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Generated invoice
   */
  async generateInvoice(stripeSubscriptionId) {
    try {
      const invoice = await stripe.invoices.create({
        subscription: stripeSubscriptionId,
        auto_advance: false // Don't finalize automatically
      });

      return invoice;
    } catch (error) {
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  /**
   * Finalize and send invoice
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Finalized invoice
   */
  async finalizeInvoice(invoiceId) {
    try {
      const invoice = await stripe.invoices.finalizeInvoice(invoiceId);
      return invoice;
    } catch (error) {
      throw new Error(`Failed to finalize invoice: ${error.message}`);
    }
  }

  /**
   * Send invoice to customer
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice
   */
  async sendInvoice(invoiceId) {
    try {
      return await stripe.invoices.sendInvoice(invoiceId);
    } catch (error) {
      throw new Error(`Failed to send invoice: ${error.message}`);
    }
  }

  /**
   * Create refund for a payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} amount - Refund amount (in cents)
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund
   */
  async createRefund(paymentIntentId, amount = null, reason = '') {
    try {
      return await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount, // null means full refund
        metadata: {
          reason
        }
      });
    } catch (error) {
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Retrieve payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Get usage records for metered billing
   * @param {string} subscriptionItemId - Subscription item ID
   * @returns {Promise<Array>} Usage records
   */
  async getUsageRecords(subscriptionItemId) {
    try {
      const records = await stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItemId);
      return records.data;
    } catch (error) {
      throw new Error(`Failed to retrieve usage records: ${error.message}`);
    }
  }

  /**
   * Create a usage record for metered billing
   * @param {string} subscriptionItemId - Subscription item ID
   * @param {number} quantity - Usage quantity
   * @param {string} action - 'set', 'increment', 'increment_by'
   * @returns {Promise<Object>} Usage record
   */
  async createUsageRecord(subscriptionItemId, quantity, action = 'increment') {
    try {
      return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        action
      });
    } catch (error) {
      throw new Error(`Failed to create usage record: ${error.message}`);
    }
  }
}

module.exports = StripeService;
