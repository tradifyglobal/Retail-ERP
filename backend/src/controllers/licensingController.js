/**
 * Licensing Controller
 * REST API endpoints for license management
 */

class LicensingController {
  /**
   * Initialize controller with service
   */
  constructor(licensingService) {
    this.licensingService = licensingService;
  }

  /**
   * Activate a license
   * POST /api/licensing/activate
   */
  async activateLicense(req, res) {
    try {
      const { licenseKey, deviceId } = req.body;
      const customerId = req.user?.id;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          error: 'License key is required'
        });
      }

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await this.licensingService.activateLicense({
        licenseKey,
        customerId,
        deviceId
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Validate a license
   * POST /api/licensing/validate
   */
  async validateLicense(req, res) {
    try {
      const { licenseKey } = req.body;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          error: 'License key is required'
        });
      }

      const result = await this.licensingService.validateLicense(licenseKey);

      res.status(result.isValid ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get license status
   * GET /api/licensing/status/:licenseKey
   */
  async getLicenseStatus(req, res) {
    try {
      const { licenseKey } = req.params;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          error: 'License key is required'
        });
      }

      const result = await this.licensingService.getLicenseStatus(licenseKey);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Extend/renew a license
   * POST /api/licensing/extend
   */
  async extendLicense(req, res) {
    try {
      const { licenseKey, months = 12 } = req.body;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          error: 'License key is required'
        });
      }

      // Verify user is authenticated and owns the license
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const result = await this.licensingService.extendLicense(licenseKey, months);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get license status (user's license)
   * GET /api/licensing/my-license
   */
  async getMyLicense(req, res) {
    try {
      const customerId = req.user?.id;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get customer's active license
      const licenses = await this.licensingService.License.findAll({
        where: {
          customerId,
          status: 'active'
        }
      });

      if (licenses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No active license found',
          plan: 'freemium'
        });
      }

      res.status(200).json({
        success: true,
        licenses: licenses.map(license => ({
          id: license.id,
          licenseKey: license.licenseKey,
          licenseType: license.licenseType,
          expiresAt: license.expiresAt,
          daysRemaining: Math.ceil((license.expiresAt - new Date()) / (1000 * 60 * 60 * 24)),
          features: license.featuresEnabled,
          storesLimit: license.storesLimit,
          usersLimit: license.usersLimit,
          deploymentType: license.deploymentType
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check grace period (for self-hosted licenses)
   * GET /api/licensing/grace-period/:licenseKey
   */
  async checkGracePeriod(req, res) {
    try {
      const { licenseKey } = req.params;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          error: 'License key is required'
        });
      }

      const result = await this.licensingService.checkGracePeriod(licenseKey);

      res.status(result.inGracePeriod ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get usage statistics
   * GET /api/licensing/usage/:licenseKey
   */
  async getUsageStats(req, res) {
    try {
      const { licenseKey } = req.params;
      const { startDate, endDate } = req.query;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          error: 'License key is required'
        });
      }

      const result = await this.licensingService.getUsageStats(licenseKey, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Track usage event
   * POST /api/licensing/track-usage
   */
  async trackUsage(req, res) {
    try {
      const { licenseKey, usageType, amount = 1 } = req.body;

      if (!licenseKey || !usageType) {
        return res.status(400).json({
          success: false,
          error: 'License key and usage type are required'
        });
      }

      await this.licensingService.trackUsage(licenseKey, usageType, amount);

      res.status(200).json({
        success: true,
        message: 'Usage tracked successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Generate new license (admin only)
   * POST /api/licensing/generate
   */
  async generateNewLicense(req, res) {
    try {
      // Verify user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { customerId, licenseType, monthsDuration, metadata } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: 'Customer ID is required'
        });
      }

      const result = await this.licensingService.generateNewLicense({
        customerId,
        licenseType: licenseType || 'starter',
        monthsDuration: monthsDuration || 12,
        metadata
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Suspend license (admin only)
   * POST /api/licensing/suspend
   */
  async suspendLicense(req, res) {
    try {
      // Verify user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { licenseKey, reason } = req.body;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          error: 'License key is required'
        });
      }

      const result = await this.licensingService.suspendLicense(licenseKey, reason);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = LicensingController;
