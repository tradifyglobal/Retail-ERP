# Retail Store ERP System

A comprehensive retail store ERP system built with Node.js, React, and PostgreSQL. Designed for retail stores, grocery stores, garment shops, and other retail businesses.

## Features

- **Point of Sale (POS)**: Real-time transaction processing with multiple payment methods
- **Inventory Management**: Track products, stock levels, and categories
- **Order Management**: Online order processing and tracking
- **Multi-Language Support**: English and French
- **Branding Management**: Customizable colors, logos, and company information
- **Role-Based Access Control**: Admin, Manager, Cashier, and Customer roles
- **Multi-Environment Support**: Development, UAT, Staging, and Production
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Reports & Analytics**: Sales reports, revenue analysis, and transaction history
- **User Management**: Create and manage user accounts with different roles

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **ORM**: Sequelize

### Frontend
- **Framework**: React 18
- **State Management**: Zustand
- **Routing**: React Router v6
- **Internationalization**: i18next
- **Styling**: Tailwind CSS
- **UI Components**: React Icons, Recharts

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── config/
│   ├── package.json
│   └── .env.*
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── i18n/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
├── database/
│   ├── migrations/
│   └── seeders/
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml
└── docs/
```

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Docker (optional)

### Local Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd retail-erp
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.development .env
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000/api npm start
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

## Environment Configuration

### Development
```bash
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=retail_erp_dev
DB_USER=postgres
DB_PASSWORD=postgres
```

### UAT/Staging/Production
Configure using respective `.env.uat`, `.env.staging`, and `.env.production` files.

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token

### Inventory
- `GET /api/inventory` - Get all products
- `POST /api/inventory` - Create product
- `PUT /api/inventory/:id` - Update product
- `DELETE /api/inventory/:id` - Delete product

### POS (Sales)
- `GET /api/pos` - Get all sales
- `POST /api/pos` - Create sale

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status

### Branding
- `GET /api/branding/:storeId` - Get branding
- `POST /api/branding/:storeId` - Update branding

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/orders` - Orders report

## Database Schema

### Users
- id, email, password, firstName, lastName, role, phone, avatar, storeId, isActive, lastLogin

### Stores
- id, name, code, phone, email, address, storeType, isActive

### Products
- id, storeId, sku, name, category, barcode, costPrice, sellingPrice, tax, quantity, unit, image

### Sales
- id, storeId, invoiceNumber, cashierId, customerId, subtotal, tax, discount, totalAmount, paymentMethod, items

### Orders
- id, storeId, orderNumber, customerEmail, customerName, deliveryAddress, totalAmount, status, items

### Branding
- id, storeId, companyName, logo, primaryColor, secondaryColor, socialMedia

## Deployment

### GitHub Deployment
1. Push to main branch
2. GitHub Actions automatically builds and tests
3. Deploy using your preferred CI/CD platform

### Manual Deployment
```bash
# Using Docker
docker-compose -f docker-compose.yml up -d

# Using PM2
cd backend && pm2 start src/server.js --name "retail-erp-api"
```

## Multi-Language Support

Currently supported:
- English (en)
- French (fr)

Add more languages by creating translation files in `frontend/src/i18n/`

## Mobile Responsive Design

The application is fully responsive and works on:
- Desktop (1920px and above)
- Tablet (768px to 1024px)
- Mobile (320px to 767px)

## Role-Based Access

### Admin
- Full system access
- User management
- Branding configuration

### Manager
- Inventory management
- Sales management
- Reports

### Cashier
- POS access
- Product lookup
- Sales transactions

### Customer
- View orders
- Online shopping

## Future Enhancements

- [ ] Website integration for online ordering
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Advanced analytics and reporting
- [ ] Barcode scanning
- [ ] Employee scheduling
- [ ] Customer loyalty program
- [ ] Multi-store management
- [ ] Accounting integration
- [ ] Mobile app (React Native)

## Security

- JWT authentication
- Password hashing with bcryptjs
- Environment-based configuration
- CORS enabled
- Input validation
- Role-based access control

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please create an issue in the GitHub repository.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**Version**: 1.0.0  
**Last Updated**: December 2024
