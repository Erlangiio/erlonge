const listModel = require('../models/list.model');

// Public GET + Admin GET (مع دعم الفلترة)
const getAllLISTS = async (req, res) => {
  try {
    const { search } = req.query;
    console.log(search)

    const lists = await listModel.findAll(search);
    res.json(lists);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};

const createLIST = async (req, res) => {
    console.log("post list")
  try {
    const { email, lang, status, object, msg } = req.body;
 
    const newAd = await listModel.create({ email, lang, status, object, msg });

    res.status(201).json(newAd);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};

const updateLIST = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang, email, status, object, msg } = req.body;

    const list = await listModel.findById(id);
    if (!list) return res.status(404).json({ message: 'LIST not found' });

    const updatedData = {
      lang: lang !== undefined ? lang : list.lang,
      status: status !== undefined ? status : list.status,
      email: email !== undefined ? email : list.email,
      object: object !== undefined ? object : list.object,
      msg: msg !== undefined ? msg : list.msg
    };

    const updated = await listModel.update(id, updatedData);
    
    if (updated) {
      res.json({ message: 'LIST updated successfully', data: { id, ...updatedData } });
    } else {
      res.status(400).json({ message: 'Update failed' });
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
};

// حذف إعلان
const deleteLIST = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await listModel.remove(id);
    
    if (deleted) res.json({ message: 'LIST deleted successfully' });
    else res.status(404).json({ message: 'LIST not found' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllLISTS, createLIST, updateLIST, deleteLIST };