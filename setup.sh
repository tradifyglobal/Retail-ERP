#!/bin/bash

# Retail Store ERP - Local Development Setup

echo "🚀 Setting up Retail Store ERP..."

# Backend Setup
echo "📦 Setting up Backend..."
cd backend
npm install
cp .env.development .env
echo "✅ Backend setup complete"

# Frontend Setup
cd ../frontend
echo "📦 Setting up Frontend..."
npm install
echo "✅ Frontend setup complete"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm start"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
