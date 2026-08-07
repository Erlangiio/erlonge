const inventoryModel = require('../models/inventory.model');

// ==================== PUBLIC METHODS ====================

const getAllInventory = async (req, res) => {
  try {
    const { search } = req.query;
    const inventory = await inventoryModel.findAll(search);
    res.status(200).json(inventory);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
};
const getAllInventoryByProducts = async (req, res) => {
  try {
    const { search } = req.query;
    const inventory = await inventoryModel.findAllByProducts(search);
    res.status(200).json(inventory);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur lors de la récupération" });
  }
};
const createInventory = async (req, res) => {
  try {
    const { product_id, color, color_fr, color_ar, size, size_fr, size_ar, quantity } = req.body;
    
    const success = await inventoryModel.saveOrUpdate(
      product_id, color, color_fr, color_ar, size, size_fr, size_ar, quantity
    );

    if (success) {
      res.status(201).json({ message: "تمت إضافة المتغير بنجاح" });
    } else {
      res.status(400).json({ message: "فشل في حفظ البيانات" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur lors de la création" });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, color, color_fr, color_ar, size, size_fr, size_ar, quantity } = req.body;

    const success = await inventoryModel.updateById(id, {
      product_id, color, color_fr, color_ar, size, size_fr, size_ar, quantity
    });

    if (success) {
      res.status(200).json({ message: "تم تحديث المتغير بنجاح" });
    } else {
      res.status(404).json({ message: "العنصر غير موجود" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await inventoryModel.deleteById(id);

    if (success) {
      res.status(200).json({ message: "تم حذف المتغير بنجاح" });
    } else {
      res.status(404).json({ message: "العنصر غير موجود" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};

module.exports = {
  getAllInventory,
  getAllInventoryByProducts,
  createInventory,
  updateInventory,
  deleteInventory
};