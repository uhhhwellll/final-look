const { Product, Category } = require('../models');
const { Op } = require('sequelize');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const { category, search, minPrice, maxPrice, brand } = req.query;
      const where = { isActive: true };

      if (category) {
        where.CategoryId = category;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { brand: { [Op.like]: `%${search}%` } }
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = minPrice;
        if (maxPrice) where.price[Op.lte] = maxPrice;
      }

      if (brand) {
        where.brand = brand;
      }

      const products = await Product.findAll({
        where,
        include: [Category],
        order: [['createdAt', 'DESC']]
      });

      res.json({ products });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [
          { model: Category },
          { 
            model: User, 
            as: 'Seller',
            attributes: ['id', 'username', 'sellerCity', 'sellerCountry', 'sellerRating', 'isVerifiedSeller', 'totalSales']
          }
        ]
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const product = await Product.create(req.body);
      res.status(201).json({ product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await Product.findByPk(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await product.update(req.body);
      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const product = await Product.findByPk(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await product.destroy();
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();