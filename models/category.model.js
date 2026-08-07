const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
  return rows;
};

const findPublic = async (lang) => {
  // Using LOWER(status) ensures it matches 'Public' or 'public'
  const [rows] = await pool.query(
    "SELECT * FROM categories WHERE LOWER(status) = 'public' AND lang = ? ORDER BY name",
    [lang]
  );
  return rows;
};

const findBySlug = async (slug) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0];
};

const create = async (categoryData) => {
  // Extracted description and status
  const { name, img, lang, description, status } = categoryData;
  
  // Added 'en' to the allowed languages and changed the fallback to 'fr' to match the frontend
  const validatedLang = ['ar', 'fr', 'en'].includes(lang) ? lang : 'fr';

  // Included description and status in the INSERT statement
  const [result] = await pool.query(
    'INSERT INTO categories (name, slug, img, lang, description, status) VALUES (?, ?, ?, ?, ?, ?)',
    [name, 'temp', img || null, validatedLang, description || null, status || 'Public']
  );
  
  const insertId = result.insertId;
  
  const seoSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const finalSlug = `${seoSlug}-${insertId}-${validatedLang}`;

  await pool.query('UPDATE categories SET slug = ? WHERE id = ?', [finalSlug, insertId]);
  
  return { id: insertId, ...categoryData, slug: finalSlug, lang: validatedLang };
};

const update = async (id, categoryData) => {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(categoryData)) {
    if (key === 'id') continue; 
    
    if (key === 'lang') {
      // Added 'en' to the allowed languages here as well
      const validatedLang = ['ar', 'fr', 'en'].includes(value) ? value : 'fr';
      fields.push(`${key} = ?`);
      values.push(validatedLang);
      continue;
    }

    fields.push(`${key} = ?`);
    values.push(value);
  }
  
  if (fields.length === 0) return false;

  values.push(id); 

  const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
  const [result] = await pool.query(sql, values);
  return result.affectedRows > 0;
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findPublic, findBySlug, findById, create, update, remove };