const orderModel = require('../models/order.model');
const orderItemModel = require('../models/orderItem.model');

const productModel = require('../models/product.model');

const shippingFee = Number(process.env.SHIPPING_FEE);
const freeShipping = Number(process.env.FREE_SHIPPING_FROM);


const createOrderManger = async (req, res) => {
  try {
    // 1. استقبال البيانات، بما في ذلك السعر المرسل من الواجهة الأمامية للتحقق منه
    const {
      full_name,
      phone,
      address,
      email,
      items,
      lang,
      status,
      price
    } = req.body;



    if (!full_name || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Tous les champs sont obligatoires, y compris le prix total." });
    }

    let calculatedTotal = 0;
    const verifiedCartItems = [];

    for (const item of items) {
      const pId = parseInt(item.product_id);

      if (!pId) {
        return res.status(400).json({ message: "ID de produit invalide dans la commande." });
      }

      const dbProduct = await productModel.findById(pId);
      if (!dbProduct) {
        return res.status(404).json({ message: `Produit avec ID ${pId} non trouvé.` });
      }
      const dbPrice = parseFloat(dbProduct.price);
      const qty = parseInt(item.quantity) || 1;

      calculatedTotal += dbPrice * qty;

      verifiedCartItems.push({
        product_id: pId,
        // نقوم بتنظيف الاسم قبل حفظه
        name: typeof dbProduct.name === 'string' ? cleanJsonString(dbProduct.name) : dbProduct.name,
        image: dbProduct.img,
        size: typeof item.size === 'string' ? cleanJsonString(item.size) : item.size,
        color: typeof item.color === 'string' ? cleanJsonString(item.color) : item.color,
        quantity: qty,
        price: dbPrice
      });


    }


    const actualShippingFee = calculatedTotal >= freeShipping ? 0 : shippingFee;
    // 6. إنشاء الطلب الرئيسي
    const newOrder = await orderModel.create({
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      address: address.trim(),
      price: calculatedTotal,
      status: status || 'pending',
      lang: lang || 'fr',
      shipping_fee: actualShippingFee // تخزين الشحن في عمود منفصل
    });

    const orderId = newOrder.id || newOrder.insertId;

    // 7. إدخال المنتجات المؤكدة باستخدام Promise.all لتحسين الأداء
    const orderItemsPromises = verifiedCartItems.map(verifiedItem =>
      orderItemModel.create({
        order_id: orderId,
        product_name: verifiedItem.name,
        product_id: verifiedItem.product_id,
        image: verifiedItem.image,
        size: verifiedItem.size,
        color: verifiedItem.color,
        quantity: verifiedItem.quantity,
        price: verifiedItem.price
      })
    );

    await Promise.all(orderItemsPromises);

    res.status(201).json({
      message: "Commande créée et vérifiée avec succès !",
      orderId: orderId
    });

  } catch (error) {
    console.error("Critical Checkout Error:", error);
    res.status(500).json({ message: "Erreur lors de la création de la commande." });
  }
};
const getAllOrders = async (req, res) => {
  try {
    const { search } = req.query;

    // تمرير قيمة البحث إلى الـ model
    const orders = await orderModel.findAll();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Erreur dans getAllOrders:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
  }
};

const getLastOrder = async (req, res) => {
  try {
    const orders = await orderModel.findAll();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Erreur dans getAllOrders:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
  }
};

const getOrderBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const order = await orderModel.findById(slug);

    res.status(200).json(order);
  } catch (error) {
    console.error("Erreur dans getAllOrders:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des commandes" });
  }
};



const createOrder = async (req, res) => {
  try {

    const {
      full_name,
      phone,
      address,
      email,
      items,
      lang,
      client_price,
    } = req.body;
    let { status } = req.body;

    if (!status) {
      status = "pending"

    }


    if (!full_name || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {

      return res.status(400).json({ message: "Tous les champs sont obligatoires, y compris le prix total." });
    }

    let calculatedTotal = 0;
    const verifiedCartItems = [];

    // 3. جلب المنتجات من قاعدة البيانات وحساب الإجمالي الفعلي
    for (const item of items) {
      const pId = parseInt(item.product_id);

      if (!pId) {
        return res.status(400).json({ message: "ID de produit invalide dans la commande." });
      }

      const dbProduct = await productModel.findById(pId);
      if (!dbProduct) {
        return res.status(404).json({ message: `Produit avec ID ${pId} non trouvé.` });
      }

      const dbPrice = parseFloat(dbProduct.price);
      const qty = parseInt(item.quantity) || 1;

      calculatedTotal += dbPrice * qty;

      verifiedCartItems.push({
        product_id: pId,
        // نقوم بتنظيف الاسم قبل حفظه
        name: typeof dbProduct.name === 'string' ? cleanJsonString(dbProduct.name) : dbProduct.name,
        image: dbProduct.img,
        size: typeof item.size === 'string' ? cleanJsonString(item.size) : item.size,
        color: typeof item.color === 'string' ? cleanJsonString(item.color) : item.color,
        quantity: qty,
        price: dbPrice
      });

    }



    if (Number(client_price) !== calculatedTotal) {
      return res.status(400).json({
        message: "Écart de prix détecté. Les données ont pu être modifiées.",
        expected: calculatedTotal,
        received: client_price
      });
    }

    const actualShippingFee = calculatedTotal >= freeShipping ? 0 : shippingFee;

    const newOrder = await orderModel.create({
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      address: address.trim(),
      price: calculatedTotal,
      status: status || 'pending',
      lang: lang || 'fr',
      shipping_fee: actualShippingFee
    });

    const orderId = newOrder.id || newOrder.insertId;

    const orderItemsPromises = verifiedCartItems.map(verifiedItem =>

      orderItemModel.create({
        order_id: orderId,
        product_name: verifiedItem.name,
        image: verifiedItem.image,
        product_id: verifiedItem.product_id,
        size: verifiedItem.size,
        color: verifiedItem.color,
        quantity: verifiedItem.quantity,
        price: verifiedItem.price
      })
    );

    await Promise.all(orderItemsPromises);

    res.status(201).json({
      message: "Commande créée et vérifiée avec succès !",
      orderId: orderId
    });

  } catch (error) {
    console.error("Critical Checkout Error:", error);
    res.status(500).json({ message: "Erreur lors de la création de la commande." });
  }
};





const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const { status, full_name, email, phone, address, quantity, lang, items, shipping_fee } = req.body;

    const existingOrder = await orderModel.findById(parseInt(id));
    if (!existingOrder) {
      return res.status(404).json({ message: "Commande introuvable" });
    }

    const updateData = {};
    let verifiedCartItems = []; 

    // 1. Calculate new totals and prepare the new items if they were provided
    if (items && Array.isArray(items)) {
      let calculatedTotal = 0;

      for (const item of items) {
        const pId = parseInt(item.product_id);

        if (!pId) {
          return res.status(400).json({ message: "ID de produit invalide dans la commande." });
        }

        const dbProduct = await productModel.findById(pId);
        if (!dbProduct) {
          return res.status(404).json({ message: `Produit avec ID ${pId} non trouvé.` });
        }

        const dbPrice = parseFloat(dbProduct.price);
        const qty = parseInt(item.quantity) || 1;

        calculatedTotal += dbPrice * qty;
        
        verifiedCartItems.push({
          product_id: pId,
          // نقوم بتنظيف الاسم قبل حفظه
          name: typeof dbProduct.name === 'string' ? cleanJsonString(dbProduct.name) : dbProduct.name,
          image: dbProduct.img,
          size: typeof item.size === 'string' ? cleanJsonString(item.size) : item.size,
          color: typeof item.color === 'string' ? cleanJsonString(item.color) : item.color,
          quantity: qty,
          price: dbPrice
        });
      }

      // Uses your global process.env variables (freeShipping and shippingFee)
      const actualShippingFee = calculatedTotal >= freeShipping ? 0 : shippingFee;
      
      updateData.price = calculatedTotal;
      updateData.shipping_fee = actualShippingFee;
    }

    // 2. Validate and apply other updates
    if (status !== undefined) {
      const validStatuses = ['stocked', 'pending', 'shipped', 'succeeded', 'canceled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Statut invalide" });
      }
      updateData.status = status;
    }

    if (full_name !== undefined) updateData.full_name = full_name;
    if (lang !== undefined) updateData.lang = lang;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);

    if (shipping_fee !== undefined && updateData.shipping_fee === undefined) {
      updateData.shipping_fee = parseFloat(shipping_fee);
    }

    if (Object.keys(updateData).length === 0 && verifiedCartItems.length === 0) {
      return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
    }

    // 3. Update the main order
    let success = true;
    if (Object.keys(updateData).length > 0) {
      success = await orderModel.update(parseInt(id), updateData);
    }

    if (success) {
      await orderItemModel.removeByOrderID(id)

      // 4. Update the items in the relational table IF new items were provided
      if (verifiedCartItems.length > 0) {
     
        // Step B: Insert the new updated items using the same logic as createOrder
        const orderItemsPromises = verifiedCartItems.map(verifiedItem =>
          orderItemModel.create({
            order_id: parseInt(id),
            product_name: verifiedItem.name,
            image: verifiedItem.image,
            product_id: verifiedItem.product_id,
            size: verifiedItem.size,
            color: verifiedItem.color,
            quantity: verifiedItem.quantity,
            price: verifiedItem.price
          })
        );
        
        await Promise.all(orderItemsPromises);
      }

      const updatedOrder = await orderModel.findById(parseInt(id));
      res.status(200).json(updatedOrder);
    } else {
      res.status(400).json({ message: "Aucune modification appliquée ou échec de la mise à jour" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la commande" });
  }
};







const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await orderModel.findById(parseInt(id));
    if (!existing) {
      return res.status(404).json({ message: "Commande introuvable" });
    }
    const deleted = await orderModel.remove(parseInt(id));
    if (deleted) {
      res.status(200).json({ message: "Commande supprimée avec succès" });
    } else {
      res.status(400).json({ message: "Échec de la suppression" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression de la commande" });
  }
};

const getBlackList = async (req, res) => {
  try {
    const orders = await orderModel.getBlackList();
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des commandes par statut" });
  }
};


// دالة لتنظيف النصوص التي تحتوي على JSON متداخل
const cleanJsonString = (str) => {
  if (typeof str !== 'string') return str;
  // إذا كان النص يبدأ بـ { أو [، نحاول فك التشفير مرة واحدة
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      // إزالة علامات التنصيص الزائدة إذا وجدت في البداية والنهاية
      let cleaned = str.replace(/^"|"$/g, '').replace(/\\"/g, '"');
      return JSON.parse(cleaned);
    } catch (e) {
      return str;
    }
  }
  return str;
};

module.exports = {

  getAllOrders,
  getLastOrder,
  getOrderBySlug,
  createOrder,
  createOrderManger,
  updateOrder,
  deleteOrder,
  getBlackList
};