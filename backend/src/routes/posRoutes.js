const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Get all sales
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.findAll({
      where: { storeId: req.user.storeId },
      order: [['createdAt', 'DESC']]
    });
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create sale (POS transaction)
router.post('/', authMiddleware, roleMiddleware('cashier', 'manager'), async (req, res) => {
  try {
    const { invoiceNumber, customerId, items, paymentMethod, totalAmount, discount } = req.body;

    let subtotal = 0;
    let taxAmount = 0;

    // Process items and update inventory
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      subtotal += product.sellingPrice * item.quantity;
      taxAmount += (product.sellingPrice * item.quantity * (product.tax || 0)) / 100;

      // Update inventory
      await product.update({
        quantity: product.quantity - item.quantity
      });
    }

    const sale = await Sale.create({
      storeId: req.user.storeId,
      invoiceNumber,
      cashierId: req.user.id,
      customerId,
      subtotal,
      taxAmount,
      discount: discount || 0,
      totalAmount: subtotal + taxAmount - (discount || 0),
      paidAmount: totalAmount,
      paymentMethod,
      paymentStatus: 'completed',
      items
    });

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      data: sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
