const adModel = require('../models/ad.model');

// Public GET + Admin GET (مع دعم الفلترة)
const getAllADS = async (req, res) => {
  try {
    const { search } = req.query;

    // تم التعديل: استخدام adModel بدلاً من reviewModel
    const ads = await adModel.findAll(search);
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getADS = async (req, res) => {
    try {
  
      const ads = await adModel.findADS();
      res.json(ads);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  
// Admin CRUD

// إضافة إعلان جديد
const createAD = async (req, res) => {
  try {
    // تم التعديل: استقبال الحقول الموجودة فعلياً في جدول الإعلانات
    const { fr, ar, status } = req.body;

    // التحقق من الحقول المطلوبة (يمكنك تعديل هذا الشرط حسب احتياجك)
    // هنا نفترض أنه يجب إدخال لغة واحدة على الأقل
    if (!fr && !ar) {
        return res.status(400).json({ message: 'French or Arabic text is required' });
    }

    // إنشاء الإعلان
    const newAd = await adModel.create({ fr, ar });

    res.status(201).json(newAd);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تحديث إعلان موجود
const updateAD = async (req, res) => {
  try {
    const { id } = req.params;
    const { fr, ar, status } = req.body;

    // التأكد من وجود الإعلان أولاً
    const ad = await adModel.findById(id);
    if (!ad) return res.status(404).json({ message: 'AD not found' });

    // دمج البيانات الجديدة مع البيانات القديمة في حال لم يتم إرسال بعض الحقول
    const updatedData = {
      fr: fr !== undefined ? fr : ad.fr,
      ar: ar !== undefined ? ar : ad.ar,
      status: status !== undefined ? status : ad.status
    };

    const updated = await adModel.update(id, updatedData);
    
    if (updated) {
      res.json({ message: 'AD updated successfully', data: { id, ...updatedData } });
    } else {
      res.status(400).json({ message: 'Update failed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// حذف إعلان
const deleteAD = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await adModel.remove(id);
    
    if (deleted) res.json({ message: 'AD deleted successfully' });
    else res.status(404).json({ message: 'AD not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllADS, getADS, createAD, updateAD, deleteAD };