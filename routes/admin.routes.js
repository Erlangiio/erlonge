const express = require('express');
const router = express.Router();
const { checkToken } = require('../middleware/auth');


const brandController = require('../controllers/brand.controller');
const categoryController = require('../controllers/category.controller');

const reviewController = require('../controllers/review.controller');
const productController = require('../controllers/product.controller');
const authController = require('../controllers/auth.controller');
const orderController = require('../controllers/order.controller');
const inventoryController = require('../controllers/inventory.controller');
const adsController = require('../controllers/ads.controller');
const listController = require('../controllers/list.controller');



// Auth
router.post('/login', authController.login);
router.get('/dashboard', checkToken, authController.dashboard);
router.get('/users', checkToken, authController.getAllAdmins);
router.post('/users', checkToken, authController.createAdmin);
router.put('/users/:id', checkToken, authController.updateAdmin);
router.delete('/users/:id', checkToken, authController.deleteAdmin);


router.get('/export/:slug', authController.exportData);


// Brands CRUD
router.get('/brands', checkToken, brandController.getAllBrands);
router.post('/brands', checkToken, brandController.createBrand);
router.put('/brands/:id', checkToken, brandController.updateBrand);
router.delete('/brands/:id', checkToken, brandController.deleteBrand);



// Brands CRUD
router.get('/categories', checkToken, categoryController.getAllCategories);
router.post('/categories', checkToken, categoryController.createCategory);
router.put('/categories/:id', checkToken, categoryController.updateCategory);
router.delete('/categories/:id', checkToken, categoryController.deleteCategory);

// Products CRUD
router.get('/products', checkToken, productController.getAllProducts);
router.post('/products', checkToken, productController.createProduct);
router.put('/products/:id', checkToken, productController.updateProduct);
router.delete('/products/:id', checkToken, productController.deleteProduct);

// Reviews CRUD
router.get('/reviews', reviewController.getAllReviews);
router.post('/reviews', checkToken, reviewController.createReview);
router.put('/reviews/:id', checkToken, reviewController.updateReview);
router.delete('/reviews/:id', checkToken, reviewController.deleteReview);

// ==================== ROUTES DES COMMANDES (ORDERS) ====================

router.get('/orders', orderController.getAllOrders);
router.post('/orders', orderController.createOrderManger);
router.put('/orders/:id', checkToken, orderController.updateOrder);
router.delete('/orders/:id', checkToken, orderController.deleteOrder);
router.get('/black-list', checkToken, orderController.getBlackList);
router.get('/last-order', checkToken, orderController.getLastOrder);


router.get('/inventory', checkToken, inventoryController.getAllInventory);
router.get('/inventory/products', checkToken, inventoryController.getAllInventoryByProducts);
router.post('/inventory', checkToken, inventoryController.createInventory);
router.put('/inventory/:id', checkToken, inventoryController.updateInventory);
router.delete('/inventory/:id', checkToken, inventoryController.deleteInventory);


router.get('/ads', checkToken, adsController.getAllADS);
router.post('/ads', checkToken, adsController.createAD);
router.put('/ads/:id', checkToken, adsController.updateAD);
router.delete('/ads/:id', checkToken, adsController.deleteAD);


router.get('/lists', checkToken, listController.getAllLISTS);
router.post('/lists', checkToken, listController.createLIST);
router.put('/lists/:id', checkToken, listController.updateLIST);
router.delete('/lists/:id', checkToken, listController.deleteLIST);

router.get('/stats', checkToken, authController.statsAdmin);


module.exports = router;