const pool = require('../config/db');


// جلب جميع الطلبات مع تفاصيل منتجاتها
const findAll = async () => {
    const connection = await pool.getConnection();
    try {
      // 1. جلب جميع الطلبات مرتبة من الأحدث للأقدم
      const [orders] = await connection.query(
        'SELECT * FROM orders ORDER BY created_at DESC'
      );
  
      if (orders.length === 0) return [];
  
      // 2. جلب جميع تفاصيل المنتجات لجميع الطلبات في استعلام واحد فقط (لتحسين الأداء)
      const orderIds = orders.map(order => order.id);
      const [items] = await connection.query(
        'SELECT * FROM order_items WHERE order_id IN (?)',
        [orderIds]
      );
  
      // 3. ربط المنتجات بكل طلب (Mapping)
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: items.filter(item => item.order_id === order.id)
      }));
  
      return ordersWithItems;
  
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    } finally {
      connection.release();
    }
  };

const create = async (itemData) => {
  // Ajout de quantity et price dans la déstructuration (avec valeurs par défaut)
  const {
    order_id,
    product_name,
    product_id,
    size,
    color,
    image,
    quantity,
    price
   } = itemData;


   const [result] = await pool.query(
    'INSERT INTO order_items (order_id, product_name, product_id, size, color, image, quantity, price ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
        order_id,
        product_name,
        product_id,
        JSON.stringify(size),
        JSON.stringify(color), 
        image,
        quantity,
        price
    ]
  );
  
  const insertId = result.insertId;
  return { id: insertId, ...itemData };
};

// 2. تحديث عنصر (Update) - مثلاً تغيير الكمية أو السعر
const update = async (id, updateData) => {
  const { quantity, price, size, color, image } = updateData;
  
  const [result] = await pool.query(
    'UPDATE order_items SET quantity = ?, price = ?, size = ?, color = ?, image = ? WHERE id = ?',
    [quantity, price, size, color, image, id]
  );
  
  return result.affectedRows > 0;
};

// 3. حذف عنصر (Delete)
const remove = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM order_items WHERE id = ?',
    [id]
  );
  
  return result.affectedRows > 0;
};
const removeByOrderID = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM order_items WHERE order_id = ?',
    [id]
  );
  
  return result.affectedRows > 0;
};

// 4. (إضافي) جلب عناصر طلب معين
const findByOrderId = async (orderId) => {
  const [rows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  return rows;
};

module.exports = {
  findAll,
  create,
  update,
  remove,
  findByOrderId,
  removeByOrderID
};