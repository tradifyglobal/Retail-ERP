/**
 * Customer Model
 * Represents a customer/client using the ERP system
 */

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      planTier: {
        type: DataTypes.ENUM('freemium', 'starter', 'professional', 'enterprise'),
        allowNull: false,
        defaultValue: 'freemium'
      },
      deploymentType: {
        type: DataTypes.ENUM('saas', 'self-hosted', 'hybrid'),
        allowNull: false,
        defaultValue: 'saas'
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Stripe customer ID for billing'
      },
      billingEmail: {
        type: DataTypes.STRING,
        allowNull: true
      },
      billingAddress: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      },
      companyInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
          industry: '',
          taxId: '',
          website: '',
          numberOfEmployees: 0
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      },
      trialEndsAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Trial period end date for freemium users'
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    },
    {
      timestamps: true,
      tableName: 'customers'
    }
  );

  Customer.associate = (models) => {
    Customer.hasMany(models.License, {
      foreignKey: 'customerId',
      as: 'licenses'
    });
    Customer.hasMany(models.Subscription, {
      foreignKey: 'customerId',
      as: 'subscriptions'
    });
    Customer.hasMany(models.Invoice, {
      foreignKey: 'customerId',
      as: 'invoices'
    });
  };

  return Customer;
};
