const pool = require('../config/db');

const findAll = async (search) => {
  let sql = `
    SELECT 
      pi.id,
      p.id AS product_id,
      p.name AS product_name,
      pi.color, 
      pi.color_fr, 
      pi.color_ar, 
      pi.size, 
      pi.size_fr, 
      pi.size_ar, 
      pi.quantity 
    FROM product_inventory pi
    JOIN products p ON pi.product_id = p.id
  `;

  let params = [];
  if (search) {
    sql += ` WHERE p.name LIKE ?`;
    params.push(`%${search}%`);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
};



// ✅ الدالة المعدلة: تقوم بتجميع المخزون حسب المنتج
const findAllByProducts1 = async (search) => {
  let sql = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.lang AS product_lang,
      COUNT(pi.id) AS variants_count,       -- يحسب عدد المتغيرات (ألوان/مقاسات) المتاحة للمنتج
      IFNULL(SUM(pi.quantity), 0) AS total_quantity -- يجمع كل حبات هذا المنتج
    FROM products p
    JOIN product_inventory pi ON p.id = pi.product_id
  `;

  let params = [];
  
  // إضافة شرط البحث إن وجد
  if (search) {
    sql += ` WHERE p.name LIKE ?`;
    params.push(`%${search}%`);
  }

  // ✅ تجميع البيانات حسب رقم المنتج واسمه (يجب أن تكون دائماً بعد الـ WHERE)
  sql += ` GROUP BY p.id, p.name`;

  const [rows] = await pool.query(sql, params);
  return rows;
};

const findAllByProducts = async (search) => {
  let sql = `
    SELECT 
      p.id AS product_id,
      p.name AS product_name,
      p.slug AS product_slug,
      p.lang AS product_lang,
      COUNT(pi.id) AS variants_count,
      -- مجموع الكميات الموجبة (المخزون المتبقي)
      IFNULL(SUM(CASE WHEN pi.quantity > 0 THEN pi.quantity ELSE 0 END), 0) AS stock_in,
      -- مجموع الكميات السالبة (المبيعات) - نحولها لموجب باستخدام ABS
      IFNULL(SUM(CASE WHEN pi.quantity < 0 THEN ABS(pi.quantity) ELSE 0 END), 0) AS stock_out
    FROM products p
    JOIN product_inventory pi ON p.id = pi.product_id
  `;

  let params = [];
  
  if (search) {
    sql += ` WHERE p.name LIKE ?`;
    params.push(`%${search}%`);
  }

  sql += ` GROUP BY p.id, p.name, p.slug, p.lang`;

  const [rows] = await pool.query(sql, params);
  return rows;
};
const getByProductId = async (productId) => {
  const sql = `
    SELECT id, color, color_fr, color_ar, size, size_fr, size_ar, quantity 
    FROM product_inventory 
    WHERE product_id = ?
  `;
  const [rows] = await pool.query(sql, [productId]);
  return rows;
};

const saveOrUpdate = async (productId, color, colorFr, colorAr, size, sizeFr, sizeAr, quantity) => {
  const sql = `
    INSERT INTO product_inventory (product_id, color, color_fr, color_ar, size, size_fr, size_ar, quantity) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
  `;
  const [result] = await pool.query(sql, [productId, color, colorFr, colorAr, size, sizeFr, sizeAr, quantity]);
  return result.affectedRows > 0;
};

// ------ دوال جديدة تمت إضافتها لتسهيل العمل مع الـ Controller ------

// تحديث كافة حقول المتغير بناءً على الـ ID الفريد
const updateById = async (id, data) => {
  const { product_id, color, color_fr, color_ar, size, size_fr, size_ar, quantity } = data;
  const sql = `
    UPDATE product_inventory 
    SET product_id = ?, color = ?, color_fr = ?, color_ar = ?, size = ?, size_fr = ?, size_ar = ?, quantity = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(sql, [product_id, color, color_fr, color_ar, size, size_fr, size_ar, quantity, id]);
  return result.affectedRows > 0;
};

// حذف المتغير بناءً على الـ ID الفريد
const deleteById = async (id) => {
  const sql = `DELETE FROM product_inventory WHERE id = ?`;
  const [result] = await pool.query(sql, [id]);
  return result.affectedRows > 0;
};

// ------------------------------------------------------------------

const updateQuantity = async (productId, color, size, quantity) => {
  const sql = `
    UPDATE product_inventory 
    SET quantity = ? 
    WHERE product_id = ? AND color = ? AND size = ?
  `;
  const [result] = await pool.query(sql, [quantity, productId, color, size]);
  return result.affectedRows > 0;
};

const deleteVariant = async (productId, color, size) => {
  const sql = `
    DELETE FROM product_inventory 
    WHERE product_id = ? AND color = ? AND size = ?
  `;
  const [result] = await pool.query(sql, [productId, color, size]);
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findAllByProducts,
  getByProductId,
  saveOrUpdate,
  updateById,
  deleteById,
  updateQuantity,
  deleteVariant
};