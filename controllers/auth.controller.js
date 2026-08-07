const adminModel = require('../models/admin.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ==========================================
// 1. عمليات المصادقة (Authentication)
// ==========================================

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Username reçu:", username);

    const admin = await adminModel.findByUsername(username);
    console.log("Admin trouvé:", admin);

    if (!admin) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // مقارنة كلمة المرور المشفرة (Bcrypt) بدلاً من النص العادي لضمان الأمان
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, status: admin.status },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '4h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        status: admin.status
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la connexion" });
  }
};

const dashboard = (req, res) => {
  res.status(200).json({
    message: `Bienvenue ${req.user.username}`,
    adminData: req.user
  });
};

const verifyToken = (req, res) => {
  res.status(200).json({ valid: true, user: req.user });
};

const logout = (req, res) => {
  res.status(200).json({ message: "Déconnexion réussie" });
};


// ==========================================
// 2. عمليات التحكم والإدارة (Admin CRUD)
// ==========================================

// جلب قائمة جميع المديرين
const getAllAdmins = async (req, res) => {
  try {
    const admins = await adminModel.findAll();
    return res.status(200).json(admins);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la récupération des administrateurs" });
  }
};

// إنشاء حساب مدير جديد
const createAdmin = async (req, res) => {
  try {
    const { username, password, status } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis" });
    }

    // التحقق من عدم تكرار اسم المستخدم
    const existingAdmin = await adminModel.findByUsername(username);
    if (existingAdmin) {
      return res.status(400).json({ message: "Cet utilisateur existe déjà" });
    }

    // تشفير كلمة المرور الجديدة قبل تخزينها
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newAdminData = {
      username,
      password_hash,
      status: status || 'active'
    };

    const success = await adminModel.create(newAdminData);
    if (success) {
      return res.status(201).json({ message: "Administrateur créé avec succès" });
    } else {
      return res.status(400).json({ message: "Échec de la création de l'administrateur" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la création de l'administrateur" });
  }
};

// تحديث بيانات المدير (تعديل الاسم، الحالة، أو تغيير كلمة المرور)
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, status } = req.body;

    const existingAdmin = await adminModel.findById(parseInt(id));
    if (!existingAdmin) {
      return res.status(404).json({ message: "Administrateur non trouvé" });
    }

    const updateData = {};

    if (username) {
      // التأكد من أن الاسم الجديد غير محجوز لمدير آخر
      const checkUsername = await adminModel.findByUsername(username);
      if (checkUsername && checkUsername.id !== parseInt(id)) {
        return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris" });
      }
      updateData.username = username;
    }

    if (password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const success = await adminModel.update(parseInt(id), updateData);
    if (success) {
      return res.status(200).json({ message: "Administrateur mis à jour avec succès" });
    } else {
      return res.status(400).json({ message: "Échec de la mise à jour" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

// حذف حساب مدير
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // حماية إضافية: منع المدير من حذف حسابه الشخصي مباشرة عبر الـ API بدون قصد
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
    }

    const existingAdmin = await adminModel.findById(parseInt(id));
    if (!existingAdmin) {
      return res.status(404).json({ message: "Administrateur non trouvé" });
    }

    const success = await adminModel.delete(parseInt(id));
    if (success) {
      return res.status(200).json({ message: "Administrateur supprimé avec succès" });
    } else {
      return res.status(400).json({ message: "Échec de la suppression" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};


const statsAdmin = async (req, res) => {
  try {
    const stats = await adminModel.findStats();
    
    // إرجاع الحالة 200 مع بيانات الإحصائيات مباشرة
    return res.status(200).json(stats);

  } catch (error) {
    console.error(error);
    // تعديل رسالة الخطأ لتتناسب مع سياق جلب البيانات
    return res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
  }
};
// تصدير الدوال بالكامل لتضمين الـ CRUD الجديد
module.exports = {
  login,
  dashboard,
  verifyToken,
  logout,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  statsAdmin
};