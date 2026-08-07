const pool = require('../config/db');


const findADS = async () => {
    // تم الإصلاح: وضع ORDER BY قبل LIMIT
    let query = `SELECT * FROM ads WHERE status = 'Public'  ORDER BY created_at DESC LIMIT 4`;

    const [rows] = await pool.query(query);
    return rows;
};


// تم إزالة مُعامل lang لأنه غير مستخدم وغير موجود في بنية الجدول
const findAll = async (search) => {
    let query = `SELECT * FROM ads`;

    // تم الإصلاح: تعريف المصفوفات قبل استخدامها
    const whereClauses = [];
    const queryParams = [];

    if (search) {
        whereClauses.push('(fr LIKE ? OR ar LIKE ?)');
        const searchParam = `%${search}%`;
        queryParams.push(searchParam, searchParam);
    }

    if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, queryParams);
    return rows;
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM ads WHERE id = ?', [id]);
    return rows[0];
};

const create = async (adData) => {
    const { fr, ar , status} = adData;

    const [result] = await pool.query(
        'INSERT INTO ads (fr, ar, status) VALUES (?, ?, ?)',
        [fr, ar, status]
    );

    const insertId = result.insertId;

    return { id: insertId, ...adData };
};

const update = async (id, adData) => {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(adData)) {
        if (key === 'id') continue;

        fields.push(`${key} = ?`);
        values.push(value); // تم الإصلاح: دفع القيمة إلى مصفوفة values
    }

    if (fields.length === 0) return false;

    values.push(id); // إضافة المعرف (id) في النهاية لشرط WHERE

    const sql = `UPDATE ads SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
};

const remove = async (id) => {
    // تم الإصلاح: تغيير اسم الجدول من reviews إلى ads
    const [result] = await pool.query('DELETE FROM ads WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = {
    findAll,
    findADS,
    findById,
    create,
    update,
    remove,
};