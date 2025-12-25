# Phase 3: Customer Portal - Implementation Guide

**Status**: In Development  
**Phase**: Customer Portal UI Components  
**Version**: 1.0  
**Last Updated**: December 2025

---

## 🎯 Overview

Phase 3 builds the **Customer Portal** - a complete React-based UI for customers to manage their subscriptions, billing, and usage. This phase integrates with the Phase 2 Billing API and Stripe payment infrastructure.

### Key Features
- ✅ **Billing Dashboard** - Overview of subscription, invoices, payments
- ✅ **Subscription Manager** - Upgrade, downgrade, cancel plans
- ✅ **Invoice Viewer** - Download PDFs, email invoices, filter/search
- ✅ **Payment Methods** - Add, update, delete credit cards
- ✅ **Usage Analytics** - Charts, feature usage, API metrics
- ✅ **Responsive Design** - Mobile, tablet, desktop optimized
- ✅ **Professional UI** - Modern styling with transitions and animations

### Architecture
```
Customer Portal (React Frontend)
├── BillingDashboard (Main Hub)
│   ├── SubscriptionManager
│   ├── InvoiceViewer
│   ├── PaymentMethodManager
│   └── UsageAnalytics
└── API Integration (Phase 2 Endpoints)
    ├── /billing/dashboard
    ├── /billing/upgrade
    ├── /billing/invoices
    └── /billing/payment-methods
```

---

## 📦 Components Created

### 1. **BillingDashboard.js** (300+ lines)

Main container component that manages all billing-related functionality.

#### Features
- Tab-based navigation (Overview, Subscription, Invoices, Payment, Usage)
- Current subscription status display
- Recent invoices preview
- Feature highlights
- Refresh functionality

#### Usage

```jsx
import BillingDashboard from './components/BillingDashboard';

function App() {
  return <BillingDashboard />;
}
```

#### Data Structure

```javascript
// Expected dashboard response from /api/billing/dashboard
{
  subscription: {
    planTier: 'professional',
    status: 'active',
    monthlyPrice: 299,
    billingCycle: 'monthly',
    nextBillingDate: '2026-01-25',
    maxUsers: 25,
    features: ['pos', 'inventory', 'orders', 'reports', 'branding', 'users']
  },
  stats: {
    totalPaid: 1500,
    totalInvoices: 5,
    usersCount: 8,
    recentInvoices: [
      {
        id: 'inv_123',
        number: '12345',
        createdAt: '2025-12-25',
        total: 299,
        status: 'paid'
      }
    ]
  }
}
```

---

### 2. **SubscriptionManager.js** (250+ lines)

Handle plan changes with real-time proration calculations.

#### Features
- Display all available plans with pricing
- Monthly/Annual billing cycle toggle
- Real-time proration calculation
- Upgrade/downgrade with confirmation
- Cancel subscription with warning modal
- Visual plan comparison

#### Usage

```jsx
import SubscriptionManager from './components/SubscriptionManager';

function BillingPage() {
  const handleUpdate = () => {
    // Refresh dashboard after plan change
  };

  return (
    <SubscriptionManager 
      currentPlan={subscription}
      onUpdate={handleUpdate}
    />
  );
}
```

#### Plan Configuration

```javascript
const plans = [
  {
    id: 'freemium',
    name: 'Freemium',
    monthlyPrice: 0,
    annualPrice: 0,
    maxUsers: 1,
    features: ['pos', 'basic_inventory']
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 99,
    annualPrice: 999,
    maxUsers: 5,
    features: ['pos', 'inventory', 'orders', 'basic_reports']
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 299,
    annualPrice: 2999,
    maxUsers: 25,
    features: ['pos', 'inventory', 'orders', 'reports', 'branding', 'users'],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 599,
    annualPrice: 5999,
    maxUsers: 999,
    features: ['all']
  }
];
```

#### API Calls

```javascript
// Calculate proration
POST /api/billing/calculate-proration
{
  currentPlan: 'starter',
  newPlan: 'professional',
  billingCycle: 'monthly'
}

Response:
{
  currentCredit: 100,
  newCharge: 299,
  amountDue: 199
}

// Upgrade plan
POST /api/billing/upgrade
{
  newPlan: 'professional',
  billingCycle: 'monthly'
}

Response:
{
  success: true,
  subscription: { ... }
}

// Cancel subscription
POST /api/billing/cancel
Response:
{
  success: true,
  message: 'Subscription cancelled'
}
```

---

### 3. **InvoiceViewer.js** (200+ lines)

Complete invoice management with filtering and PDF download.

#### Features
- List all invoices with pagination
- Filter by status (paid, pending, failed)
- Sort options (date, amount)
- Download PDF invoices
- Send invoice via email
- View invoice details in modal
- Line items breakdown
- Tax and discount info

#### Usage

```jsx
import InvoiceViewer from './components/InvoiceViewer';

function Billing() {
  return <InvoiceViewer />;
}
```

#### API Calls

```javascript
// Get invoices
GET /api/billing/invoices?page=1&limit=10&status=all&sort=date-desc

Response:
{
  invoices: [
    {
      id: 'inv_123',
      number: '12345',
      createdAt: '2025-12-25',
      total: 299,
      subtotal: 299,
      tax: 0,
      discount: 0,
      status: 'paid',
      paidAt: '2025-12-25',
      description: 'Professional Plan - Monthly',
      lineItems: [
        {
          description: 'Professional Plan',
          quantity: 1,
          unitPrice: 299,
          amount: 299
        }
      ]
    }
  ],
  totalPages: 1
}

// Download PDF
GET /api/billing/invoices/:invoiceId/pdf
Response: Binary PDF

// Send invoice email
POST /api/billing/invoices/:invoiceId/send-email
Response:
{
  success: true,
  message: 'Invoice sent'
}
```

---

### 4. **PaymentMethodManager.js** (250+ lines)

Manage credit cards and payment methods securely.

#### Features
- List saved payment methods
- Add new credit card with validation
- Delete card with confirmation
- Set default payment method
- Card brand detection (Visa, Mastercard, Amex)
- Secure card number display (last 4 only)
- Expiration date tracking

#### Usage

```jsx
import PaymentMethodManager from './components/PaymentMethodManager';

function Billing() {
  const handleUpdate = () => {
    // Refresh after card changes
  };

  return (
    <PaymentMethodManager onUpdate={handleUpdate} />
  );
}
```

#### Payment Method Data

```javascript
{
  id: 'pm_123',
  brand: 'visa',
  last4: '4242',
  expMonth: 12,
  expYear: 2026,
  holderName: 'John Doe',
  isDefault: true,
  funding: 'credit'
}
```

#### API Calls

```javascript
// Get payment methods
GET /api/billing/payment-methods
Response:
{
  paymentMethods: [
    {
      id: 'pm_123',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2026,
      holderName: 'John Doe',
      isDefault: true
    }
  ]
}

// Add payment method
POST /api/billing/payment-methods
{
  holderName: 'John Doe',
  cardNumber: '4242...',
  expMonth: '12',
  expYear: '26',
  cvc: '123'
}
Response:
{
  success: true,
  paymentMethod: { ... }
}

// Set as default
POST /api/billing/payment-methods/:id/set-default
Response:
{
  success: true
}

// Delete payment method
DELETE /api/billing/payment-methods/:id
Response:
{
  success: true
}
```

---

### 5. **UsageAnalytics.js** (200+ lines)

Display feature usage, API metrics, and storage with visualizations.

#### Features
- Key metrics cards (Users, API Calls, Storage, Exports)
- Usage trend charts (30-day history)
- API calls by endpoint breakdown
- Feature usage percentages
- Detailed usage breakdown by module
- Progress indicators with color coding
- Monthly usage statistics

#### Usage

```jsx
import UsageAnalytics from './components/UsageAnalytics';

function Billing() {
  return <UsageAnalytics usage={dashboardData.usage} />;
}
```

#### Usage Data Structure

```javascript
{
  usersCount: 8,
  maxUsers: 25,
  apiCalls: 45000,
  maxApiCalls: 100000,
  storageUsed: 2500000000,  // bytes
  maxStorage: 10000000000,  // bytes
  exportsCount: 12,
  billingResetDate: '2026-01-25',
  
  dailyUsage: [
    { date: '2025-12-20', users: 5, apiCalls: 1200 },
    { date: '2025-12-21', users: 7, apiCalls: 1500 },
    // ... more days
  ],
  
  apiCallsByEndpoint: [
    { endpoint: '/pos/sales', calls: 15000 },
    { endpoint: '/inventory/products', calls: 12000 },
    // ... more endpoints
  ],
  
  featureUsage: [
    { name: 'POS System', percentage: 85, count: 4200, unit: 'transactions' },
    { name: 'Inventory', percentage: 45, count: 1200, unit: 'SKUs' },
    // ... more features
  ],
  
  posTransactions: 4200,
  posSalesAmount: 125000,
  posAvgDaily: 140,
  
  productCount: 1200,
  skuCount: 1500,
  stockMovements: 8500,
  
  totalOrders: 450,
  pendingOrders: 12,
  avgOrderValue: 277.78,
  
  loginAttempts: 2500,
  failedLogins: 8
}
```

#### Supported Chart Types

```javascript
// Usage Trend - Line chart showing daily usage
// API Calls - Bar chart by endpoint
// Feature Usage - Progress bars with percentages
```

---

### 6. **billingStyles.css** (300+ lines)

Professional, responsive styling for all billing components.

#### Features
- **Colors**: Professional blue (#007bff), success green, warning orange
- **Responsive**: Mobile-first, breakpoints at 768px and 480px
- **Components**: Cards, tables, modals, forms, buttons
- **Animations**: Smooth transitions, loading spinners, hover effects
- **Accessibility**: Clear contrasts, readable fonts, focus states

#### Key Classes

```css
/* Container */
.billing-container
.billing-header
.billing-content

/* Tabs */
.billing-tabs
.tab, .tab.active

/* Cards */
.stat-card, .stat-card.primary
.plan-card, .plan-card.selected
.payment-method-card
.metric-card

/* Tables */
.invoices-table
.invoices-table tbody tr:hover

/* Forms */
.form-group
.form-row
.expiry-inputs

/* Buttons */
.btn-primary
.btn-secondary
.btn-danger
.btn-plan

/* Modals */
.modal-overlay
.modal-content
.modal-buttons

/* Charts */
.chart-container
.chart-selector

/* Status Indicators */
.status-success
.status-warning
.status-danger
.badge
```

---

## 🚀 Integration Guide

### Step 1: Install Dependencies

```bash
npm install recharts  # For charts in UsageAnalytics
```

### Step 2: Import Components

In your routing/navigation:

```javascript
import BillingDashboard from './components/BillingDashboard';
import SubscriptionManager from './components/SubscriptionManager';
// ... etc

// In your router
<Route path="/billing" component={BillingDashboard} />
<Route path="/billing/subscription" component={SubscriptionManager} />
```

### Step 3: Update App.css

Include the billing styles:

```css
@import './styles/billingStyles.css';
```

### Step 4: API Integration

Ensure Phase 2 API endpoints are available:

```javascript
// backend/src/server.js
const billingRoutes = require('./routes/billingRoutes');

app.use('/api/billing', billingRoutes(models));
```

### Step 5: Add Protected Route

Wrap billing components in authentication:

```jsx
import PrivateRoute from './components/PrivateRoute';
import BillingDashboard from './components/BillingDashboard';

<PrivateRoute 
  path="/billing" 
  component={BillingDashboard}
  requiredLicense="starter"  // Optional: require plan tier
/>
```

---

## 🎨 UI/UX Features

### Dashboard Overview
- **Subscription Status Card** - Current plan, next billing date, status
- **Key Metrics** - Total paid, invoices count, seats used, usage progress
- **Recent Invoices** - Latest 3 invoices with quick access
- **Features List** - Included features based on plan
- **Action Buttons** - Refresh, contact support

### Subscription Manager
- **Plan Cards** - Visual comparison of all plans
- **Pricing Toggle** - Monthly/Annual with savings badge
- **Proration Info** - Transparent cost breakdown
- **Upgrade Flow** - Select plan → Review → Confirm
- **Cancel Flow** - Warning modal → Confirm → Success

### Invoice Viewer
- **Table Layout** - Sortable, filterable invoice list
- **Pagination** - 10 per page with navigation
- **Quick Actions** - Download PDF, send email
- **Detail Modal** - Line items, totals, payment status
- **Filters** - By status, sortable by date/amount

### Payment Methods
- **Card Display** - Brand logo, last 4 digits, expiration
- **Add Card Form** - Structured input fields (enhanced with Stripe Elements in production)
- **Card Actions** - Set default, delete with confirmation
- **Visual Feedback** - Success messages, error states

### Usage Analytics
- **Metric Cards** - Current usage vs limits with color-coded warnings
- **Charts** - Recharts integration for 30-day trends
- **Feature Breakdown** - Usage percentage per feature
- **Module Stats** - POS, Inventory, Orders, Users detailed metrics

---

## 🔐 Security Considerations

### Data Protection

1. **API Token Security**
   ```javascript
   // Tokens sent in Authorization header
   Authorization: Bearer {jwt_token}
   ```

2. **Card Data Handling**
   - Never send raw card numbers to backend (in production, use Stripe Elements)
   - Use Stripe Tokens/Payment Methods
   - HTTPS only
   - PCI DSS compliance

3. **CORS Configuration**
   ```javascript
   // Ensure billing API is CORS-protected
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

### Input Validation

```javascript
// Client-side validation
- Card expiry: MM/YY format, not expired
- CVC: 3-4 digits
- Amount: Numeric, positive
- Email: Valid format

// Server-side validation (backend)
- All inputs re-validated
- SQL injection prevention
- XSS protection
```

---

## 📊 Chart Configuration

### Recharts Integration

```jsx
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

// Usage Trend Chart
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={usage.dailyUsage}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="users" stroke="#8884d8" />
    <Line type="monotone" dataKey="apiCalls" stroke="#82ca9d" />
  </LineChart>
</ResponsiveContainer>
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Dashboard loads and displays all tabs
- [ ] Subscription manager shows all plans
- [ ] Plan upgrade calculates proration correctly
- [ ] Invoices load with pagination
- [ ] PDF download works
- [ ] Email send confirms
- [ ] Add payment method form validates
- [ ] Delete payment method with confirmation
- [ ] Usage charts render correctly
- [ ] Mobile view is responsive
- [ ] Error states display properly
- [ ] Loading spinners show during API calls

### Component Testing Examples

```javascript
// Example: Test BillingDashboard
import { render, screen } from '@testing-library/react';
import BillingDashboard from './BillingDashboard';

test('renders billing dashboard', async () => {
  render(<BillingDashboard />);
  expect(screen.getByText('Billing & Subscription')).toBeInTheDocument();
  
  // Wait for API call
  const subscription = await screen.findByText('Professional');
  expect(subscription).toBeInTheDocument();
});
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Desktop */
@media (min-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(4, 1fr); }
  .plans-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Tablet */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .plans-grid { grid-template-columns: repeat(2, 1fr); }
  .action-buttons { flex-direction: column; }
}

/* Mobile */
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .plans-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
```

---

## 🎓 Usage Examples

### Basic Integration

```jsx
// In your App.js
import BillingDashboard from './components/BillingDashboard';

function App() {
  return (
    <div className="app">
      <Header />
      <BillingDashboard />
      <Footer />
    </div>
  );
}
```

### With Navigation

```jsx
import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <nav>
      <Link to="/billing">Billing Dashboard</Link>
      <Link to="/billing?tab=subscription">Change Plan</Link>
      <Link to="/billing?tab=invoices">Invoices</Link>
      <Link to="/billing?tab=payment">Payment Methods</Link>
    </nav>
  );
}
```

### Conditional Rendering

```jsx
// Only show billing for paid plans
function Dashboard() {
  const { user } = useContext(AuthContext);
  
  return (
    <div>
      {user.license?.planTier !== 'freemium' && (
        <BillingDashboard />
      )}
    </div>
  );
}
```

---

## 🔧 Advanced Configuration

### Custom Plan Pricing

To change pricing, edit in SubscriptionManager.js:

```javascript
const plans = [
  {
    id: 'starter',
    monthlyPrice: 99,    // Change this
    annualPrice: 999,    // Change this
    // ...
  }
];
```

### Custom Features

Map features to display names in BillingDashboard.js:

```javascript
const formatFeatureName = (feature) => {
  const featureNames = {
    pos: 'Point of Sale',
    inventory: 'Inventory Management',
    // Add custom features here
    customFeature: 'My Custom Feature'
  };
  return featureNames[feature] || feature;
};
```

### API Endpoints Extension

To add new endpoints, follow pattern in billingRoutes.js:

```javascript
router.get('/custom-endpoint', auth, async (req, res) => {
  try {
    // Your logic
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## ❓ FAQ

### Q: How do I customize the colors?
**A**: Edit billingStyles.css and replace color values:
- Primary: #007bff (blue)
- Success: #28a745 (green)
- Danger: #dc3545 (red)

### Q: Can I add more plans?
**A**: Yes, add to plans array in SubscriptionManager.js with id, name, price, features

### Q: How do I integrate Stripe Elements for cards?
**A**: Install @stripe/react-stripe-js and replace the card form in PaymentMethodManager.js

### Q: How do I test with mock data?
**A**: Mock the API in services/api.js or use MSW (Mock Service Worker)

### Q: Can I modify the dashboard tabs?
**A**: Yes, edit billingTabs in BillingDashboard.js and add new tab panels

---

## 📈 Performance Optimization

### Image Optimization
- Use SVG icons instead of PNGs
- Lazy load charts only when tab is active

### API Optimization
- Implement pagination (already done)
- Cache dashboard data with 5-minute TTL
- Use React.memo for expensive components

### Bundle Size
- Tree-shake unused Recharts components
- Code-split billing routes

```javascript
const BillingDashboard = React.lazy(() => 
  import('./components/BillingDashboard')
);
```

---

## 🚀 Deployment

### Prerequisites
- React 16.8+ (hooks support)
- Node.js 12+
- Phase 2 API running

### Production Checklist

- [ ] API endpoints tested with production data
- [ ] Error handling for failed API calls
- [ ] Loading states show proper spinners
- [ ] Empty states display correctly
- [ ] Responsive design tested on devices
- [ ] Accessibility review (a11y)
- [ ] Security audit (no hardcoded secrets)
- [ ] Performance testing (Core Web Vitals)
- [ ] Browser compatibility (Chrome, Safari, Firefox, Edge)

---

## 📞 Support

### Common Issues

**"Cannot read property 'planTier' of undefined"**
- Check if dashboard API is returning data
- Verify /api/billing/dashboard endpoint works

**"Charts not rendering"**
- Ensure recharts is installed: `npm install recharts`
- Check browser console for errors

**"API 401 Unauthorized"**
- Verify JWT token is in Authorization header
- Check token expiration

**"Modal won't close"**
- Check z-index of modal-overlay (.modal-overlay { z-index: 1000; })

---

## 📋 Deployment Checklist

- [ ] All components created (5 files)
- [ ] Styles imported and applied
- [ ] API endpoints integrated
- [ ] Error handling implemented
- [ ] Loading states working
- [ ] Mobile responsive tested
- [ ] Security review complete
- [ ] Performance optimized
- [ ] Documentation created
- [ ] Ready for production

---

**Version**: 1.0  
**Last Updated**: December 2025  
**Status**: Ready for Integration
