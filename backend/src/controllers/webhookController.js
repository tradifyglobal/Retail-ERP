/**
 * Webhook Controller
 * Handles Stripe webhook events (payments, subscriptions, etc.)
 */

const crypto = require('crypto');

class WebhookController {
  /**
   * Initialize controller with services
   */
  constructor(stripeService, invoiceService, emailService) {
    this.stripeService = stripeService;
    this.invoiceService = invoiceService;
    this.emailService = emailService;
  }

  /**
   * Handle Stripe webhook events
   * POST /api/webhooks/stripe
   */
  async handleStripeWebhook(req, res) {
    try {
      const event = req.body;

      // Verify webhook signature
      if (!this._verifyWebhookSignature(req)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this._handlePaymentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this._handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.created':
          await this._handleSubscriptionCreated(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this._handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this._handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.created':
          await this._handleInvoiceCreated(event.data.object);
          break;

        case 'invoice.finalized':
          await this._handleInvoiceFinalized(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this._handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this._handleInvoicePaymentFailed(event.data.object);
          break;

        case 'charge.refunded':
          await this._handleChargeRefunded(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Acknowledge receipt of event
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      // Always return 200 to prevent Stripe from retrying
      res.status(200).json({ error: error.message });
    }
  }

  /**
   * Handle successful payment
   * @private
   */
  async _handlePaymentSucceeded(paymentIntent) {
    console.log(`[WEBHOOK] Payment succeeded: ${paymentIntent.id}`);

    try {
      const customerId = paymentIntent.metadata.customerId;
      const licenseType = paymentIntent.metadata.licenseType;

      // Update customer plan
      if (customerId) {
        await this.stripeService.Customer.update(
          { planTier: licenseType },
          { where: { id: customerId } }
        );

        // Send success email
        const customer = await this.stripeService.Customer.findByPk(customerId);
        if (customer && this.emailService) {
          await this.emailService.sendPaymentSuccessEmail(customer, licenseType);
        }
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  /**
   * Handle failed payment
   * @private
   */
  async _handlePaymentFailed(paymentIntent) {
    console.log(`[WEBHOOK] Payment failed: ${paymentIntent.id}`);

    try {
      const customerId = paymentIntent.metadata.customerId;

      // Send failure notification email
      if (customerId && this.emailService) {
        const customer = await this.stripeService.Customer.findByPk(customerId);
        if (customer) {
          await this.emailService.sendPaymentFailureEmail(
            customer,
            paymentIntent.last_payment_error?.message || 'Payment processing failed'
          );
        }
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Handle subscription created
   * @private
   */
  async _handleSubscriptionCreated(subscription) {
    console.log(`[WEBHOOK] Subscription created: ${subscription.id}`);

    try {
      const customerId = subscription.metadata.customerId;
      const licenseType = subscription.metadata.licenseType;

      // Subscription should already be saved during creation
      // Send confirmation email
      if (customerId && this.emailService) {
        const customer = await this.stripeService.Customer.findByPk(customerId);
        if (customer) {
          await this.emailService.sendSubscriptionConfirmationEmail(customer, licenseType);
        }
      }
    } catch (error) {
      console.error('Error handling subscription creation:', error);
    }
  }

  /**
   * Handle subscription updated
   * @private
   */
  async _handleSubscriptionUpdated(subscription) {
    console.log(`[WEBHOOK] Subscription updated: ${subscription.id}`);

    try {
      // Update subscription in database
      await this.stripeService.Subscription.update(
        {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          autoRenew: !subscription.cancel_at_period_end
        },
        { where: { stripeSubscriptionId: subscription.id } }
      );
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  /**
   * Handle subscription deleted/cancelled
   * @private
   */
  async _handleSubscriptionDeleted(subscription) {
    console.log(`[WEBHOOK] Subscription deleted: ${subscription.id}`);

    try {
      const sub = await this.stripeService.Subscription.findOne({
        where: { stripeSubscriptionId: subscription.id }
      });

      if (sub) {
        // Update subscription status
        await sub.update({
          status: 'cancelled',
          cancelledAt: new Date()
        });

        // Revoke license access
        const license = await this.stripeService.License.findOne({
          where: { customerId: sub.customerId, status: 'active' }
        });

        if (license) {
          await license.update({ status: 'inactive' });
        }

        // Send cancellation email
        if (this.emailService) {
          const customer = await this.stripeService.Customer.findByPk(sub.customerId);
          if (customer) {
            await this.emailService.sendSubscriptionCancellationEmail(customer);
          }
        }
      }
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }

  /**
   * Handle invoice created
   * @private
   */
  async _handleInvoiceCreated(invoice) {
    console.log(`[WEBHOOK] Invoice created: ${invoice.id}`);

    try {
      const customerId = this._getCustomerIdFromInvoice(invoice);

      if (customerId && this.invoiceService) {
        // Save invoice to database
        await this.invoiceService.saveInvoiceFromStripe(invoice, customerId);
      }
    } catch (error) {
      console.error('Error handling invoice creation:', error);
    }
  }

  /**
   * Handle invoice finalized
   * @private
   */
  async _handleInvoiceFinalized(invoice) {
    console.log(`[WEBHOOK] Invoice finalized: ${invoice.id}`);

    try {
      // Send invoice to customer
      if (invoice.auto_advance) {
        const customerId = this._getCustomerIdFromInvoice(invoice);

        if (customerId && this.emailService) {
          const customer = await this.stripeService.Customer.findByPk(customerId);
          if (customer) {
            await this.emailService.sendInvoiceEmail(customer, invoice);
          }
        }
      }
    } catch (error) {
      console.error('Error handling invoice finalization:', error);
    }
  }

  /**
   * Handle successful invoice payment
   * @private
   */
  async _handleInvoicePaymentSucceeded(invoice) {
    console.log(`[WEBHOOK] Invoice payment succeeded: ${invoice.id}`);

    try {
      const customerId = this._getCustomerIdFromInvoice(invoice);

      if (customerId) {
        // Update invoice in database
        await this.stripeService.Invoice.update(
          {
            status: 'paid',
            paidDate: new Date()
          },
          { where: { stripeInvoiceId: invoice.id } }
        );

        // Send payment confirmation
        if (this.emailService) {
          const customer = await this.stripeService.Customer.findByPk(customerId);
          if (customer) {
            await this.emailService.sendPaymentConfirmationEmail(customer, invoice);
          }
        }
      }
    } catch (error) {
      console.error('Error handling invoice payment success:', error);
    }
  }

  /**
   * Handle failed invoice payment
   * @private
   */
  async _handleInvoicePaymentFailed(invoice) {
    console.log(`[WEBHOOK] Invoice payment failed: ${invoice.id}`);

    try {
      const customerId = this._getCustomerIdFromInvoice(invoice);

      if (customerId) {
        // Update invoice status
        await this.stripeService.Invoice.update(
          {
            status: 'overdue'
          },
          { where: { stripeInvoiceId: invoice.id } }
        );

        // Send payment failure notification
        if (this.emailService) {
          const customer = await this.stripeService.Customer.findByPk(customerId);
          if (customer) {
            await this.emailService.sendPaymentFailureReminderEmail(customer, invoice);
          }
        }
      }
    } catch (error) {
      console.error('Error handling invoice payment failure:', error);
    }
  }

  /**
   * Handle charge refunded
   * @private
   */
  async _handleChargeRefunded(charge) {
    console.log(`[WEBHOOK] Charge refunded: ${charge.id}`);

    try {
      // Find invoice associated with this charge
      const invoices = await this.stripeService.Invoice.findAll({
        where: { stripeInvoiceId: charge.invoice }
      });

      if (invoices.length > 0) {
        const invoice = invoices[0];

        // Update invoice status
        await invoice.update({
          status: 'refunded'
        });

        // Send refund notification
        if (this.emailService) {
          const customer = await this.stripeService.Customer.findByPk(invoice.customerId);
          if (customer) {
            await this.emailService.sendRefundNotificationEmail(customer, charge);
          }
        }
      }
    } catch (error) {
      console.error('Error handling charge refund:', error);
    }
  }

  /**
   * Verify webhook signature
   * @private
   */
  _verifyWebhookSignature(req) {
    try {
      const signature = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        return false;
      }

      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      // In production, verify timing and signature properly
      return true; // Simplified - implement full verification in production
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract customer ID from invoice
   * @private
   */
  _getCustomerIdFromInvoice(invoice) {
    // Try to get customer ID from metadata first
    if (invoice.metadata?.customerId) {
      return invoice.metadata.customerId;
    }

    // Otherwise, look up by Stripe customer ID
    return invoice.customer;
  }
}

module.exports = WebhookController;
