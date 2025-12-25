# Retail Store ERP - Setup Guide

## Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
# Database: localhost:5432
```

### Option 2: Local Development

#### Windows
```bash
setup.bat
```

#### macOS/Linux
```bash
chmod +x setup.sh
./setup.sh
```

#### Manual Setup
1. Backend
```bash
cd backend
npm install
cp .env.development .env
npm run dev
```

2. Frontend (in a new terminal)
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

## Database Setup

### PostgreSQL Connection
```
Host: localhost
Port: 5432
Database: retail_erp_dev
User: postgres
Password: postgres
```

### Run Migrations
```bash
cd backend
npm run migrate
npm run seed
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Manager | manager@example.com | password123 |
| Cashier | cashier@example.com | password123 |

## Environment Setup

### Development (.env.development)
- Local database
- Debug logging enabled
- CORS: http://localhost:3000

### UAT (.env.uat)
- Staging database
- Standard logging
- Update database credentials

### Staging (.env.staging)
- Staging database
- Minimal logging
- Update database credentials

### Production (.env.production)
- Production database
- Error logging only
- Strong JWT secret
- Update all credentials

## Troubleshooting

### Database Connection Error
1. Ensure PostgreSQL is running
2. Check database credentials in .env
3. Verify database exists

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Features to Test

1. **Login**
   - Navigate to http://localhost:3000
   - Login with admin credentials

2. **POS System**
   - Go to POS page
   - Add products to cart
   - Complete a transaction

3. **Inventory**
   - Add new products
   - Update stock levels
   - View product list

4. **Orders**
   - Create online orders
   - Update order status
   - View order history

5. **Branding**
   - Customize colors
   - Upload logo
   - Update company info

6. **Multi-Language**
   - Switch between English and French
   - Verify all labels are translated

## API Testing

Use Postman or similar tool:

### Login
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "admin@example.com",
  "password": "password123"
}
```

### Get Products
```
GET http://localhost:5000/api/inventory
Headers: Authorization: Bearer <token>
```

## Performance Tips

1. Enable caching in production
2. Optimize database queries
3. Use CDN for static assets
4. Enable compression in Express
5. Monitor database connections

## Security Checklist

- [ ] Change default credentials
- [ ] Update JWT secret
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Enable input validation
- [ ] Implement rate limiting
- [ ] Set up logging and monitoring
- [ ] Regular security audits

## Next Steps

1. Configure your store information
2. Set up product catalog
3. Create user accounts
4. Customize branding
5. Test all modules
6. Deploy to production

## Support

For detailed documentation, see README.md
