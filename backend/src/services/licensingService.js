/**
 * Licensing Service
 * Business logic for license management, activation, renewal, etc.
 */

const LicenseKeyGenerator = require('../utils/licenseKeyGenerator');

class LicensingService {
  /**
   * Initialize service with database models
   */
  constructor(models) {
    this.License = models.License;
    this.Customer = models.Customer;
    this.Usage = models.Usage; // To be created
  }

  /**
   * Activate a license for a customer
   * @param {Object} data - Activation data
   * @param {string} data.licenseKey - License key to activate
   * @param {string} data.customerId - Customer ID
   * @param {string} data.deviceId - Device ID (for self-hosted)
   * @returns {Promise<Object>} Activation result
   */
  async activateLicense(data) {
    const { licenseKey, customerId, deviceId } = data;

    try {
      // Validate license key format
      const validation = LicenseKeyGenerator.validate(licenseKey);
      if (!validation.isValid) {
        throw new Error(`Invalid license key: ${validation.error}`);
      }

      // Check if license already exists
      const existingLicense = await this.License.findOne({
        where: { licenseKey }
      });

      if (existingLicense) {
        throw new Error('License key already activated');
      }

      // Check if customer exists
      const customer = await this.Customer.findByPk(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Create license record
      const license = await this.License.create({
        customerId,
        licenseKey,
        licenseType: validation.data.type,
        expiresAt: validation.data.expiryDate,
        status: 'active',
        activatedAt: new Date(),
        deviceId,
        graceUntil: this._calculateGracePeriod(),
        // Extract metadata from license
        storesLimit: validation.data.metadata?.storesLimit || 1,
        usersLimit: validation.data.metadata?.usersLimit || 5,
        featuresEnabled: this._getFeaturesByType(validation.data.type)
      });

      return {
        success: true,
        message: 'License activated successfully',
        license: this._formatLicenseResponse(license)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate a license key
   * @param {string} licenseKey - License key to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateLicense(licenseKey) {
    try {
      // Check if license exists in database
      const license = await this.License.findOne({
        where: { licenseKey }
      });

      if (!license) {
        return {
          isValid: false,
          error: 'License not found in system'
        };
      }

      // Check license status
      if (license.status === 'suspended') {
        return {
          isValid: false,
          error: 'License is suspended'
        };
      }

      if (license.status === 'inactive') {
        return {
          isValid: false,
          error: 'License is inactive'
        };
      }

      // Check expiry date
      const now = new Date();
      if (license.expiresAt < now) {
        // Update status to expired
        await license.update({ status: 'expired' });
        return {
          isValid: false,
          error: 'License has expired'
        };
      }

      // Check grace period for offline usage
      if (license.deploymentType === 'self-hosted' && license.graceUntil > now) {
        return {
          isValid: true,
          license: this._formatLicenseResponse(license),
          warning: 'License is in offline grace period'
        };
      }

      return {
        isValid: true,
        license: this._formatLicenseResponse(license)
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Get license status
   * @param {string} licenseKey - License key
   * @returns {Promise<Object>} License status
   */
  async getLicenseStatus(licenseKey) {
    try {
      const license = await this.License.findOne({
        where: { licenseKey },
        include: [{ model: this.Customer, as: 'customer' }]
      });

      if (!license) {
        throw new Error('License not found');
      }

      const daysRemaining = Math.ceil(
        (license.expiresAt - new Date()) / (1000 * 60 * 60 * 24)
      );

      return {
        success: true,
        license: {
          ...this._formatLicenseResponse(license),
          daysRemaining,
          customer: {
            id: license.customer?.id,
            email: license.customer?.email,
            companyName: license.customer?.companyName
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extend/renew a license
   * @param {string} licenseKey - License key to extend
   * @param {number} months - Months to extend
   * @returns {Promise<Object>} Extension result
   */
  async extendLicense(licenseKey, months = 12) {
    try {
      const license = await this.License.findOne({
        where: { licenseKey }
      });

      if (!license) {
        throw new Error('License not found');
      }

      // Calculate new expiry date
      const newExpiryDate = new Date(license.expiresAt);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

      // Update license
      await license.update({
        expiresAt: newExpiryDate,
        status: 'active'
      });

      return {
        success: true,
        message: `License extended by ${months} months`,
        license: this._formatLicenseResponse(license)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Suspend a license
   * @param {string} licenseKey - License key to suspend
   * @param {string} reason - Reason for suspension
   * @returns {Promise<Object>} Suspension result
   */
  async suspendLicense(licenseKey, reason = '') {
    try {
      const license = await this.License.findOne({
        where: { licenseKey }
      });

      if (!license) {
        throw new Error('License not found');
      }

      await license.update({
        status: 'suspended',
        notes: `Suspended: ${reason || 'No reason provided'}`
      });

      return {
        success: true,
        message: 'License suspended successfully',
        license: this._formatLicenseResponse(license)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track usage for a license (API calls, stores, users, etc.)
   * @param {string} licenseKey - License key
   * @param {string} usageType - Type of usage
   * @param {number} amount - Amount of usage
   * @returns {Promise<boolean>} Success status
   */
  async trackUsage(licenseKey, usageType, amount = 1) {
    try {
      const license = await this.License.findOne({
        where: { licenseKey }
      });

      if (!license) {
        console.warn(`License not found for usage tracking: ${licenseKey}`);
        return false;
      }

      // TODO: Implement Usage model and save
      // await this.Usage.create({
      //   licenseId: license.id,
      //   customerId: license.customerId,
      //   usageType,
      //   amount,
      //   timestamp: new Date()
      // });

      console.log(`[USAGE] ${usageType}: ${amount} - License: ${licenseKey}`);
      return true;
    } catch (error) {
      console.error('Usage tracking error:', error);
      return false;
    }
  }

  /**
   * Check and update grace period for self-hosted licenses
   * @param {string} licenseKey - License key
   * @returns {Promise<Object>} Grace period info
   */
  async checkGracePeriod(licenseKey) {
    try {
      const license = await this.License.findOne({
        where: { licenseKey }
      });

      if (!license) {
        throw new Error('License not found');
      }

      if (license.deploymentType !== 'self-hosted') {
        throw new Error('Grace period only applies to self-hosted licenses');
      }

      const now = new Date();
      const graceRemaining = Math.ceil(
        (license.graceUntil - now) / (1000 * 60 * 60 * 24)
      );

      if (graceRemaining <= 0) {
        // Grace period expired, need online validation
        return {
          inGracePeriod: false,
          message: 'Grace period expired. License requires online validation.'
        };
      }

      return {
        inGracePeriod: true,
        daysRemaining: Math.max(0, graceRemaining),
        message: `License can work offline for ${graceRemaining} more days`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate new license key for customer
   * @param {Object} data - License generation data
   * @returns {Promise<Object>} Generated license key
   */
  async generateNewLicense(data) {
    const {
      customerId,
      licenseType = 'starter',
      monthsDuration = 12,
      metadata = {}
    } = data;

    try {
      // Verify customer exists
      const customer = await this.Customer.findByPk(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + monthsDuration);

      // Generate license key
      const licenseKey = LicenseKeyGenerator.generate({
        type: licenseType,
        customerId,
        expiryDate,
        metadata: {
          storesLimit: metadata.storesLimit || 1,
          usersLimit: metadata.usersLimit || 5,
          ...metadata
        }
      });

      return {
        success: true,
        licenseKey,
        expiryDate,
        message: 'License key generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get usage statistics for a license
   * @param {string} licenseKey - License key
   * @param {Object} options - Query options (startDate, endDate, etc.)
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats(licenseKey, options = {}) {
    try {
      const license = await this.License.findOne({
        where: { licenseKey }
      });

      if (!license) {
        throw new Error('License not found');
      }

      // TODO: Query Usage model for statistics
      // const usageStats = await this.Usage.findAll({
      //   where: {
      //     licenseId: license.id,
      //     ...(options.startDate && { timestamp: { [Op.gte]: options.startDate } }),
      //     ...(options.endDate && { timestamp: { [Op.lte]: options.endDate } })
      //   },
      //   attributes: ['usageType', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      //   group: ['usageType']
      // });

      return {
        success: true,
        statistics: {
          licenseKey,
          period: {
            start: options.startDate || new Date(new Date().setDate(new Date().getDate() - 30)),
            end: options.endDate || new Date()
          },
          usage: []
          // TODO: Format usage data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate grace period end date (30 days from now)
   * @private
   */
  _calculateGracePeriod() {
    const graceDate = new Date();
    graceDate.setDate(graceDate.getDate() + 30);
    return graceDate;
  }

  /**
   * Get features enabled for license type
   * @private
   */
  _getFeaturesByType(licenseType) {
    const featureMap = {
      starter: {
        pos: true,
        inventory: true,
        orders: true,
        reports: true,
        analytics: true,
        aiInsights: false,
        api: false,
        customBranding: false,
        multiStore: false,
        advancedSecurity: false
      },
      professional: {
        pos: true,
        inventory: true,
        orders: true,
        reports: true,
        analytics: true,
        aiInsights: true,
        api: true,
        customBranding: true,
        multiStore: true,
        advancedSecurity: false
      },
      enterprise: {
        pos: true,
        inventory: true,
        orders: true,
        reports: true,
        analytics: true,
        aiInsights: true,
        api: true,
        customBranding: true,
        multiStore: true,
        advancedSecurity: true
      }
    };

    return featureMap[licenseType] || featureMap.starter;
  }

  /**
   * Format license response
   * @private
   */
  _formatLicenseResponse(license) {
    return {
      id: license.id,
      licenseKey: license.licenseKey,
      licenseType: license.licenseType,
      status: license.status,
      deploymentType: license.deploymentType,
      expiresAt: license.expiresAt,
      activatedAt: license.activatedAt,
      storesLimit: license.storesLimit,
      usersLimit: license.usersLimit,
      featuresEnabled: license.featuresEnabled,
      daysRemaining: Math.ceil((license.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
    };
  }
}

module.exports = LicensingService;
