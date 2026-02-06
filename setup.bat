@echo off
echo Setting up Team Task Manager Project...
echo.

echo Step 1: Initializing project...
npm init -y
echo.

echo Step 2: Installing dependencies...
npm install express mongoose bcryptjs jsonwebtoken dotenv express-rate-limit express-validator cors helmet redis bull bull-board swagger-ui-express swagger-jsdoc winston multer express-async-errors node-cron
echo.

echo Step 3: Installing dev dependencies...
npm install -D nodemon jest supertest
echo.

echo Step 4: Creating folder structure...
mkdir src 2>nul
mkdir src\config 2>nul
mkdir src\middleware 2>nul
mkdir src\models 2>nul
mkdir src\controllers 2>nul
mkdir src\routes 2>nul
mkdir src\services 2>nul
mkdir src\jobs 2>nul
mkdir src\utils 2>nul
echo.

echo Step 5: Creating essential files...
type nul > src\app.js
type nul > src\server.js
type nul > .env
type nul > .env.example
type nul > .gitignore
type nul > README.md
echo.

echo Step 6: Creating .gitignore...
echo node_modules/ > .gitignore
echo .env >> .gitignore
echo logs/ >> .gitignore
echo *.log >> .gitignore
echo .DS_Store >> .gitignore
echo coverage/ >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
echo.

echo Step 7: Creating .env.example...
echo NODE_ENV=development > .env.example
echo PORT=5000 >> .env.example
echo. >> .env.example
echo # MongoDB >> .env.example
echo MONGODB_URI=mongodb://localhost:27017/team_task_manager >> .env.example
echo. >> .env.example
echo # JWT >> .env.example
echo JWT_SECRET=your_super_secret_jwt_key_change_in_production >> .env.example
echo JWT_EXPIRE=7d >> .env.example
echo. >> .env.example
echo # Redis >> .env.example
echo REDIS_HOST=localhost >> .env.example
echo REDIS_PORT=6379 >> .env.example
echo REDIS_PASSWORD= >> .env.example
echo. >> .env.example
echo # Rate Limiting >> .env.example
echo RATE_LIMIT_WINDOW_MS=900000 >> .env.example
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env.example
echo.

echo Step 8: Copying .env...
copy .env.example .env >nul
echo.

echo Setup complete! 🎉
echo.
echo Next steps:
echo 1. Edit .env file with your configurations
echo 2. Start MongoDB and Redis services
echo 3. Run: npm run dev
echo 4. Open: http://localhost:5000/api-docs
pause