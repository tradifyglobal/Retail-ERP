require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const posRoutes = require('./routes/posRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const accountingRoutes = require('./routes/accountingRoutes');

// Import models
const {
  ChartOfAccounts,
  GeneralLedger,
  JournalEntry,
  Expense,
  Supplier,
  BudgetAllocation
} = require('./models/AccountingModels');

// Import controllers
const AccountingController = require('./controllers/accountingController');
const AccountingService = require('./services/accountingService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();

// Initialize accounting models
sequelize.define('ChartOfAccounts', ChartOfAccounts(sequelize).attributes, ChartOfAccounts(sequelize).options);
sequelize.define('GeneralLedger', GeneralLedger(sequelize).attributes, GeneralLedger(sequelize).options);
sequelize.define('JournalEntry', JournalEntry(sequelize).attributes, JournalEntry(sequelize).options);
sequelize.define('Expense', Expense(sequelize).attributes, Expense(sequelize).options);
sequelize.define('Supplier', Supplier(sequelize).attributes, Supplier(sequelize).options);
sequelize.define('BudgetAllocation', BudgetAllocation(sequelize).attributes, BudgetAllocation(sequelize).options);

// Initialize accounting service and controller
const accountingService = new AccountingService(sequelize.models);
const accountingController = new AccountingController(accountingService, sequelize.models);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(logger);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/accounting', accountingRoutes(accountingController));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    database: sequelize.options.database,
    accounting: 'enabled'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
