const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Branding = require('../models/Branding');

// Get branding
router.get('/:storeId', async (req, res) => {
  try {
    const branding = await Branding.findOne({
      where: { storeId: req.params.storeId }
    });

    if (!branding) {
      return res.status(404).json({
        success: false,
        message: 'Branding not found'
      });
    }

    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create or update branding
router.post('/:storeId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { storeId } = req.params;
    const { companyName, tagline, logo, favicon, primaryColor, secondaryColor, accentColor } = req.body;

    let branding = await Branding.findOne({ where: { storeId } });

    if (branding) {
      await branding.update({
        companyName: companyName || branding.companyName,
        tagline: tagline || branding.tagline,
        logo: logo || branding.logo,
        favicon: favicon || branding.favicon,
        primaryColor: primaryColor || branding.primaryColor,
        secondaryColor: secondaryColor || branding.secondaryColor,
        accentColor: accentColor || branding.accentColor
      });
    } else {
      branding = await Branding.create({
        storeId,
        companyName,
        tagline,
        logo,
        favicon,
        primaryColor,
        secondaryColor,
        accentColor
      });
    }

    res.json({
      success: true,
      message: 'Branding updated successfully',
      data: branding
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
