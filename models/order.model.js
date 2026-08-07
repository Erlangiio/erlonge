const pool = require('../config/db');

// 1. إنشاء طلب جديد (تم تحديثه)
const create = async (orderData) => {
  const { full_name, phone, email, address, status, price, lang, shipping_fee } = orderData;
  const validatedLang = ['ar', 'fr'].includes(lang) ? lang : 'ar';

  const [result] = await pool.query(
    'INSERT INTO orders (full_name, phone, email, address, price, status, lang, shipping_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [full_name || '', phone || '', email || '', address || '', price || 0.00, status || 'pending', validatedLang, shipping_fee]
  );

  return { id: result.insertId, ...orderData, lang: validatedLang };
};


const findAll = async () => {
  try {
    // جلب كافة الطلبات مع تفاصيل منتجاتها في استعلام واحد باستخدام LEFT JOIN
    // هذا الاستعلام يضمن جلب الطلب حتى لو لم تكن له منتجات (نظرياً)
    const [rows] = await pool.query(`
      SELECT o.*, 
             oi.id as item_id, oi.product_name, oi.product_id, 
             oi.size, oi.color, oi.quantity, oi.price as item_price
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ORDER BY o.created_at DESC
    `);

    // تحويل النتائج المسطحة (Flat) إلى هيكل متداخل (Nested)
    const ordersMap = new Map();

    rows.forEach(row => {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          ...row,
          items: [] // هنا سنضع المنتجات
        });
        // حذف حقول الـ join الزائدة من الطلب الرئيسي
        delete ordersMap.get(row.id).item_id;
        delete ordersMap.get(row.id).product_name;
        delete ordersMap.get(row.id).product_id;
        delete ordersMap.get(row.id).size;
        delete ordersMap.get(row.id).color;
        delete ordersMap.get(row.id).quantity;
        delete ordersMap.get(row.id).item_price;
      }

      // إضافة المنتج للطلب إذا وجد
      if (row.item_id) {
        ordersMap.get(row.id).items.push({
          id: row.item_id,
          product_name: row.product_name,
          product_id: row.product_id,
          size: row.size,
          color: row.color,
          quantity: row.quantity,
          price: row.item_price
        });
      }
    });

    return Array.from(ordersMap.values());
  } catch (error) {
    throw error;
  }
};
// 3. جلب آخر طلبين
const getLastOrders = async () => {
  const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 2');
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT 
        o.*, 
        oi.id as item_id, 
        oi.product_name, 
        oi.product_id, 
        oi.size, 
        oi.color, 
        oi.quantity, 
        oi.price as item_price,
        oi.image
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.id = ?`,
    [id]
  );

  // إذا لم يتم العثور على الطلب
  if (!rows || rows.length === 0) {
    return null;
  }

  // استخراج بيانات المنتجات حتى يتبقى لنا فقط بيانات الطلب الأساسية في orderData
  const {
    item_id, 
    product_name, 
    product_id,
    size, 
    color, 
    quantity, 
    item_price,
    image, // تم إضافة image هنا لاستبعادها من orderData
    ...orderData
  } = rows[0];

  const items = rows
    .filter(row => row.item_id !== null) 
    .map(row => ({
      id: row.item_id,
      product_name: row.product_name,
      product_id: row.product_id,
      size: row.size,
      color: row.color,
      quantity: row.quantity,
      price: row.item_price, // تم إضافة الفاصلة هنا
      image: row.image
    }));
    
  orderData.items = items;
  return orderData;
};


const update = async (id, orderData) => {
  const { full_name, phone, email, address, status, price, items, shipping_fee } = orderData;
  const connection = await pool.getConnection(); // الحصول على اتصال مخصص للـ Transaction

  try {
    await connection.beginTransaction(); // ابدأ المعاملة

    // 1. تحديث الطلب
    await connection.query(
      'UPDATE orders SET full_name = ?, phone = ?, email = ?, address = ?, status = ?, price = ? , shipping_fee = ? WHERE id = ?',
      [full_name, phone, email, address, status, price, shipping_fee, id]
    );

    // 2. تحديث المنتجات
    if (items && Array.isArray(items)) {
      await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);

      const itemQuery = 'INSERT INTO order_items (order_id, product_name, product_id, size, color, quantity, price) VALUES (?, ?, ?, ?, ?, ?, ?)';

      for (const item of items) {
        await connection.query(itemQuery, [
          id, item.product_name, item.product_id, item.size, item.color, item.quantity, item.price
        ]);
      }
    }

    await connection.commit(); // حفظ كل التغييرات
    return true;
  } catch (error) {
    await connection.rollback(); // التراجع عن كل شيء في حال حدوث خطأ
    throw error;
  } finally {
    connection.release(); // إرجاع الاتصال للـ pool
  }
};



const remove = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // حذف المنتجات أولاً
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);

    // حذف الطلب
    const [result] = await connection.query('DELETE FROM orders WHERE id = ?', [id]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const isBlacklisted = async (search) => {
  let query = "SELECT * FROM orders WHERE status = 'cancelled'";
  let params = [];

  if (search && search.trim() !== "") {
    const term = `%${search}%`;
    query += " AND (phone LIKE ? OR email LIKE ? OR full_name LIKE ?)";
    params = [term, term, term];
  }

  query += " ORDER BY created_at DESC";

  const [rows] = await pool.query(query, params);
  return rows;
};

module.exports = {
  findAll,
  getLastOrders,
  findById,
  create,
  update,
  remove,
  isBlacklisted
};