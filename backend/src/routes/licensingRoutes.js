/**
 * Licensing Routes
 * REST API endpoints for license management
 */

const express = require('express');
const router = express.Router();

module.exports = (licensingController, authMiddleware) => {
  /**
   * Public endpoints
   */

  // Validate license (public - for offline validation)
  router.post('/validate', async (req, res) => {
    await licensingController.validateLicense(req, res);
  });

  // Check grace period (public - for self-hosted offline checks)
  router.get('/grace-period/:licenseKey', async (req, res) => {
    await licensingController.checkGracePeriod(req, res);
  });

  /**
   * Authenticated endpoints
   */

  // Activate a license
  router.post('/activate', authMiddleware.authenticate, async (req, res) => {
    await licensingController.activateLicense(req, res);
  });

  // Get current user's license
  router.get('/my-license', authMiddleware.authenticate, async (req, res) => {
    await licensingController.getMyLicense(req, res);
  });

  // Get license status
  router.get('/status/:licenseKey', authMiddleware.authenticate, async (req, res) => {
    await licensingController.getLicenseStatus(req, res);
  });

  // Extend/renew license
  router.post('/extend', authMiddleware.authenticate, async (req, res) => {
    await licensingController.extendLicense(req, res);
  });

  // Get usage statistics
  router.get('/usage/:licenseKey', authMiddleware.authenticate, async (req, res) => {
    await licensingController.getUsageStats(req, res);
  });

  // Track usage (internal)
  router.post('/track-usage', authMiddleware.authenticate, async (req, res) => {
    await licensingController.trackUsage(req, res);
  });

  /**
   * Admin endpoints
   */

  // Generate new license
  router.post('/generate', authMiddleware.authenticate, authMiddleware.requireAdmin, async (req, res) => {
    await licensingController.generateNewLicense(req, res);
  });

  // Suspend license
  router.post('/suspend', authMiddleware.authenticate, authMiddleware.requireAdmin, async (req, res) => {
    await licensingController.suspendLicense(req, res);
  });

  return router;
};
