const productModel = require('../models/product.model');
const reviewModel = require('../models/review.model');
const inventoryModel = require('../models/inventory.model');
const slugify = require('../utils/slugify');

// ==================== PUBLIC METHODS ====================

/**
 * جلب جميع الساعات بدون تفاصيل إضافية
 */
const getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;
    const products = await productModel.findAll(search);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};

/**
 * جلب الساعات المخصصة للغة الفرنسية مع التقييمات
 */
const getProducts_fr = async (req, res) => {
  try {
    const products = await productModel.findAllWithDetails('fr');
    res.status(200).json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};

/**
 * جلب الساعات المخصصة للغة العربية مع التقييمات
 */
const getProducts_ar = async (req, res) => {
  try {
    const products = await productModel.findAllWithDetails('ar');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};


const getProductsAll_ar = async (req, res) => {
  try {

    const products = await productModel.findAll_ar();
    res.status(200).json(
      products
    );

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات'
    });
  }
};
const getProductsAll_fr = async (req, res) => {
  try {

    const products = await productModel.findAll_fr();
    res.status(200).json(
      products
    );

  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب البيانات'
    });
  }
};



const getProductsByTag_ar = async (req, res) => {
  try {
    const { slug } = req.params;
    const products = await productModel.findByTag(slug, 'ar');
    res.status(200).json(products);
  } catch (error) {
    console.log(error)
    res.status(500).json(error);

    // res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};

const getProductsByTag_fr = async (req, res) => {
  try {
    const { slug } = req.params;
    const products = await productModel.findByTag(slug, 'fr');
    res.status(200).json(products);
  } catch (error) {
    console.log(error)
    res.status(500).json(error);

    // res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};


const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await productModel.findBySlug(slug);
    if (!product) return res.status(404).json({ message: "Product introuvable" });

    product.reviews = await reviewModel.findByProductId(product.id, product.lang);
    product.inventory = await inventoryModel.getByProductId(product.id);
    res.status(200).json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

/**
 * جلب ساعة واحدة عبر الـ Slug (بالعربية)
 */
const getProductBySlugArabic = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await productModel.findBySlug(slug);
    if (!product) return res.status(404).json({ message: "الساعة غير موجودة" });

    product.reviews = await reviewModel.findByProductId(product.id, product.lang);
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "خطأ في استرجاع الساعة" });
  }
};

/**
 * البحث عن الساعات بناءً على كلمة مفتاحية
 */
const searchProducts_fr = async (req, res) => {
  try {
    const searchTerm = req.query.q ? req.query.q.toLowerCase() : "";
    if (!searchTerm) return res.status(200).json([]);
    const products = await productModel.search(searchTerm, 'fr');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la recherche" });
  }
};

const searchProducts_ar = async (req, res) => {
  console.log('searchProducts_ar');
  try {
    const searchTerm = req.query.q ? req.query.q.toLowerCase() : "";
    if (!searchTerm) return res.status(200).json([]);
    const products = await productModel.search(searchTerm, 'ar');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la recherche" });
  }
};

// ==================== ADMIN CRUD ====================

/**
 * إنشاء ساعة جديدة (شامل لكافة الحقول الجدیدة والصور)
 */
const createProduct = async (req, res) => {
  try {
    const {
      name, sku, slug: bodySlug, tags, text, sizes, materiel,
      colors, img, images, price, oldPrice, old_price, description,
      brand_id, category_id, brandId, status, lang
    } = req.body;

    const formattedSizes = typeof sizes === 'string'
      ? sizes.split(',').map(s => "X" + s.trim())
      : (Array.isArray(sizes) ? sizes : []);
    console.log(formattedSizes)



    const formattedColors = typeof colors === 'string'
      ? colors.split(',').map(c => c.trim())
      : (Array.isArray(colors) ? colors : []);

    // إدارة توليد الـ Slug تلقائياً وتفادي التكرار في قاعدة البيانات
    let slug = bodySlug || slugify(name);
    let existing = await productModel.findBySlug(slug);
    let counter = 1;
    while (existing) {
      slug = `${bodySlug || slugify(name)}-${counter}`;
      existing = await productModel.findBySlug(slug);
      counter++;
    }



    // معالجة حقل ألبوم الصور الإضافية بذكاء
    let imagesArray = images;
    if (typeof images === 'string') {
      try {
        imagesArray = JSON.parse(images);
      } catch (e) {
        imagesArray = images.split(',').map(img => img.trim());
      }
    }

    // توحيد الحقول لتفادي مشاكل camelCase و snake_case
    const actualOldPrice = oldPrice || old_price || null;
    const actualBrandId = brandId || brand_id;

    // إرسال البيانات كاملة للـ Model للحفظ
    const newProduct = await productModel.create({
      name,
      sku,
      slug,
      tags: tags,
      text: text,
      sizes: formattedSizes,
      colors: formattedColors,

      materiel: materiel,
      img: img,
      images: imagesArray || [],
      price: parseFloat(price),
      oldPrice: actualOldPrice ? parseFloat(actualOldPrice) : null,
      description: description,
      brand_id: actualBrandId,
      category_id,
      status: status || 'public',
      lang: lang || 'fr'
    });

    res.status(201).json({ message: "Montre créée avec succès", product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Erreur lors de la création de la montre" });
  }
};



const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, sku, slug, tags, text, sizes, materiel,
      colors, img, images, price, category_id, old_price, description,
      brand_id, status, lang
    } = req.body;
  


    // معالجة الأحجام وتحويلها لمصفوفة مؤقتة للتنظيف
    const formattedSizes = typeof sizes === 'string'
      ? sizes.split(',').map(s => s.trim())
      : (Array.isArray(sizes) ? sizes : []);

    // معالجة الألوان وتحويلها لمصفوفة مؤقتة للتنظيف
    const formattedColors = typeof colors === 'string'
      ? colors.split(',').map(c => c.trim())
      : (Array.isArray(colors) ? colors : []);

    const existingProduct = await productModel.findById(parseInt(id));
    if (!existingProduct) return res.status(404).json({ message: "Montre non trouvée" });

    const updateData = {};

    // معالجة تحديث الاسم والـ Slug المرتبط به
    if (name) {
      updateData.name = name;
      let slugToCheck = slug || slugify(name);
      let slugExists = await productModel.findBySlug(slugToCheck);
      let counter = 1;
      while (slugExists && slugExists.id !== parseInt(id)) {
        slugToCheck = `${slug || slugify(name)}-${counter}`;
        slugExists = await productModel.findBySlug(slugToCheck);
        counter++;
      }
      updateData.slug = slugToCheck;
    } else if (slug) {
      updateData.slug = slug;
    }

    // تحديث الحقول الاختيارية وتحويل المصفوفات إلى نصوص متوافقة مع SQL
    if (tags !== undefined) updateData.tags = tags;
    if (text !== undefined) updateData.text = text;
    if (materiel !== undefined) updateData.materiel = materiel;
    if (img !== undefined) updateData.img = img;
    if (sku !== undefined) updateData.sku = sku;
    if (status !== undefined) updateData.status = status;
    if (lang !== undefined) updateData.lang = lang;
    if(category_id  !== undefined) updateData.category_id = category_id;
console.log(category_id)
    // تحويل المصفوفات إلى نص مفصول بفاصلة ليطابق حقول الـ VARCHAR في قاعدة البيانات
    if (sizes !== undefined) updateData.sizes = formattedSizes.join(', ');
    if (colors !== undefined) updateData.colors = formattedColors.join(', ');

    // معالجة الألبوم أثناء التحديث
    if (images !== undefined) {
      let imagesArray = images;
      if (typeof images === 'string') {
        try {
          imagesArray = JSON.parse(images);
        } catch (e) {
          imagesArray = images.split(',').map(img => img.trim());
        }
      }
      // إذا كان الموديل يشترط تحويل الألبوم لنص JSON stringified كما يظهر في خطأ الـ SQL
      updateData.images = JSON.stringify(imagesArray);
    }

    if (price !== undefined) updateData.price = parseFloat(price);

    if (old_price !== undefined) updateData.old_price = parseFloat(old_price) || 0;

    if (description !== undefined) updateData.description = description;

    updateData.brand_id = parseInt(brand_id);

    const success = await productModel.update(parseInt(id), updateData);
    if (success) res.status(200).json({ message: "Montre mise à jour avec succès" });
    else res.status(400).json({ message: "Échec de la mise à jour" });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la montre" });
  }
};



const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await productModel.findById(parseInt(id));
    if (!existing) return res.status(404).json({ message: "Montre non trouvée" });

    const deleted = await productModel.remove(parseInt(id));
    if (deleted) res.status(200).json({ message: "Montre supprimée avec succès" });
    else res.status(400).json({ message: "Échec de la suppression" });
  } catch (error) {
    // منع الحذف في حال وجود طلبات (Orders) مرتبطة بهذه الساعة منعاً لانهيار البيانات
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ message: "Impossible de supprimer cette montre car elle a des commandes associées" });
    }
    res.status(500).json({ message: "Erreur lors de la suppression de la montre" });
  }
};

/**
 * فئة تصفية: جلب الساعات بناءً على الماركة التجارية
 */
const getProductsByBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const products = await productModel.findByBrandId(parseInt(brandId)); // تم تغييرها إلى findByBrandId لتتطابق مع الـ model
    for (let product of products) product.reviews = await reviewModel.findByProductId(product.id);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits par marque" });
  }
};


module.exports = {
  getAllProducts,
  getProducts_ar,
  getProductsAll_ar,
  getProductsAll_fr,
  getProducts_fr,
  getProductBySlug,
  getProductBySlugArabic,
  searchProducts_fr,
  searchProducts_ar,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByBrand,
  getProductsByTag_ar,
  getProductsByTag_fr
};