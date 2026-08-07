const pool = require('../config/db');

const findAll = async (search, lang) => {
  let query = `
    SELECT r.*, p.name AS product_name, p.id AS product_id 
    FROM reviews r
    LEFT JOIN products p ON r.product_id = p.id
  `;

  const queryParams = [];
  const whereClauses = [];

  if (lang) {
    whereClauses.push('r.lang = ?');
    queryParams.push(lang);
  }

  if (search) {
    whereClauses.push('(r.name LIKE ? OR r.comment LIKE ? OR w.name LIKE ?)');
    const searchParam = `%${search}%`;
    queryParams.push(searchParam, searchParam, searchParam);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' ORDER BY r.created_at DESC';

  const [rows] = await pool.query(query, queryParams);
  return rows;
};

const findByProductId = async (productId, lang) => {
  try {
    console.log("Fetching reviews for productId:", productId, "Language:", lang);

    // 1. تحديد الاستعلام الأساسي
    const query = "SELECT * FROM reviews WHERE product_id = ? AND lang = ? AND status = 'public' ORDER BY created_at DESC";

    // 2. تعريف مصفوفة البارامترات وتعبئتها بالترتيب الصحيح
    const queryParams = [productId, lang];

    // 3. تنفيذ الاستعلام وتمرير المصفوفة بشكل صحيح
    const [rows] = await pool.query(query, queryParams);

    return rows;
  } catch (error) {
    console.error("Erreur dans find productId:", error);
    throw error; // رمي الخطأ للـ Controller ليتعامل معه ويرسل 500 للمستخدم
  }
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);
  return rows[0];
};

const create = async (reviewData) => {
  const { product_id, order_id, name, rating, comment, status, lang } = reviewData;
  console.log(reviewData)
  const validatedLang = ['ar', 'fr'].includes(lang) ? lang : 'ar';

  const [result] = await pool.query(
    'INSERT INTO reviews (product_id, order_id, name, rating, comment, status, lang) VALUES (?, ? , ?, ?, ?, ?,?)',
    [product_id,order_id, name, rating, comment, status || 'public', validatedLang]
  );

  const insertId = result.insertId;

 


  return { id: insertId, ...reviewData,  lang: validatedLang };
};

const update = async (id, reviewData) => {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(reviewData)) {
    if (key === 'id') continue;

    if (key === 'lang') {
      const validatedLang = ['ar', 'fr'].includes(value) ? value : 'ar';
      fields.push(`${key} = ?`);
      values.push(validatedLang);
      continue;
    }

    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return false;

  values.push(id);

  const sql = `UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`;
  const [result] = await pool.query(sql, values);
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM reviews WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findByProductId,
  findById,
  create,
  update,
  remove,
};