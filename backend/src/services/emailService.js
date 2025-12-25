/**
 * Email Service
 * Handles sending transactional emails via SMTP (Nodemailer)
 */

const nodemailer = require('nodemailer');

class EmailService {
  /**
   * Initialize email service
   */
  constructor() {
    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@retailerp.com';
    this.fromName = 'Retail ERP';
  }

  /**
   * Send payment success email
   */
  async sendPaymentSuccessEmail(customer, licenseType) {
    try {
      const subject = 'Payment Successful - Your License Activated';
      const html = this._generatePaymentSuccessEmail(customer, licenseType);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Payment success email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending payment success email:', error);
    }
  }

  /**
   * Send payment failure email
   */
  async sendPaymentFailureEmail(customer, errorMessage) {
    try {
      const subject = 'Payment Failed - Action Required';
      const html = this._generatePaymentFailureEmail(customer, errorMessage);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Payment failure email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending payment failure email:', error);
    }
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmationEmail(customer, licenseType) {
    try {
      const subject = 'Subscription Confirmed - Welcome to Retail ERP';
      const html = this._generateSubscriptionConfirmationEmail(customer, licenseType);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Subscription confirmation email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending subscription confirmation email:', error);
    }
  }

  /**
   * Send subscription cancellation email
   */
  async sendSubscriptionCancellationEmail(customer) {
    try {
      const subject = 'Subscription Cancelled';
      const html = this._generateSubscriptionCancellationEmail(customer);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Subscription cancellation email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending subscription cancellation email:', error);
    }
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(customer, invoice) {
    try {
      const subject = `Invoice #${invoice.number} - Retail ERP`;
      const html = this._generateInvoiceEmail(customer, invoice);

      await this._sendEmail(customer.email, subject, html, {
        attachments: invoice.invoice_pdf ? [
          {
            filename: `invoice-${invoice.number}.pdf`,
            path: invoice.invoice_pdf
          }
        ] : []
      });

      console.log(`[EMAIL] Invoice email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending invoice email:', error);
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(customer, invoice) {
    try {
      const subject = `Payment Received - Invoice #${invoice.number}`;
      const html = this._generatePaymentConfirmationEmail(customer, invoice);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Payment confirmation email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
    }
  }

  /**
   * Send payment failure reminder email
   */
  async sendPaymentFailureReminderEmail(customer, invoice) {
    try {
      const subject = `Payment Reminder - Invoice #${invoice.number} is Overdue`;
      const html = this._generatePaymentFailureReminderEmail(customer, invoice);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Payment failure reminder email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending payment failure reminder email:', error);
    }
  }

  /**
   * Send refund notification email
   */
  async sendRefundNotificationEmail(customer, charge) {
    try {
      const subject = 'Refund Processed - Retail ERP';
      const html = this._generateRefundNotificationEmail(customer, charge);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Refund notification email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending refund notification email:', error);
    }
  }

  /**
   * Send welcome email to new customer
   */
  async sendWelcomeEmail(customer) {
    try {
      const subject = 'Welcome to Retail ERP - Get Started';
      const html = this._generateWelcomeEmail(customer);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Welcome email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  /**
   * Send email verification link
   */
  async sendEmailVerificationEmail(customer, verificationToken) {
    try {
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      const subject = 'Verify Your Email - Retail ERP';
      const html = this._generateEmailVerificationEmail(customer, verificationLink);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Email verification email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending email verification email:', error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(customer, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const subject = 'Reset Your Password - Retail ERP';
      const html = this._generatePasswordResetEmail(customer, resetLink);

      await this._sendEmail(customer.email, subject, html);
      console.log(`[EMAIL] Password reset email sent to ${customer.email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  }

  /**
   * Send generic email
   * @private
   */
  async _sendEmail(to, subject, html, options = {}) {
    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
        ...options
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Email templates
   * @private
   */

  _generatePaymentSuccessEmail(customer, licenseType) {
    const tierNames = {
      starter: 'Starter Plan',
      professional: 'Professional Plan',
      enterprise: 'Enterprise Plan'
    };

    return `
      <h1>Payment Successful! 🎉</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Your payment has been processed successfully.</p>
      
      <h2>License Details</h2>
      <ul>
        <li><strong>Plan:</strong> ${tierNames[licenseType] || licenseType}</li>
        <li><strong>Activation Date:</strong> Today</li>
        <li><strong>Company:</strong> ${customer.companyName || 'N/A'}</li>
      </ul>

      <p>Your license is now active. You can start using all the features included in your plan.</p>

      <p><a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>

      <hr>
      <p>Need help? Contact us at support@retailerp.com</p>
    `;
  }

  _generatePaymentFailureEmail(customer, errorMessage) {
    return `
      <h1>Payment Processing Failed</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Unfortunately, your payment could not be processed.</p>
      
      <h2>Error Details</h2>
      <p>${errorMessage}</p>

      <p>Please try again with a different payment method or contact our support team for assistance.</p>

      <p><a href="${process.env.FRONTEND_URL}/billing" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Retry Payment</a></p>

      <hr>
      <p>Questions? Contact support@retailerp.com</p>
    `;
  }

  _generateSubscriptionConfirmationEmail(customer, licenseType) {
    return `
      <h1>Welcome to Retail ERP! 🚀</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Thank you for choosing Retail ERP. Your subscription is now active!</p>
      
      <h2>What's Included</h2>
      <ul>
        <li>Complete ERP System</li>
        <li>POS Integration</li>
        <li>Inventory Management</li>
        <li>And more...</li>
      </ul>

      <p><a href="${process.env.FRONTEND_URL}/getting-started" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>

      <hr>
      <p>Support: support@retailerp.com</p>
    `;
  }

  _generateSubscriptionCancellationEmail(customer) {
    return `
      <h1>Subscription Cancelled</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Your subscription has been cancelled as requested.</p>
      
      <p>We're sorry to see you go. If you have any feedback or would like to reactivate your subscription, please don't hesitate to contact us.</p>

      <p><a href="${process.env.FRONTEND_URL}/reactivate" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reactivate Subscription</a></p>

      <hr>
      <p>Feedback: support@retailerp.com</p>
    `;
  }

  _generateInvoiceEmail(customer, invoice) {
    const amount = (invoice.total / 100).toFixed(2);
    const date = new Date(invoice.created * 1000).toLocaleDateString();

    return `
      <h1>Invoice #${invoice.number}</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Please find attached your invoice.</p>
      
      <h2>Invoice Details</h2>
      <ul>
        <li><strong>Invoice Number:</strong> ${invoice.number}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Amount:</strong> $${amount}</li>
        <li><strong>Status:</strong> ${invoice.status}</li>
      </ul>

      <p><a href="${process.env.FRONTEND_URL}/billing/invoices/${invoice.id}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>

      <hr>
      <p>Questions? Contact support@retailerp.com</p>
    `;
  }

  _generatePaymentConfirmationEmail(customer, invoice) {
    const amount = (invoice.total / 100).toFixed(2);
    const date = new Date(invoice.paid_at * 1000 || Date.now()).toLocaleDateString();

    return `
      <h1>Payment Received ✓</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Thank you! Your payment has been received and processed.</p>
      
      <h2>Payment Details</h2>
      <ul>
        <li><strong>Amount:</strong> $${amount}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Invoice:</strong> #${invoice.number}</li>
      </ul>

      <p>Your service will continue without interruption.</p>

      <hr>
      <p>Need help? Contact support@retailerp.com</p>
    `;
  }

  _generatePaymentFailureReminderEmail(customer, invoice) {
    const amount = (invoice.total / 100).toFixed(2);

    return `
      <h1>Payment Reminder</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>We haven't received payment for invoice #${invoice.number} yet.</p>
      
      <h2>Invoice Details</h2>
      <ul>
        <li><strong>Amount Due:</strong> $${amount}</li>
        <li><strong>Invoice Number:</strong> #${invoice.number}</li>
      </ul>

      <p>Please update your payment method to avoid service interruption.</p>

      <p><a href="${process.env.FRONTEND_URL}/billing" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Payment</a></p>

      <hr>
      <p>Support: support@retailerp.com</p>
    `;
  }

  _generateRefundNotificationEmail(customer, charge) {
    const amount = (charge.amount / 100).toFixed(2);

    return `
      <h1>Refund Processed</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>A refund has been processed to your account.</p>
      
      <h2>Refund Details</h2>
      <ul>
        <li><strong>Amount Refunded:</strong> $${amount}</li>
        <li><strong>Status:</strong> Processed</li>
      </ul>

      <p>The refund may take 3-5 business days to appear in your account.</p>

      <hr>
      <p>Questions? Contact support@retailerp.com</p>
    `;
  }

  _generateWelcomeEmail(customer) {
    return `
      <h1>Welcome to Retail ERP! 🎉</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Thank you for signing up. We're excited to have you on board!</p>
      
      <h2>Getting Started</h2>
      <ol>
        <li>Verify your email address</li>
        <li>Complete your profile</li>
        <li>Choose your subscription plan</li>
        <li>Start managing your business</li>
      </ol>

      <p><a href="${process.env.FRONTEND_URL}/getting-started" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>

      <hr>
      <p>Support: support@retailerp.com</p>
    `;
  }

  _generateEmailVerificationEmail(customer, verificationLink) {
    return `
      <h1>Verify Your Email</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Please verify your email address to complete your account setup.</p>
      
      <p><a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>

      <p>This link will expire in 24 hours.</p>

      <hr>
      <p>If you didn't sign up, you can ignore this email.</p>
    `;
  }

  _generatePasswordResetEmail(customer, resetLink) {
    return `
      <h1>Reset Your Password</h1>
      <p>Hi ${customer.firstName || customer.email},</p>
      <p>Click the link below to reset your password.</p>
      
      <p><a href="${resetLink}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>

      <p>This link will expire in 1 hour.</p>

      <hr>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `;
  }
}

module.exports = EmailService;
