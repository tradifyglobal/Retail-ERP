const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ShopifyIntegration = sequelize.define('ShopifyIntegration', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Shop domain (e.g., example.myshopify.com)
    shopUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isUrl: true
      },
      index: true
    },

    // Shopify API access token (encrypted in production)
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Should be encrypted in production'
    },

    // Scopes granted by shop owner
    scopes: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of Shopify API scopes (read_orders, read_customers, write_inventory, etc)'
    },

    // Whether integration is currently active
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },

    // Whether webhooks have been registered
    webhooksConfigured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    // When the app was installed
    installedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    // When the app was deactivated (if applicable)
    deactivatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Sync statistics
    totalOrdersProcessed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    totalCustomersSynced: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    totalLicensesCreated: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },

    // Last sync timestamp
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    // Shop name (cached from Shopify)
    shopName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Shop email (cached from Shopify)
    shopEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Shop plan (Shopify plan name)
    shopPlan: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Shop timezone
    timezone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Currency used by shop
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },

    // Configuration/settings
    config: {
      type: DataTypes.JSON,
      defaultValue: {
        autoActivateLicenses: true,
        emailNotificationsEnabled: true,
        syncOrdersEnabled: true,
        syncCustomersEnabled: true
      },
      comment: 'Shop-specific configuration options'
    },

    // Error tracking
    lastError: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    lastErrorAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'ShopifyIntegrations',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        fields: ['shopUrl']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  ShopifyIntegration.associate = (models) => {
    // A shop integration could be linked to multiple licenses
    // ShopifyIntegration.hasMany(models.License, {
    //   foreignKey: 'shopifyIntegrationId'
    // });
  };

  return ShopifyIntegration;
};
