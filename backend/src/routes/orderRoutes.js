const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Order = require('../models/Order');

// Get all orders
router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { storeId: req.user.storeId },
      order: [['createdAt', 'DESC']]
    });
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create order (website)
router.post('/', async (req, res) => {
  try {
    const { storeId, orderNumber, customerName, customerEmail, customerPhone, deliveryAddress, items, totalAmount } = req.body;

    const order = await Order.create({
      storeId,
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      items,
      totalAmount,
      subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update order status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByPk(req.params.id);

    if (!order || order.storeId !== req.user.storeId) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.update({ status });

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
