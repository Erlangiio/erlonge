const categoryModel = require('../models/category.model');
const slugify = require('../utils/slugify');
const productModel = require('../models/product.model');

// Public GET

const getCategories_ar = async (req, res) => {
  try {
    const categories = await categoryModel.findPublic('ar');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCategories_fr = async (req, res) => {
  try {
    const categories = await categoryModel.findPublic('fr');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.findAll();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await categoryModel.findBySlug(slug);
    if (!category) {
      return res.status(404).json(null);
    }

    const products = await productModel.findByCategoryId(category.id);
    console.log(products);

    category.products = products;
    res.status(200).json(category);
  } catch (error) {
    return res.status(404).json({ message: "category Error" });
  }
};

// Admin CRUD
const createCategory = async (req, res) => {
  try {
    // Extracted description, lang, and status alongside name and img
    const { name, img, description, lang, status } = req.body; 
    if (!name) return res.status(400).json({ message: 'Name is required' });
    
    const slug = req.body.slug || slugify(name);
    const existing = await categoryModel.findBySlug(slug);
    if (existing) return res.status(409).json({ message: 'category already exists' });
    
    // Added new fields to the model creation payload
    const newcategory = await categoryModel.create({ 
      name, 
      slug, 
      img, 
      description: description || '', 
      lang: lang || 'fr', 
      status: status || 'Public' 
    });
    
    res.status(201).json(newcategory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Extracted description from req.body
    const { name, slug, img, description, lang, status } = req.body; 
    
    const category = await categoryModel.findById(id);
    if (!category) return res.status(404).json({ message: 'category not found' });
    
    
    // Included description in the database update wrapper
    const updated = await categoryModel.update(id, { 
      name: name || category.name, 
      slug: slug || category.slug, 
      lang: lang || category.lang, 
      status: status !== undefined ? status : category.status, 
      img: img || category.img,
      description: description !== undefined ? description : category.description
    });
    
    if (updated) res.json({ message: 'category updated' });
    else res.status(400).json({ message: 'Update failed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await categoryModel.remove(id);
    if (deleted) res.json({ message: 'category deleted' });
    else res.status(404).json({ message: 'category not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllCategories, getCategories_ar, getCategories_fr, getCategoryBySlug, createCategory, updateCategory, deleteCategory };