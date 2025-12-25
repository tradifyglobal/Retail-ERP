# Shopify Integration Guide

**Status**: Separate Optional Module  
**Phase**: Integration Module (Can be deployed alongside Phase 1 & 2)  
**Version**: 1.0  
**Last Updated**: December 2025

---

## 🎯 Overview

The **Shopify Integration Module** is an optional, standalone system that allows ERP customers who use Shopify storefronts to automatically synchronize orders and create licenses.

### Key Features
- ✅ **Optional Per-Customer**: Not required for core functionality
- ✅ **Modular**: No changes to existing Stripe billing system
- ✅ **Automatic License Sync**: Orders → Licenses (no manual intervention)
- ✅ **Customer Sync**: Shopify customers synced to your ERP database
- ✅ **Webhook Verification**: Cryptographic signature verification for security
- ✅ **OAuth 2.0**: Secure app installation flow
- ✅ **Order Fulfillment Tracking**: Know when orders ship
- ✅ **Multi-Shop Support**: Handle multiple Shopify stores

### Architecture
```
Shopify Store → Webhooks → Your ERP → License Creation
                ↓
          Stripe Billing (Optional)
```

---

## 📦 Files Created

### 1. **`backend/src/services/shopifyService.js`** (600+ lines)

Core Shopify API client and business logic.

#### Key Methods

```javascript
// OAuth & Setup
handleOAuthCallback(shop, code)           // Install app
registerWebhooks(shop, accessToken)       // Register for events
getShopInfo(shop, accessToken)            // Fetch shop details

// Order Processing
processOrder(shop, order)                  // Create licenses from order
syncCustomer(shop, shopifyCustomer)       // Sync customer data
getCustomerOrders(shop, token, customerId) // Fetch order history

// Integration Management
getIntegrationStatus(shop)                // Check if active
handleAppUninstall(shop)                  // Cleanup on removal

// Advanced Operations
createRefund(shop, token, orderId, reason) // Trigger refund
verifyWebhookSignature(req)               // Security check
```

#### Usage Example

```javascript
const ShopifyService = require('./services/shopifyService');
const shopifyService = new ShopifyService(models);

// Process incoming order
const result = await shopifyService.processOrder('myshop.myshopify.com', {
  id: '12345',
  email: 'customer@example.com',
  line_items: [
    {
      sku: 'PRO_MONTHLY',
      title: 'Professional Plan',
      price: 299
    }
  ]
});

console.log(result);
// {
//   success: true,
//   customerId: 'abc-123',
//   licensesCreated: 1,
//   licenses: [
//     {
//       customerId: 'abc-123',
//       licenseKey: 'SHOP-1703...',
//       licenseType: 'professional'
//     }
//   ]
// }
```

---

### 2. **`backend/src/controllers/shopifyWebhookController.js`** (400+ lines)

Handles incoming Shopify events and routes them appropriately.

#### Webhook Events Handled

| Event | Handler | Action |
|-------|---------|--------|
| `orders/created` | `_handleOrderCreated()` | Create licenses, send email |
| `orders/fulfilled` | `_handleOrderFulfilled()` | Confirm delivery, send notification |
| `customers/create` | `_handleCustomerCreated()` | Sync customer to database |
| `app/uninstalled` | `_handleAppUninstalled()` | Deactivate integration, cleanup |

#### Methods

```javascript
// Main handler - routes based on topic
handleWebhook(req, res)

// OAuth callback - handles installation
handleOAuthCallback(req, res)

// Check if shop is integrated
getIntegrationStatus(req, res)

// Get customer's integration (authenticated)
getShopIntegration(req, res)

// Disconnect integration
disconnectIntegration(req, res)
```

---

### 3. **`backend/src/routes/shopifyRoutes.js`** (70 lines)

REST API routes for Shopify integration.

#### Public Routes (No Auth Required)

```javascript
POST   /api/webhooks/shopify                 // Receive webhooks
GET    /api/shopify/oauth/callback           // OAuth redirect
GET    /api/shopify/integration/status       // Check if integrated
```

#### Authenticated Routes (Requires JWT)

```javascript
GET    /api/shopify/integration              // Get current integration
POST   /api/shopify/integration/disconnect   // Remove integration
```

---

### 4. **`backend/src/models/ShopifyIntegration.js`** (100+ lines)

Database model for tracking Shopify integrations.

#### Fields

```javascript
{
  id: UUID,                          // Unique identifier
  shopUrl: string,                   // Domain (example.myshopify.com)
  accessToken: string,               // OAuth token (encrypt in production!)
  scopes: JSON,                      // Granted permissions
  isActive: boolean,                 // Integration active?
  webhooksConfigured: boolean,       // Webhooks registered?
  
  // Sync statistics
  totalOrdersProcessed: number,      // Orders synced
  totalCustomersSynced: number,      // Customers synced
  totalLicensesCreated: number,      // Licenses created
  lastSyncedAt: datetime,            // Last sync time
  
  // Shop info (cached)
  shopName: string,
  shopEmail: string,
  shopPlan: string,                  // Shopify plan (Basic, Shopify, Advanced, Plus)
  timezone: string,
  currency: string,
  
  // Configuration
  config: JSON,                      // {autoActivateLicenses, emailNotifications, ...}
  
  // Error tracking
  lastError: text,
  lastErrorAt: datetime,
  
  timestamps: true                   // createdAt, updatedAt
}
```

---

## 🚀 Setup Instructions

### Step 1: Create Shopify App

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Create new app:
   - **App name**: "Retail ERP" (or your brand)
   - **App URL**: `https://yourdomain.com`
   - **Redirect URI**: `https://yourdomain.com/api/shopify/oauth/callback`

3. Configure API scopes (minimal permissions):
   ```
   read_orders              // Read customer orders
   read_customers           // Read customer data
   write_customers          // Create/update customers
   read_products            // Read products (optional)
   read_inventory           // Track inventory (optional)
   ```

4. Copy credentials:
   - **Client ID**: `SHOPIFY_CLIENT_ID`
   - **Client Secret**: `SHOPIFY_CLIENT_SECRET`

### Step 2: Set Environment Variables

```bash
# .env
SHOPIFY_CLIENT_ID=your_client_id
SHOPIFY_CLIENT_SECRET=your_client_secret
SHOPIFY_API_SECRET=your_api_secret  # For webhook verification

# Needed by shopifyService
API_BASE_URL=https://yourdomain.com
APP_URL=https://yourdomain.com
```

### Step 3: Register Shopify Routes

In `backend/src/server.js`:

```javascript
const shopifyRoutes = require('./routes/shopifyRoutes');

// Add ShopifyIntegration model first
const ShopifyIntegration = require('./models/ShopifyIntegration')(sequelize);

// Register routes
app.use('/api/shopify', shopifyRoutes(models));

// Webhook receiver (must accept raw body for signature verification)
app.post('/api/webhooks/shopify', (req, res) => {
  // Shopify sends signature in header x-shopify-hmac-sha256
  // ShopifyWebhookController will verify it
});
```

### Step 4: Create Database Table

```sql
-- Or use Sequelize migration
CREATE TABLE "ShopifyIntegrations" (
  "id" UUID PRIMARY KEY,
  "shopUrl" VARCHAR UNIQUE NOT NULL,
  "accessToken" TEXT NOT NULL,
  "scopes" JSONB DEFAULT '[]',
  "isActive" BOOLEAN DEFAULT true,
  "webhooksConfigured" BOOLEAN DEFAULT false,
  "totalOrdersProcessed" INTEGER DEFAULT 0,
  "totalCustomersSynced" INTEGER DEFAULT 0,
  "totalLicensesCreated" INTEGER DEFAULT 0,
  "lastSyncedAt" TIMESTAMP,
  "shopName" VARCHAR,
  "shopEmail" VARCHAR,
  "shopPlan" VARCHAR,
  "timezone" VARCHAR,
  "currency" VARCHAR DEFAULT 'USD',
  "config" JSONB DEFAULT '{}',
  "lastError" TEXT,
  "lastErrorAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  INDEX "idx_shopUrl" ("shopUrl"),
  INDEX "idx_isActive" ("isActive")
);
```

### Step 5: Configure Webhook Receiver

Shopify needs to verify your webhook endpoint is real:

1. In Shopify Partner Dashboard → App → Configuration
2. Add **Webhook Subscriptions**:
   - `orders/created` → `https://yourdomain.com/api/webhooks/shopify`
   - `orders/fulfilled` → `https://yourdomain.com/api/webhooks/shopify`
   - `customers/create` → `https://yourdomain.com/api/webhooks/shopify`
   - `app/uninstalled` → `https://yourdomain.com/api/webhooks/shopify`

3. Test webhook delivery in dashboard

---

## 🔄 OAuth Flow

### Step 1: Customer Clicks "Install App"

```
Customer in Shopify Admin
→ App Store → "Install Retail ERP"
→ Shopify redirects to: YOUR_APP_URL/oauth/callback?code=...&shop=...
```

### Step 2: Your App Handles Callback

```javascript
// shopifyWebhookController.handleOAuthCallback(req, res)

GET /api/shopify/oauth/callback?code=abc123&shop=myshop.myshopify.com

// Steps:
1. Verify shop domain format
2. Exchange code for access token
3. Save integration to database
4. Register webhooks
5. Return success
```

### Step 3: Webhooks Start Flowing

```
orders/created webhook
→ POST /api/webhooks/shopify
→ Verify signature
→ Create license
→ Send email
```

---

## 🧪 Testing

### Test with Shopify Development Store

1. Create free test store: [partners.shopify.com](https://partners.shopify.com)
2. Create test order:
   - Go to Admin → Orders
   - Create test order
   - Use test product (SKU: `PRO_MONTHLY`)

3. Check your webhook receiver:
   ```bash
   # Watch logs
   tail -f logs/server.log | grep -i "shopify"
   ```

4. Verify license was created:
   ```sql
   SELECT * FROM "Licenses" WHERE "shopifyOrderId" = 'test-order-123';
   ```

### Test Webhooks Locally

Use Shopify CLI (recommended):

```bash
npm install -g @shopify/cli
shopify app dev
```

Or use webhook testing tool:

```bash
# Using ngrok to tunnel local server
ngrok http 3000
# Then use ngrok URL in Shopify webhook settings
```

### Test Webhook Signature Verification

```bash
curl -X POST http://localhost:3000/api/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-SHA256: fake-signature" \
  -d '{
    "id": 123,
    "email": "test@example.com",
    "line_items": [{
      "sku": "PRO_MONTHLY",
      "title": "Professional",
      "price": 299
    }]
  }'

# Should return 401 "Webhook verification failed"
```

---

## 📊 Pricing Model Mapping

Map Shopify products to your license tiers:

```javascript
// In shopifyService._mapProductToLicenseType()

SKU Pattern → License Type → Price
─────────────────────────────────
STARTER_*    → starter      → $99/month
PRO_*        → professional → $299/month
ENTERPRISE_* → enterprise   → $599/month
FREE_*       → freemium     → $0
```

**Example Shopify Product Setup**:

| Product Name | SKU | Price | License |
|---|---|---|---|
| Basic Plan | STARTER_MONTHLY | $99 | starter |
| Professional Plan | PRO_MONTHLY | $299 | professional |
| Enterprise Plan | ENTERPRISE_ANNUAL | $5,999 | enterprise |

---

## 🔐 Security Considerations

### 1. Access Token Encryption

In production, **encrypt** the `accessToken` field:

```javascript
// Use encryption at rest
const crypto = require('crypto');

// On save
const encrypted = crypto
  .createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY)
  .update(accessToken, 'utf8', 'hex');

// On retrieve
const decrypted = crypto
  .createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY)
  .update(encrypted, 'hex', 'utf8');
```

### 2. Webhook Signature Verification

Always verify:

```javascript
// This is already implemented in shopifyService.verifyWebhookSignature()
const hmac = req.headers['x-shopify-hmac-sha256'];
const verified = crypto
  .createHmac('sha256', API_SECRET)
  .update(req.rawBody)
  .digest('base64') === hmac;
```

### 3. Rate Limiting

Shopify allows 2 requests/second. Implement queue:

```javascript
// Use Bull or similar job queue
const jobQueue = require('bull')('shopify-sync');
jobQueue.add({ task: 'processOrder' }, { rate: { max: 2, duration: 1000 } });
```

### 4. Scope Minimization

Only request scopes you need:
- ✅ `read_orders` (essential)
- ✅ `read_customers` (essential)
- ❌ `write_orders` (not needed)
- ❌ `delete_customers` (not needed)

---

## 🔧 Integration with Existing Systems

### With Licensing System (Phase 1)

```
Shopify Order
→ Create License (existing licensing system)
→ License becomes active
→ User downloads with license key
```

### With Billing System (Phase 2)

Two options:

**Option A: Shopify = Only Storefront**
```
Shopify: Order → Payment ✓
Your ERP: License activation only
Billing stays with Shopify
```

**Option B: Dual Billing**
```
Shopify: Order → Payment
Your ERP: Additional paid features (via Stripe)
Recurring billing = two systems
```

### With Customer Portal (Phase 3)

```
Customer logs in
→ See licenses from both sources
  - Shopify orders → Licenses
  - Direct purchases → Licenses
→ Manage all in one dashboard
```

---

## 📈 Monitoring & Analytics

Track integration health:

```javascript
// Query sync statistics
SELECT 
  "shopUrl",
  "totalOrdersProcessed",
  "totalLicensesCreated",
  "lastSyncedAt",
  "lastError",
  "isActive"
FROM "ShopifyIntegrations"
WHERE "isActive" = true;
```

Monitor errors:

```javascript
// Get failed integrations
SELECT * FROM "ShopifyIntegrations"
WHERE "lastError" IS NOT NULL
ORDER BY "lastErrorAt" DESC;
```

---

## ❓ FAQ

### Q: Can I use both Stripe and Shopify billing?
**A**: Yes! Customers can either:
- Use Shopify for everything (no Stripe needed)
- Use Shopify for products + Stripe for add-ons
- Use both independently

### Q: What happens if the app is uninstalled?
**A**: The `app/uninstalled` webhook:
1. Sets `isActive = false`
2. Integration is deactivated
3. No more syncing
4. Customer can reinstall anytime

### Q: How do I handle refunds?
**A**: When license is revoked, you can:
```javascript
// Trigger refund in Shopify
await shopifyService.createRefund(
  shop,
  accessToken,
  orderId,
  'License revocation'
);
```

### Q: Can I sync historical orders?
**A**: Not yet - webhooks only sync new orders. To backfill:

```javascript
// Manual sync endpoint (admin only)
POST /api/admin/shopify/sync-orders
{
  "shop": "myshop.myshopify.com",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Q: How do I test without a real Shopify store?
**A**: Use Shopify Development Store:
1. Free test store from Partner Dashboard
2. Create test products with SKUs
3. Create test orders to trigger webhooks

---

## 🚀 Deployment

### Prerequisites
- Node.js 14+
- PostgreSQL 12+
- Environment variables configured
- SSL certificate (for webhooks)

### Deploy Steps

1. **Install dependencies**:
   ```bash
   npm install shopify-api
   ```

2. **Run migrations**:
   ```bash
   npm run migrate
   ```

3. **Start server**:
   ```bash
   npm start
   ```

4. **Verify webhooks**:
   ```bash
   # Check Shopify Partner Dashboard
   # Should show "Delivery successful" for recent webhooks
   ```

---

## 📞 Support

### Common Issues

**"Webhook verification failed"**
- Check `SHOPIFY_API_SECRET` is correct
- Ensure raw body is sent (not parsed JSON)

**"Invalid shop domain"**
- Shop must be: `*.myshopify.com`
- Check spelling

**"Token expired"**
- Access tokens don't expire, but can be revoked
- If revoked, reinstall app

### Debugging

Enable debug logging:

```javascript
// In server.js
if (process.env.DEBUG_SHOPIFY) {
  shopifyService.debug = true; // Logs all API calls
}
```

---

## 📋 Deployment Checklist

- [ ] Environment variables set
- [ ] Database table created
- [ ] Shopify app registered
- [ ] OAuth redirect URI configured
- [ ] Webhook endpoints registered
- [ ] SSL certificate installed
- [ ] Signature verification working
- [ ] Test order processed successfully
- [ ] License created with correct type
- [ ] Email sent to customer
- [ ] Error handling tested
- [ ] Logs review completed

---

## 🎓 Next Steps

After deploying Shopify integration:

1. **Monitor**: Watch webhook logs for first 24 hours
2. **Test**: Create sample orders, verify licenses
3. **Document**: Add shop-specific integration notes
4. **Promote**: Tell customers they can use Shopify
5. **Phase 3**: Integrate with Customer Portal UI

---

**Version**: 1.0  
**Last Updated**: December 2025  
**Status**: Ready for Production
