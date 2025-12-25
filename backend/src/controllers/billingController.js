/**
 * Billing Controller
 * REST API endpoints for billing and subscription management
 */

class BillingController {
  /**
   * Initialize controller with services
   */
  constructor(stripeService, invoiceService) {
    this.stripeService = stripeService;
    this.invoiceService = invoiceService;
  }

  /**
   * Create payment intent for checkout
   * POST /api/billing/create-payment-intent
   */
  async createPaymentIntent(req, res) {
    try {
      const { licenseType, billingCycle = 'monthly' } = req.body;
      const customerId = req.user?.id;

      if (!licenseType) {
        return res.status(400).json({
          success: false,
          error: 'License type is required'
        });
      }

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get pricing
      const pricing = {
        freemium: { monthly: 0, yearly: 0 },
        starter: { monthly: 99, yearly: 999 },
        professional: { monthly: 299, yearly: 2999 },
        enterprise: { monthly: 599, yearly: 5999 }
      };

      const amount = pricing[licenseType]?.[billingCycle];
      if (amount === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Invalid license type or billing cycle'
        });
      }

      if (amount === 0) {
        // Freemium is free, create subscription directly
        const result = await this.stripeService.createSubscription({
          customerId,
          licenseType,
          billingCycle
        });

        return res.status(200).json({
          success: true,
          message: 'Freemium plan activated',
          subscription: result.subscription
        });
      }

      // Create payment intent for paid plans
      const paymentIntent = await this.stripeService.createPaymentIntent({
        customerId,
        amount,
        licenseType,
        metadata: { billingCycle }
      });

      res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Create subscription after payment
   * POST /api/billing/create-subscription
   */
  async createSubscription(req, res) {
    try {
      const { licenseType, billingCycle = 'monthly', paymentIntentId } = req.body;
      const customerId = req.user?.id;

      if (!licenseType) {
        return res.status(400).json({
          success: false,
          error: 'License type is required'
        });
      }

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Verify payment intent if provided
      if (paymentIntentId) {
        const paymentIntent = await this.stripeService.getPaymentIntent(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({
            success: false,
            error: 'Payment not completed'
          });
        }
      }

      // Create subscription
      const result = await this.stripeService.createSubscription({
        customerId,
        licenseType,
        billingCycle
      });

      res.status(200).json({
        success: true,
        message: 'Subscription created successfully',
        subscription: result.subscription
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get current subscription
   * GET /api/billing/subscription
   */
  async getSubscription(req, res) {
    try {
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get subscription from database
      const subscription = await this.stripeService.Subscription.findOne({
        where: { customerId, status: 'active' }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No active subscription found'
        });
      }

      // Get Stripe subscription for latest details
      const stripeSubscription = await this.stripeService.getSubscription(
        subscription.stripeSubscriptionId
      );

      res.status(200).json({
        success: true,
        subscription: {
          id: subscription.id,
          planTier: subscription.planTier,
          billingCycle: subscription.billingCycle,
          status: subscription.status,
          monthlyPrice: subscription.monthlyPrice,
          yearlyPrice: subscription.yearlyPrice,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          autoRenew: subscription.autoRenew,
          stripeStatus: stripeSubscription.status
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Upgrade subscription to higher tier
   * POST /api/billing/upgrade
   */
  async upgradeSubscription(req, res) {
    try {
      const { newLicenseType, billingCycle = 'monthly' } = req.body;
      const customerId = req.user?.id;

      if (!newLicenseType) {
        return res.status(400).json({
          success: false,
          error: 'New license type is required'
        });
      }

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get current subscription
      const subscription = await this.stripeService.Subscription.findOne({
        where: { customerId, status: 'active' }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found'
        });
      }

      // Upgrade subscription
      const updated = await this.stripeService.upgradeSubscription(
        subscription.stripeSubscriptionId,
        newLicenseType,
        billingCycle
      );

      res.status(200).json({
        success: true,
        message: 'Subscription upgraded successfully',
        subscription: updated
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel subscription
   * POST /api/billing/cancel
   */
  async cancelSubscription(req, res) {
    try {
      const { reason } = req.body;
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get current subscription
      const subscription = await this.stripeService.Subscription.findOne({
        where: { customerId, status: 'active' }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'No active subscription found'
        });
      }

      // Cancel subscription
      const cancelled = await this.stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        subscription: cancelled
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get billing history/invoices
   * GET /api/billing/invoices
   */
  async getInvoices(req, res) {
    try {
      const customerId = req.user?.id;
      const { limit = 10 } = req.query;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get customer from database
      const customer = await this.stripeService.Customer.findByPk(customerId);
      if (!customer || !customer.stripeCustomerId) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Get invoices from Stripe
      const invoices = await this.stripeService.getCustomerInvoices(
        customer.stripeCustomerId,
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        invoices: invoices.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_paid / 100,
          total: invoice.total / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000),
          paidAt: invoice.paid_at ? new Date(invoice.paid_at * 1000) : null,
          invoicePdf: invoice.invoice_pdf
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get a specific invoice
   * GET /api/billing/invoices/:invoiceId
   */
  async getInvoice(req, res) {
    try {
      const { invoiceId } = req.params;
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get invoice from Stripe
      const invoice = await this.stripeService.getInvoice(invoiceId);

      // Verify customer owns this invoice
      const customer = await this.stripeService.Customer.findByPk(customerId);
      if (invoice.customer !== customer.stripeCustomerId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      res.status(200).json({
        success: true,
        invoice: {
          id: invoice.id,
          number: invoice.number,
          amount: invoice.amount_paid / 100,
          total: invoice.total / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000),
          paidAt: invoice.paid_at ? new Date(invoice.paid_at * 1000) : null,
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          invoicePdf: invoice.invoice_pdf,
          lineItems: invoice.lines?.data.map(item => ({
            description: item.description,
            amount: item.amount / 100,
            quantity: item.quantity
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get payment methods
   * GET /api/billing/payment-methods
   */
  async getPaymentMethods(req, res) {
    try {
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const customer = await this.stripeService.Customer.findByPk(customerId);
      if (!customer || !customer.stripeCustomerId) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      const paymentMethods = await this.stripeService.getPaymentMethods(
        customer.stripeCustomerId
      );

      res.status(200).json({
        success: true,
        paymentMethods: paymentMethods.map(pm => ({
          id: pm.id,
          type: pm.type,
          brand: pm.card?.brand,
          lastFour: pm.card?.last4,
          expMonth: pm.card?.exp_month,
          expYear: pm.card?.exp_year
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Add payment method
   * POST /api/billing/payment-methods
   */
  async addPaymentMethod(req, res) {
    try {
      const { paymentMethodId } = req.body;
      const customerId = req.user?.id;

      if (!paymentMethodId) {
        return res.status(400).json({
          success: false,
          error: 'Payment method ID is required'
        });
      }

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const customer = await this.stripeService.Customer.findByPk(customerId);
      if (!customer || !customer.stripeCustomerId) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      const attached = await this.stripeService.attachPaymentMethod(
        customer.stripeCustomerId,
        paymentMethodId
      );

      res.status(200).json({
        success: true,
        message: 'Payment method added successfully',
        paymentMethod: {
          id: attached.id,
          type: attached.type,
          brand: attached.card?.brand,
          lastFour: attached.card?.last4
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remove payment method
   * DELETE /api/billing/payment-methods/:paymentMethodId
   */
  async removePaymentMethod(req, res) {
    try {
      const { paymentMethodId } = req.params;
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      await this.stripeService.removePaymentMethod(paymentMethodId);

      res.status(200).json({
        success: true,
        message: 'Payment method removed successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get billing information for dashboard
   * GET /api/billing/dashboard
   */
  async getBillingDashboard(req, res) {
    try {
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get customer
      const customer = await this.stripeService.Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Get subscription
      const subscription = await this.stripeService.Subscription.findOne({
        where: { customerId }
      });

      // Get recent invoices
      const invoices = customer.stripeCustomerId
        ? await this.stripeService.getCustomerInvoices(customer.stripeCustomerId, 5)
        : [];

      res.status(200).json({
        success: true,
        dashboard: {
          customer: {
            id: customer.id,
            email: customer.email,
            companyName: customer.companyName,
            planTier: customer.planTier
          },
          subscription: subscription ? {
            id: subscription.id,
            planTier: subscription.planTier,
            billingCycle: subscription.billingCycle,
            status: subscription.status,
            monthlyPrice: subscription.monthlyPrice,
            currentPeriodEnd: subscription.currentPeriodEnd,
            autoRenew: subscription.autoRenew
          } : null,
          recentInvoices: invoices.slice(0, 3).map(inv => ({
            id: inv.id,
            amount: inv.total / 100,
            date: new Date(inv.created * 1000),
            status: inv.status
          }))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = BillingController;
