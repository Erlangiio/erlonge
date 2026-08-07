const pool = require('../config/db');
const bcrypt = require('bcrypt');

// البحث عن مدير بواسطة اسم المستخدم
const findByUsername = async (username) => {
  const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
  return rows[0];
};

// البحث عن مدير بواسطة الـ ID
const findById = async (id) => {
  const [rows] = await pool.query('SELECT id, username, status, created_at FROM admins WHERE id = ?', [id]);
  return rows[0];
};

// جلب جميع المديرين
const findAll = async () => {
  const [rows] = await pool.query('SELECT id, username, status, created_at FROM admins ORDER BY id');
  return rows;
};

// إنشاء مدير جديد
const create = async (adminData) => {
  // الـ Controller يرسل password_hash مشفرة جاهزة
  const { username, password_hash, status = 'yes' } = adminData;

  const [result] = await pool.query(
    'INSERT INTO admins (username, password_hash, status) VALUES (?, ?, ?)',
    [username, password_hash, status]
  );
  return result.affectedRows > 0;
};

// تحديث بيانات المدير ديناميكياً
const update = async (id, updateData) => {
  const { username, password_hash, status } = updateData;
  let sql = 'UPDATE admins SET ';
  const values = [];

  if (username) {
    sql += 'username = ?, ';
    values.push(username);
  }
  if (password_hash) {
    sql += 'password_hash = ?, ';
    values.push(password_hash);
  }
  if (status) {
    sql += 'status = ?, ';
    values.push(status);
  }

  // إذا لم يتم إرسال أي حقول للتحديث
  if (values.length === 0) return false;

  // إزالة الفاصلة الأخيرة والمسافة
  sql = sql.slice(0, -2);
  sql += ' WHERE id = ?';
  values.push(id);

  const [result] = await pool.query(sql, values);
  return result.affectedRows > 0;
};

// دالة الحذف (تم تغيير اسمها من remove إلى delete لتتوافق مع الـ Controller)
const deleteAdmin = async (id) => {
  const [result] = await pool.query('DELETE FROM admins WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// تغيير كلمة المرور منفصلة (اختياري)
const changePassword = async (id, newPassword) => {
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(newPassword, saltRounds);
  const [result] = await pool.query('UPDATE admins SET password_hash = ? WHERE id = ?', [password_hash, id]);
  return result.affectedRows > 0;
};



const findStats = async () => {
  try {
    // 1. جلب الإحصائيات الأساسية
    const [brands] = await pool.query(
      "SELECT COUNT(*) as count FROM brands WHERE status = 'public'"
    );

    const [Categories] = await pool.query(
      "SELECT COUNT(*) as count FROM categories WHERE status = 'public'"
    );
  
    const [Products] = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE status = 'public'"
    ); 
    
    const [orders] = await pool.query(
      "SELECT COUNT(*) as count FROM orders"
    );
    
    const [users] = await pool.query(
      "SELECT COUNT(*) as count FROM admins" 
    );

    const [ads] = await pool.query(
      "SELECT COUNT(*) as count FROM ads" 
    );

    // إجمالي المخزون وقيمته المالية (قيمة البضاعة المتوفرة للبيع)
    const [inventory] = await pool.query(
      `SELECT 
        COUNT(*) as count, 
        IFNULL(SUM(i.quantity), 0) as total_quantity,
        IFNULL(SUM(p.price * i.quantity), 0) as total_value
       FROM product_inventory i
       JOIN products p ON i.product_id = p.id`
    );

    // ✅ الاستعلام الجديد لحساب المبيعات الفعلية (الأرباح/المعاملات)
    // نقوم بربط جدول عناصر الطلب بجدول الطلبات لحساب (السعر × الكمية) للطلبات الناجحة فقط
    const [sales] = await pool.query(
      `SELECT 
        IFNULL(SUM(oi.price * oi.quantity), 0) as total_revenue 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status = 'succeeded'` // قم بتغيير 'completed' للحالة التي تعني طلب ناجح/مدفوع في نظامك
    );

    // 2. تجميع البيانات في المصفوفة التي يتوقعها الـ Frontend
    const statsData = [
      { 
        label: 'Produits', 
        count: Products[0].count, 
        desc: 'Articles en collection', 
        url: '/dashboard/products' 
      },
      { 
        label: 'Categories', 
        count: Categories[0].count, 
        desc: 'Articles en collection', 
        url: '/dashboard/products' 
      },
      // ✅ بطاقة المبيعات (Chiffre d'affaires)
      { 
        label: 'Ventes', 
        count: Number(sales[0].total_revenue).toFixed(2) + ' DH', 
        desc: "Chiffre d'affaires (Commandes validées)", 
        url: '/dashboard/orders'  
      },
      { 
        label: 'Commandes', 
        count: orders[0].count, 
        desc: 'Total des commandes',  
        url: '/dashboard/orders'  
      },
      { 
        label: 'Utilisateurs', 
        count: users[0].count, 
        desc: 'Clients membres', 
        url: '/dashboard/users' 
      },
      { 
        label: 'Marques', 
        count: brands[0].count, 
        desc: 'Partenaires officiels', 
        url: '/dashboard/brands' 
      },
      { 
        label: 'ADS', 
        count: ads[0].count, 
        desc: 'Ce mois-ci',  
        url: '/dashboard/ads'  
      },
      // بطاقة المخزون
      { 
        label: 'Inventaire', 
        count: Number(inventory[0].total_quantity) + '/' + inventory[0].count, 
        desc: 'Quantité totale en stock', 
        url: '/dashboard/inventory', 
        value: Number(inventory[0].total_value).toFixed(2) + ' DH' 
      }
    ];

    console.log(statsData);
    return statsData;

  } catch (error) {
    console.error(error);
    throw error;
  }
};
module.exports = {
  findByUsername,
  findById,
  findAll,
  create,
  update,
  delete: deleteAdmin, // تم تصديرها باسم delete لتطابق الـ Controller
  changePassword,
  findStats
};