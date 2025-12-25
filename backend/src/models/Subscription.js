/**
 * Subscription Model
 * Represents a customer's active subscription
 */

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define(
    'Subscription',
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
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'Stripe subscription ID'
      },
      planTier: {
        type: DataTypes.ENUM('freemium', 'starter', 'professional', 'enterprise'),
        allowNull: false,
        defaultValue: 'starter'
      },
      billingCycle: {
        type: DataTypes.ENUM('monthly', 'yearly', 'one-time'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      monthlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Price in USD'
      },
      yearlyPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('active', 'paused', 'cancelled', 'past_due', 'incomplete'),
        allowNull: false,
        defaultValue: 'active'
      },
      currentPeriodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Start date of current billing period'
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'End date of current billing period'
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date subscription was cancelled'
      },
      cancelledReason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      autoRenew: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      addOns: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional features/add-ons enabled'
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    },
    {
      timestamps: true,
      tableName: 'subscriptions'
    }
  );

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Customer, {
      foreignKey: 'customerId'
    });
    Subscription.hasMany(models.Invoice, {
      foreignKey: 'subscriptionId',
      as: 'invoices'
    });
  };

  return Subscription;
};
