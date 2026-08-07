const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');

const brandController = require('../controllers/brand.controller');
const productController = require('../controllers/product.controller');
const orderController = require('../controllers/order.controller');
const adsController  = require('../controllers/ads.controller');

const reviewController = require('../controllers/review.controller');
const listController = require('../controllers/list.controller');



// Products
router.get('/fr/products', productController.getProducts_fr);
router.get('/fr/products/search', productController.searchProducts_fr);
router.get('/ar/products/search', productController.searchProducts_ar);
router.get('/fr/products/full', productController.getProductsAll_fr);
router.get('/ar/products/full', productController.getProductsAll_ar);


router.get('/fr/products/:slug', productController.getProductBySlug);

router.get('/ar/products', productController.getProducts_ar);
router.get('/ar/products/:slug', productController.getProductBySlugArabic);

router.get('/fr/products/tag/:slug', productController.getProductsByTag_fr); 
router.get('/ar/products/tag/:slug', productController.getProductsByTag_ar); 


// Brands
router.get('/fr/brands', brandController.getBrands_fr);
router.get('/fr/brands/:slug', brandController.getBrandBySlug);
router.get('/ar/brands', brandController.getBrands_ar);
router.get('/ar/brands/:slug', brandController.getBrandBySlug);


router.get('/fr/categories', categoryController.getCategories_fr);
router.get('/fr/categories/:slug', categoryController.getCategoryBySlug);
router.get('/ar/categories', categoryController.getCategories_ar);
router.get('/ar/categories/:slug', categoryController.getCategoryBySlug);



router.post('/reviews', reviewController.createReview);




router.post('/orders', orderController.createOrder);
router.get('/orders/:slug', orderController.getOrderBySlug);


router.get('/ads', adsController.getADS);


router.post('/list', listController.createLIST);
router.get('/list', listController.getAllLISTS);





module.exports = router;