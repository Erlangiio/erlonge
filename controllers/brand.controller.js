const brandModel = require('../models/brand.model');
const slugify = require('../utils/slugify');
const productModel = require('../models/product.model');

// Public GET

const getBrands_ar = async (req, res) => {
  try {
    const brands = await brandModel.findPublic('ar');
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBrands_fr = async (req, res) => {
  try {
    const brands = await brandModel.findPublic('fr');
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllBrands = async (req, res) => {
  try {
    const brands = await brandModel.findAll();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await brandModel.findBySlug(slug);
    if (!brand) {
      return res.status(404).json(null);
    }
    const products = await productModel.findByBrandId(brand.id);
    console.log(products);

    brand.products = products;
    res.status(200).json(brand);
  } catch (error) {
    return res.status(404).json({ message: "Brand Error" });
  }
};

// Admin CRUD
const createBrand = async (req, res) => {
  try {
    // Extracted description, lang, and status alongside name and img
    const { name, img, description, lang, status } = req.body; 
    if (!name) return res.status(400).json({ message: 'Name is required' });
    
    const slug = req.body.slug || slugify(name);
    const existing = await brandModel.findBySlug(slug);
    if (existing) return res.status(409).json({ message: 'Brand already exists' });
    
    // Added new fields to the model creation payload
    const newBrand = await brandModel.create({ 
      name, 
      slug, 
      img, 
      description: description || '', 
      lang: lang || 'fr', 
      status: status || 'Public' 
    });
    
    res.status(201).json(newBrand);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    // Extracted description from req.body
    const { name, slug, img, description, lang, status } = req.body; 
    
    const brand = await brandModel.findById(id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    
    
    // Included description in the database update wrapper
    const updated = await brandModel.update(id, { 
      name: name || brand.name, 
      slug: slug || brand.slug, 
      lang: lang || brand.lang, 
      status: status !== undefined ? status : brand.status, 
      img: img || brand.img,
      description: description !== undefined ? description : brand.description
    });
    
    if (updated) res.json({ message: 'Brand updated' });
    else res.status(400).json({ message: 'Update failed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await brandModel.remove(id);
    if (deleted) res.json({ message: 'Brand deleted' });
    else res.status(404).json({ message: 'Brand not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllBrands, getBrands_ar, getBrands_fr, getBrandBySlug, createBrand, updateBrand, deleteBrand };