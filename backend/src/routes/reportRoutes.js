const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Order = require('../models/Order');
const sequelize = require('../config/database');

// Sales report
router.get('/sales', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const sales = await Sale.findAll({
      where: {
        storeId: req.user.storeId,
        ...(startDate && endDate && {
          createdAt: {
            [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
          }
        })
      }
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalTax = sales.reduce((sum, sale) => sum + parseFloat(sale.taxAmount), 0);

    res.json({
      success: true,
      data: {
        totalSales: sales.length,
        totalRevenue,
        totalTax,
        averageTransactionValue: sales.length > 0 ? totalRevenue / sales.length : 0,
        sales
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Orders report
router.get('/orders', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.query;

    const orders = await Order.findAll({
      where: {
        storeId: req.user.storeId,
        ...(status && { status })
      }
    });

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
