@echo off
REM Retail Store ERP - Local Development Setup

echo 🚀 Setting up Retail Store ERP...

REM Backend Setup
echo 📦 Setting up Backend...
cd backend
call npm install
copy .env.development .env
cd ..
echo ✅ Backend setup complete

REM Frontend Setup
cd frontend
echo 📦 Setting up Frontend...
call npm install
cd ..
echo ✅ Frontend setup complete

echo.
echo 🎉 Setup complete!
echo.
echo To start development:
echo   Backend:  cd backend ^&^& npm run dev
echo   Frontend: cd frontend ^&^& npm start
echo.
echo Or use Docker:
echo   docker-compose up -d
