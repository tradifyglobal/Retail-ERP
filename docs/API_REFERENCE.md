# API Endpoints Reference

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.example.com/api`

## Authentication

### Login
```
POST /auth/login
Body: { email, password }
Response: { success, token, user }
```

### Register
```
POST /auth/register
Body: { email, password, firstName, lastName, storeId }
Response: { success, message, user }
```

### Verify Token
```
GET /auth/verify
Headers: Authorization: Bearer {token}
Response: { success, user }
```

## Users

### Get All Users
```
GET /users
Headers: Authorization: Bearer {token}
Response: { success, data: [] }
```

### Get User by ID
```
GET /users/{id}
Headers: Authorization: Bearer {token}
Response: { success, data: {} }
```

### Update User
```
PUT /users/{id}
Headers: Authorization: Bearer {token}
Body: { firstName, lastName, phone, role, isActive }
Response: { success, message, data }
```

### Delete User
```
DELETE /users/{id}
Headers: Authorization: Bearer {token}
Response: { success, message }
```

## Inventory

### Get All Products
```
GET /inventory
Headers: Authorization: Bearer {token}
Response: { success, data: [] }
```

### Create Product
```
POST /inventory
Headers: Authorization: Bearer {token}
Body: { sku, name, category, costPrice, sellingPrice, tax }
Response: { success, message, data }
```

### Update Product
```
PUT /inventory/{id}
Headers: Authorization: Bearer {token}
Body: { name, category, sellingPrice, quantity, ... }
Response: { success, message, data }
```

### Delete Product
```
DELETE /inventory/{id}
Headers: Authorization: Bearer {token}
Response: { success, message }
```

## POS (Sales)

### Get All Sales
```
GET /pos
Headers: Authorization: Bearer {token}
Response: { success, data: [] }
```

### Create Sale
```
POST /pos
Headers: Authorization: Bearer {token}
Body: {
  invoiceNumber,
  customerId (optional),
  items: [{ productId, quantity }],
  paymentMethod,
  totalAmount,
  discount (optional)
}
Response: { success, message, data }
```

## Orders (Online)

### Get All Orders
```
GET /orders
Headers: Authorization: Bearer {token}
Response: { success, data: [] }
```

### Create Order
```
POST /orders
Body: {
  storeId,
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  deliveryAddress,
  items: [{ productId, quantity, price }],
  totalAmount
}
Response: { success, message, data }
```

### Update Order Status
```
PUT /orders/{id}/status
Headers: Authorization: Bearer {token}
Body: { status: 'pending|confirmed|processing|shipped|delivered|cancelled' }
Response: { success, message, data }
```

## Branding

### Get Branding
```
GET /branding/{storeId}
Response: { success, data }
```

### Update Branding
```
POST /branding/{storeId}
Headers: Authorization: Bearer {token}
Body: {
  companyName,
  tagline,
  logo,
  primaryColor,
  secondaryColor,
  accentColor
}
Response: { success, message, data }
```

## Reports

### Sales Report
```
GET /reports/sales?startDate=&endDate=
Headers: Authorization: Bearer {token}
Response: { success, data: { totalSales, totalRevenue, totalTax, sales } }
```

### Orders Report
```
GET /reports/orders?status=completed
Headers: Authorization: Bearer {token}
Response: { success, data: { totalOrders, orders } }
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": {} (optional)
}
```
