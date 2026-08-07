const reviewModel = require('../models/review.model');

// Public GET + Admin GET (مع دعم الفلترة)
const getAllReviews = async (req, res) => {
  try {
    const { search } = req.query;
    console.log(search)

    const reviews = await reviewModel.findAll(search);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin CRUD

// إضافة مراجعة جديدة
const createReview = async (req, res) => {
  try {
    const { product_id, order_id, name, rating, comment, lang, status } = req.body;

    // التحقق من الحقول المطلوبة
    if (!product_id) return res.status(400).json({ message: 'Product ID is required' });
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!comment) return res.status(400).json({ message: 'Comment is required' });
    if (!lang) return res.status(400).json({ message: 'Languge is required' });

    // إنشاء المراجعة بحقولها الجديدة
    const newReview = await reviewModel.create({
      product_id: Number(product_id),
      order_id: Number(order_id),
      name,
      rating: Number(rating) || 5,
      comment,
      lang: lang || 'fr',
      status: status || 'Private'
    });

    res.status(201).json(newReview);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};

// تحديث مراجعة موجودة
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, order_id, name, rating, comment, lang, status } = req.body;

    // التأكد من وجود المراجعة أولاً
    const review = await reviewModel.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // دمج البيانات الجديدة مع البيانات القديمة في حال لم يتم إرسال بعض الحقول
    const updatedData = {
      product_id: product_id !== undefined ? Number(product_id) : review.product_id,
      order_id: Number(order_id),
      name: name || review.name,
      rating: rating !== undefined ? Number(rating) : review.rating,
      comment: comment || review.comment,
      lang: lang || 'fr',
      status: status || review.status
    };

    const updated = await reviewModel.update(id, updatedData);

    if (updated) {
      res.json({ message: 'Review updated successfully', data: { id, ...updatedData } });
    } else {
      res.status(400).json({ message: 'Update failed' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// حذف مراجعة
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await reviewModel.remove(id);

    if (deleted) res.json({ message: 'Review deleted successfully' });
    else res.status(404).json({ message: 'Review not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllReviews, createReview, updateReview, deleteReview };