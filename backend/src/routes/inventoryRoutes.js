const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Product = require('../models/Product');

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { storeId: req.user.storeId }
    });
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create product
router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const { sku, name, category, costPrice, sellingPrice, tax } = req.body;

    const product = await Product.create({
      storeId: req.user.storeId,
      sku,
      name,
      category,
      costPrice,
      sellingPrice,
      tax
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update product
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product || product.storeId !== req.user.storeId) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update(req.body);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete product
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product || product.storeId !== req.user.storeId) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
