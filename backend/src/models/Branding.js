const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Branding = sequelize.define('Branding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  storeId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tagline: {
    type: DataTypes.STRING
  },
  logo: {
    type: DataTypes.STRING
  },
  favicon: {
    type: DataTypes.STRING
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#1976d2'
  },
  secondaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#dc3545'
  },
  accentColor: {
    type: DataTypes.STRING,
    defaultValue: '#28a745'
  },
  fontFamily: {
    type: DataTypes.STRING,
    defaultValue: 'Roboto'
  },
  contactEmail: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  contactPhone: {
    type: DataTypes.STRING
  },
  websiteUrl: {
    type: DataTypes.STRING
  },
  socialMedia: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'brandings'
});

module.exports = Branding;
