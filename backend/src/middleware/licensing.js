/**
 * Licensing Middleware
 * Validates license keys and enforces feature access control
 */

const LicenseKeyGenerator = require('../utils/licenseKeyGenerator');

class LicensingMiddleware {
  /**
   * Validate license from request headers or session
   * Enforces feature access based on license type
   */
  static validateLicense(req, res, next) {
    try {
      // Extract license key from headers or query params
      const licenseKey = 
        req.headers['x-license-key'] ||
        req.headers['authorization']?.split(' ')[1] ||
        req.query.licenseKey ||
        req.body?.licenseKey;

      if (!licenseKey) {
        // If no license key, attach default freemium access
        req.license = {
          isValid: false,
          type: 'freemium',
          features: {
            pos: true,
            inventory: true,
            orders: false,
            reports: false,
            analytics: false,
            aiInsights: false,
            api: false,
            customBranding: false,
            multiStore: false,
            advancedSecurity: false
          }
        };
        return next();
      }

      // Validate the license key
      const validation = LicenseKeyGenerator.validate(licenseKey);

      if (!validation.isValid) {
        // License is invalid - treat as unauthorized
        req.license = {
          isValid: false,
          error: validation.error,
          type: 'freemium'
        };
        return next(); // Continue but with limited access
      }

      // Check if license is expired
      const isExpired = LicenseKeyGenerator.isExpired(licenseKey);
      const daysRemaining = LicenseKeyGenerator.getDaysRemaining(licenseKey);

      if (isExpired) {
        req.license = {
          isValid: false,
          expired: true,
          type: validation.data?.type || 'freemium',
          error: 'License has expired'
        };
        return next();
      }

      // License is valid - attach to request
      req.license = {
        isValid: true,
        licenseKey,
        type: validation.data?.type,
        customerId: validation.data?.customerId,
        expiryDate: validation.data?.expiryDate,
        daysRemaining,
        metadata: validation.data?.metadata || {},
        features: this._getFeaturesByType(validation.data?.type)
      };

      // Warn if expiring soon (14 days or less)
      if (daysRemaining <= 14 && daysRemaining > 0) {
        req.licenseWarning = {
          message: 'License expiring soon',
          daysRemaining
        };
      }

      next();
    } catch (error) {
      console.error('License validation error:', error);
      // On error, allow with freemium access
      req.license = {
        isValid: false,
        error: error.message,
        type: 'freemium'
      };
      next();
    }
  }

  /**
   * Require valid license for endpoint
   * Use this middleware for premium-only endpoints
   */
  static requireValidLicense(req, res, next) {
    if (!req.license?.isValid) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired license',
        message: 'This feature requires a valid license. Please activate your license key.'
      });
    }
    next();
  }

  /**
   * Require specific feature to be enabled
   * Returns middleware for protecting specific features
   */
  static requireFeature(featureName) {
    return (req, res, next) => {
      if (!req.license) {
        return res.status(403).json({
          success: false,
          error: 'License validation failed',
          message: 'Unable to determine license status'
        });
      }

      const features = req.license.features || {};
      
      if (!features[featureName]) {
        return res.status(403).json({
          success: false,
          error: 'Feature not enabled',
          message: `The ${featureName} feature is not enabled for your license tier`,
          requiredTier: this._getMinimumTierForFeature(featureName)
        });
      }

      next();
    };
  }

  /**
   * Track usage for billing purposes
   * Records API calls, stores created, users added, etc.
   */
  static trackUsage(usageType, customerId) {
    return async (req, res, next) => {
      if (!req.license?.isValid || !customerId) {
        return next(); // Only track for valid licenses
      }

      try {
        // Log usage for billing - implement with Usage model
        // This will be called from controllers to track:
        // - API calls
        // - Stores created/updated
        // - Users added/updated
        // - Reports generated
        // - AI feature usage
        console.log(`[USAGE] ${usageType} - Customer: ${customerId}, License: ${req.license.type}`);
        
        // TODO: Implement Usage model and save to database
        // Usage.create({
        //   customerId,
        //   licenseid: req.license.licenseKey,
        //   usageType,
        //   timestamp: new Date()
        // });

        next();
      } catch (error) {
        console.error('Usage tracking error:', error);
        next(); // Don't block request on tracking error
      }
    };
  }

  /**
   * Enforce store limit based on license
   */
  static enforceStoreLimits(req, res, next) {
    if (!req.license?.isValid) {
      return res.status(403).json({
        success: false,
        error: 'License required',
        message: 'Creating stores requires a valid license'
      });
    }

    const storesLimit = req.license.metadata?.storesLimit || 1;

    if (req.storeCount >= storesLimit) {
      return res.status(403).json({
        success: false,
        error: 'Store limit exceeded',
        message: `Your license allows ${storesLimit} store(s). Please upgrade to create more stores.`,
        currentStores: req.storeCount,
        limit: storesLimit
      });
    }

    next();
  }

  /**
   * Enforce user limit based on license
   */
  static enforceUserLimits(req, res, next) {
    if (!req.license?.isValid) {
      return res.status(403).json({
        success: false,
        error: 'License required',
        message: 'Adding users requires a valid license'
      });
    }

    const usersLimit = req.license.metadata?.usersLimit || 1;

    if (req.userCount >= usersLimit) {
      return res.status(403).json({
        success: false,
        error: 'User limit exceeded',
        message: `Your license allows ${usersLimit} user(s). Please upgrade to add more users.`,
        currentUsers: req.userCount,
        limit: usersLimit
      });
    }

    next();
  }

  /**
   * Get features enabled for license type
   * @private
   */
  static _getFeaturesByType(licenseType) {
    const featureMap = {
      freemium: {
        pos: true,
        inventory: true,
        orders: false,
        reports: false,
        analytics: false,
        aiInsights: false,
        api: false,
        customBranding: false,
        multiStore: false,
        advancedSecurity: false
      },
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

    return featureMap[licenseType] || featureMap.freemium;
  }

  /**
   * Get minimum tier required for a feature
   * @private
   */
  static _getMinimumTierForFeature(featureName) {
    const featureTiers = {
      pos: 'freemium',
      inventory: 'freemium',
      orders: 'starter',
      reports: 'starter',
      analytics: 'starter',
      aiInsights: 'professional',
      api: 'professional',
      customBranding: 'professional',
      multiStore: 'professional',
      advancedSecurity: 'enterprise'
    };

    return featureTiers[featureName] || 'enterprise';
  }
}

module.exports = LicensingMiddleware;
