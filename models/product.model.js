const pool = require('../config/db');

const findAll = async (search = '', lang) => {
  let sql = `
    SELECT p.*, 
           c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id`;

  const values = [];

  // تصفية شاملة تمت إزالة c.name لأن جدول collections غير مرتبط هنا
  if (search.trim() !== '') {
    sql += ` WHERE p.name LIKE ? 
             OR p.description LIKE ? 
             OR c.name LIKE ? 
             OR p.lang LIKE ? 
             OR p.price LIKE ?`;

    const searchParam = `%${search}%`;
    values.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const [rows] = await pool.query(sql, values);
  return rows;
};



const findAll_fr = async () => {
  let sql = `
  SELECT p.*, 
         c.name as category_name, c.slug as category_slug,
         CONCAT('[', 
            GROUP_CONCAT(DISTINCT JSON_OBJECT('color', pi.color, 'color_fr', pi.color_fr) SEPARATOR ','), 
         ']') as colors_fr,
         
         CONCAT('[', 
            GROUP_CONCAT(DISTINCT JSON_OBJECT('size', pi.size, 'size_fr', pi.size_fr) SEPARATOR ','), 
         ']') as sizes_fr
         
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN product_inventory pi ON p.id = pi.product_id
  WHERE p.lang = 'fr'
  GROUP BY p.id
  ORDER BY p.created_at DESC`;

  const [rows] = await pool.query(sql);

  // معالجة البيانات وتحويل النصوص إلى مصفوفات JSON حقيقية
  const formattedRows = rows.map(row => {
    let parsedColors = [];
    let parsedSizes = [];

    // معالجة الألوان
    if (row.colors_fr) {
      try {
        parsedColors = JSON.parse(row.colors_fr);
      } catch (e) {
        parsedColors = [];
      }
    }

    // معالجة المقاسات (لأنها أصبحت JSON أيضاً)
    if (row.sizes_fr) {
      try {
        parsedSizes = JSON.parse(row.sizes_fr);
      } catch (e) {
        parsedSizes = [];
      }
    }

    return {
      ...row,
      colors_fr: parsedColors, 
      sizes_fr: parsedSizes    
    };
  });

  return formattedRows;
};


const findAll_ar = async () => {
  let sql = `
  SELECT p.*, 
         c.name as category_name, c.slug as category_slug,
         CONCAT('[', 
            GROUP_CONCAT(DISTINCT JSON_OBJECT('color', pi.color, 'color_ar', pi.color_ar) SEPARATOR ','), 
         ']') as colors_ar,
         
         CONCAT('[', 
            GROUP_CONCAT(DISTINCT JSON_OBJECT('size', pi.size, 'size_ar', pi.size_ar) SEPARATOR ','), 
         ']') as sizes_ar
         
  FROM products p
  LEFT JOIN categories b ON p.category_id = c.id
  LEFT JOIN product_inventory pi ON p.id = pi.product_id
  WHERE p.lang = 'ar'
  GROUP BY p.id
  ORDER BY p.created_at DESC`;

  const [rows] = await pool.query(sql);

  const formattedRows = rows.map(row => {
    let parsedColors = [];
    let parsedSizes = [];

    // معالجة الألوان
    if (row.colors_ar) {
      try {
        parsedColors = JSON.parse(row.colors_ar);
      } catch (e) {
        parsedColors = [];
      }
    }

    // معالجة المقاسات (لأنها أصبحت JSON أيضاً)
    if (row.sizes_ar) {
      try {
        parsedSizes = JSON.parse(row.sizes_ar);
      } catch (e) {
        parsedSizes = [];
      }
    }

    return {
      ...row,
      colors_ar: parsedColors, // مصفوفة كائنات للألوان
      sizes_ar: parsedSizes    // مصفوفة كائنات للمقاسات
    };
  });

  return formattedRows;
};

const search = async (searchQuery = '', lang) => {
  let sql = `
    SELECT p.*, 
           c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id`;

  const values = [];

  if (searchQuery.trim() !== '') {
    sql += ` WHERE p.name LIKE ? 
             OR p.description LIKE ? 
             OR c.name LIKE ? 
             OR p.lang LIKE ? 
             OR p.price LIKE ?`;

    const searchParam = `%${searchQuery}%`;
    values.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  sql += ` ORDER BY p.created_at DESC`;
  const [rows] = await pool.query(sql, values);
  return rows;
};

const findAllWithDetails = async (lang) => {
  let sql = `
    SELECT p.*, 
           c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
  `;

  const queryParams = [];

  if (lang) {
    sql += " WHERE p.lang = ? AND p.status = 'public'";
    queryParams.push(lang);
  } else {
    sql += " WHERE p.status = 'public'";
  }

  sql += ' ORDER BY p.created_at DESC';

  const [rows] = await pool.query(sql, queryParams);
  return rows;
};




const findBySlug = async (slug) => {
  // 1. جلب بيانات المنتج الأساسية
  const sqlProduct = `
    SELECT p.*, 
           c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.brand_id = c.id
    WHERE p.slug = ?
  `;

  const [productRows] = await pool.query(sqlProduct, [slug]);
  const product = productRows[0];

  if (!product) return null;

  // 2. جلب بيانات المخزون المرتبطة بهذا المنتج من جدول product_inventory
  const sqlInventory = `SELECT * FROM product_inventory WHERE product_id = ?`;
  const [inventoryRows] = await pool.query(sqlInventory, [product.id]);

  // إرفاق المخزون بالمنتج
  product.inventory = inventoryRows;

  // 3. دالة مساعدة لمعالجة نصوص JSON للحقول الأساسية
  const parseJSONField = (fieldValue, fieldName) => {
    if (fieldValue && typeof fieldValue === 'string' && fieldValue.trim().startsWith('[')) {
      try {
        return JSON.parse(fieldValue.trim());
      } catch (e) {
        console.error(`Error parsing ${fieldName} for product ID ${product.id}:`, e.message);
        return fieldValue;
      }
    }
    return fieldValue;
  };

  // معالجة الحقول الأساسية الموجودة في جدول products
  product.sizes = parseJSONField(product.sizes, 'sizes');
  product.colors = parseJSONField(product.colors, 'colors');
  product.images = parseJSONField(product.images, 'images');

  // 4. استخراج الألوان والمقاسات المترجمة من بيانات المخزون (بدون تكرار باستخدام Set)
  product.colors_ar = [...new Set(inventoryRows.map(item => item.color_ar))].filter(Boolean);
  product.colors_fr = [...new Set(inventoryRows.map(item => item.color_fr))].filter(Boolean);

  product.sizes_ar = [...new Set(inventoryRows.map(item => item.size_ar))].filter(Boolean);
  product.sizes_fr = [...new Set(inventoryRows.map(item => item.size_fr))].filter(Boolean);

  return product;
};
const findById = async (id) => {
  const sql = `
    SELECT p.*, 
           c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows[0];
};


const findByBrandId = async (id) => {
  const sql = `
    SELECT p.*, 
           b.name as brand_name, b.slug as brand_slug 
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE b.id = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows;
};
const findByCategoryId = async (id) => {
  const sql = `
    SELECT p.*, 
           c.name as category_name, c.slug as category_slug,
           b.name as brand_name, b.slug as brand_slug 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id 
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE c.id = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows;
};


const create = async (productData) => {
  const {
    sku, name, slug, tags, text, sizes, materiel, colors, img, images, price,
    oldPrice, old_price, // استيعاب التسميتين
    description,
    brandId, brand_id,category_id,   // استيعاب التسميتين
    status, lang
  } = productData;

  const actualOldPrice = oldPrice || old_price || null;
  const actualBrandId = brandId || brand_id;

  // دعم اللغة الإنجليزية بالإضافة للفرنسية والعربية
  const validatedLang = ['ar', 'fr', 'en'].includes(lang) ? lang : 'en';
  const validatedStatus = status ? status.toLowerCase() : 'private';

  const [result] = await pool.query(
    `INSERT INTO products 
     (sku, name, slug, tags, text, sizes, colors, materiel, img, images, price, old_price, description, brand_id,category_id, status, lang)
     VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sku,
      name,
      slug,
      tags ,
      text ,
      typeof sizes === 'string' ? sizes : JSON.stringify(sizes || []),
      typeof colors === 'string' ? colors : JSON.stringify(colors || []),
      materiel ,
      img,
      typeof images === 'string' ? images : JSON.stringify(images || []),
      price,
      actualOldPrice,
      description,
      actualBrandId,
      category_id,
      validatedStatus,
      validatedLang
    ]
  );

  const insertId = result.insertId;

  const seoSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const finalSlug = `${seoSlug}-${insertId}-${validatedLang}`;

  await pool.query('UPDATE products SET slug = ? WHERE id = ?', [finalSlug, insertId]);

  return { id: insertId, ...productData, slug: finalSlug, lang: validatedLang, status: validatedStatus };
};

const update = async (id, productData) => {
  const fields = [];
  const values = [];

  const columnMapping = {
    old_price: 'old_price',
    brand_id: 'brand_id'
  };

  for (let [key, value] of Object.entries(productData)) {
    if (key === 'id') continue;

    if (columnMapping[key]) {
      key = columnMapping[key];
    }

    if (key === 'images' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'string' ? value : JSON.stringify(value));
      continue;
    }

    if (key === 'lang' && value) {
      const validatedLang = ['ar', 'fr', 'en'].includes(value) ? value : 'en';
      fields.push(`${key} = ?`);
      values.push(validatedLang);
      continue;
    }

    if (key === 'status' && value) {
      fields.push(`${key} = ?`);
      values.push(value.toLowerCase());
      continue;
    }

    fields.push(`${key} = ?`);
    values.push(value === '' ? null : value);
  }

  if (fields.length === 0) return false;

  values.push(id);

  const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
  const [result] = await pool.query(sql, values);
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const findByTag = async (slug, lang) => {
  const [products] = await pool.query('SELECT * FROM products p WHERE p.lang = ?  AND  p.tags LIKE ?', [lang, `%${slug}%`]);

  if (products.length === 0) {
    return null;
  }
  const formattedName = slug.replace(/-/g, ' ').toUpperCase();
  return {
    name: formattedName,
    slug: slug,
    img: JSON.parse(products[0].images)[1],
    created_at: products[0].created_at,
    updated_at: new Date().toISOString(),
    status: "public",
    lang: products[0].lang || "fr",
    products: products
  };
};

module.exports = {
  findAllWithDetails,
  findAll,
  search,
  findByBrandId,
  findByCategoryId,
  findBySlug,
  findById,
  create,
  update,
  remove,
  findByTag,
  findAll_ar,
  findAll_fr

};
