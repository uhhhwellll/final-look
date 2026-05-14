const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { auth, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getProductById);

// Admin routes
router.post('/', auth, isAdmin, ProductController.createProduct);
router.put('/:id', auth, isAdmin, ProductController.updateProduct);
router.delete('/:id', auth, isAdmin, ProductController.deleteProduct);

module.exports = router;