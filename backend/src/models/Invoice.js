/**
 * Invoice Model
 * Represents billing invoices for subscriptions
 */

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    'Invoice',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'subscriptions',
          key: 'id'
        }
      },
      stripeInvoiceId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'Stripe invoice ID'
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Human-readable invoice number'
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'draft'
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Total before tax and discounts'
      },
      tax: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Discount amount'
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Final total after tax and discounts'
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      lineItems: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: 'Array of line items (plan, add-ons, etc.)'
      },
      issueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      paidDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Payment method used (credit_card, etc.)'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    },
    {
      timestamps: true,
      tableName: 'invoices'
    }
  );

  Invoice.associate = (models) => {
    Invoice.belongsTo(models.Customer, {
      foreignKey: 'customerId'
    });
    Invoice.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId'
    });
  };

  return Invoice;
};
