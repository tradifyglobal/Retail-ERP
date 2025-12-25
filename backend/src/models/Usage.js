/**
 * Usage Model
 * Tracks usage metrics for billing and analytics
 */

module.exports = (sequelize, DataTypes) => {
  const Usage = sequelize.define(
    'Usage',
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
      licenseId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'licenses',
          key: 'id'
        }
      },
      usageType: {
        type: DataTypes.ENUM(
          'api_call',
          'store_created',
          'user_added',
          'product_created',
          'order_created',
          'report_generated',
          'ai_analysis',
          'export',
          'import',
          'webhook_call'
        ),
        allowNull: false,
        comment: 'Type of usage event'
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Quantity of usage'
      },
      resourceType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Type of resource affected (store, user, product, etc.)'
      },
      resourceId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ID of resource affected'
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional context about the usage'
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      month: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'YYYY-MM for aggregation',
        defaultValue: () => {
          const date = new Date();
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      }
    },
    {
      timestamps: false,
      tableName: 'usage',
      indexes: [
        {
          fields: ['customerId', 'month']
        },
        {
          fields: ['usageType', 'timestamp']
        }
      ]
    }
  );

  Usage.associate = (models) => {
    Usage.belongsTo(models.Customer, {
      foreignKey: 'customerId'
    });
    Usage.belongsTo(models.License, {
      foreignKey: 'licenseId'
    });
  };

  return Usage;
};
