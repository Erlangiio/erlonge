const pool = require('../config/db');

// تم إزالة مُعامل lang لأنه غير مستخدم وغير موجود في بنية الجدول (في الكود القديم)
const findAll = async (search) => {
    let query = `SELECT * FROM lists`;

    // تم الإصلاح: تعريف المصفوفات قبل استخدامها
    const whereClauses = [];
    const queryParams = [];

    if (search) {
        // تم إضافة object و msg للبحث داخلهما
        whereClauses.push('(email LIKE ? OR status LIKE ? OR lang LIKE ? OR object LIKE ? OR msg LIKE ?)');
        const searchParam = `%${search}%`;
        queryParams.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, queryParams);
    return rows;
};

const findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM lists WHERE id = ?', [id]);
    return rows[0];
};

const create = async (listData) => {
    console.log(listData)
    // 1. استخراج object و msg من البيانات المُمررة
    const { email, lang, status, object, msg } = listData;

    // 2. تحديث استعلام الإدخال (INSERT) ليشمل الحقول الجديدة وعلامات الاستفهام (?)
    const [result] = await pool.query(
        'INSERT INTO lists (email, lang, status, object, msg) VALUES (?, ?, ?, ?, ?)',
        [email, lang, status, object, msg]
    );

    const insertId = result.insertId;

    return { id: insertId, ...listData };
};

const update = async (id, listData) => {
    const fields = [];
    const values = [];

    // هذه الدالة ديناميكية، لذا ستتعامل مع الحقول الجديدة (object, msg) تلقائيًا
    // بمجرد تمريرها في كائن listData دون الحاجة لتعديل الكود هنا.
    for (const [key, value] of Object.entries(listData)) {
        if (key === 'id') continue;

        fields.push(`${key} = ?`);
        values.push(value); // تم الإصلاح: دفع القيمة إلى مصفوفة values
    }

    if (fields.length === 0) return false;

    values.push(id); // إضافة المعرف (id) في النهاية لشرط WHERE

    const sql = `UPDATE lists SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
};

const remove = async (id) => {
    // تم الإصلاح: تغيير اسم الجدول من reviews إلى lists
    const [result] = await pool.query('DELETE FROM lists WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
};