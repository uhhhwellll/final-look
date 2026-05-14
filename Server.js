const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes AFTER models are loaded
let authRoutes, productRoutes, cartRoutes, orderRoutes, reviewRoutes, sellerRoutes;

try {
  const { sequelize } = require('./models');
  
  // Initialize database and start server
  async function startServer() {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully.');
      
      // Sync models - create tables if they don't exist
      // NEVER use force: true in production
      await sequelize.sync({ force: false });
      console.log('✅ Database synced successfully.');
      
      // Load routes after database is ready
      authRoutes = require('./routes/authRoutes');
      productRoutes = require('./routes/productRoutes');
      cartRoutes = require('./routes/cartRoutes');
      orderRoutes = require('./routes/orderRoutes');
      reviewRoutes = require('./routes/reviewRoutes');
      sellerRoutes = require('./routes/sellerRoutes');
      
      // API Routes
      app.use('/api/auth', authRoutes);
      app.use('/api/products', productRoutes);
      app.use('/api/cart', cartRoutes);
      app.use('/api/orders', orderRoutes);
      app.use('/api/reviews', reviewRoutes);
      app.use('/api/seller', sellerRoutes);
      
      console.log('✅ Routes loaded successfully.');
      
      // ==================== FRONTEND ROUTES ====================
      
      // Home page
      app.get('/', (req, res) => {
        res.render('index');
      });

      // Authentication pages
      app.get('/login', (req, res) => {
        if (req.cookies && req.cookies.token) {
          return res.redirect('/products');
        }
        res.render('auth/login');
      });

      app.get('/register', (req, res) => {
        if (req.cookies && req.cookies.token) {
          return res.redirect('/products');
        }
        res.render('auth/register');
      });

      // Product pages
      app.get('/products', (req, res) => {
        res.render('products/index');
      });

      app.get('/products/:id', (req, res) => {
        res.render('products/details', { productId: req.params.id });
      });

      // Cart page
      app.get('/cart', (req, res) => {
        res.render('cart/index');
      });

      // Orders page
      app.get('/orders', (req, res) => {
        res.render('orders/index');
      });

      // User profile page
      app.get('/profile', (req, res) => {
        if (!req.cookies || !req.cookies.token) {
          return res.redirect('/login');
        }
        res.render('profile');
      });

      // Reviews page
      app.get('/my-reviews', (req, res) => {
        if (!req.cookies || !req.cookies.token) {
          return res.redirect('/login');
        }
        res.render('reviews/my-reviews');
      });

      // Seller dashboard
      app.get('/seller/dashboard', (req, res) => {
        if (!req.cookies || !req.cookies.token) {
          return res.redirect('/login');
        }
        res.render('seller/dashboard');
      });

      // ==================== ERROR HANDLING ====================
      
      // 404 handler
      app.use((req, res, next) => {
        res.status(404).render('404', { 
          url: req.originalUrl 
        });
      });

      // Error handling middleware
      app.use((err, req, res, next) => {
        console.error('Error:', err.message);
        console.error('Stack:', err.stack);
        
        // Handle specific error types
        if (err.name === 'SequelizeValidationError') {
          return res.status(400).json({
            error: 'Validation Error',
            details: err.errors.map(e => e.message)
          });
        }

        if (err.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
            error: 'Duplicate Entry',
            details: 'This record already exists'
          });
        }

        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            error: 'Invalid token'
          });
        }

        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: 'Token expired'
          });
        }

        // Default error response
        res.status(err.status || 500).json({
          error: err.message || 'Internal Server Error',
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
      });

      // ==================== START SERVER ====================
      
      app.listen(PORT, () => {
        console.log('================================');
        console.log(`✅ Server is running on http://localhost:${PORT}`);
        console.log(`📱 Products: http://localhost:${PORT}/products`);
        console.log(`🔑 Login: http://localhost:${PORT}/login`);
        console.log(`📊 Seller Dashboard: http://localhost:${PORT}/seller/dashboard`);
        console.log('================================');
        console.log('\n📋 Test Accounts:');
        console.log('  Admin: admin@electronics.com / admin123');
        console.log('  User:  john@example.com / user123');
        console.log('================================\n');
      });
      
    } catch (error) {
      console.error('❌ Unable to start server:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    }
  }

  startServer();
  
} catch (error) {
  console.error('❌ Failed to load models:', error.message);
  process.exit(1);
}

module.exports = app;