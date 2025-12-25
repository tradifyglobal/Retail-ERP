/**
 * License Model
 * Represents a software license for the ERP system
 */

module.exports = (sequelize, DataTypes) => {
  const License = sequelize.define(
    'License',
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
          model: 'Customers',
          key: 'id'
        }
      },
      licenseKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Format: YYYY-XXXX-XXXX-XXXX'
      },
      licenseType: {
        type: DataTypes.ENUM('starter', 'professional', 'enterprise', 'addon'),
        allowNull: false,
        defaultValue: 'starter'
      },
      storesLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Maximum number of stores allowed'
      },
      usersLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        comment: 'Maximum number of users allowed'
      },
      featuresEnabled: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          pos: true,
          inventory: true,
          orders: false,
          reports: false,
          aiInventoryOptimization: false,
          aiSalesPrediction: false,
          aiFinancialForecasting: false,
          conversationalAI: false,
          apiAccess: false,
          customBranding: false
        },
        comment: 'JSON object of feature flags'
      },
      activationKey: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Unique activation key for this license'
      },
      activatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the license was activated'
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'License expiry date'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'expired', 'suspended'),
        allowNull: false,
        defaultValue: 'inactive'
      },
      deploymentType: {
        type: DataTypes.ENUM('saas', 'self-hosted', 'hybrid'),
        allowNull: false,
        defaultValue: 'saas',
        comment: 'Type of deployment for this license'
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Device ID for self-hosted installations'
      },
      graceUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Grace period end date for offline usage'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      timestamps: true,
      tableName: 'licenses'
    }
  );

  License.associate = (models) => {
    License.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
  };

  return License;
};
