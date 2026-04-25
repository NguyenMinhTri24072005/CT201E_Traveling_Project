const express = require('express');
const router = express.Router();
const Category = require('../models/Categorys');

// Lấy tất cả
router.get('/', async (req, res) => {
    try { res.status(200).json(await Category.find({})); } 
    catch (err) { res.status(500).json(err); }
});

// Thêm mới
router.post('/', async (req, res) => {
    try { res.status(201).json(await Category.create(req.body)); } 
    catch (err) { res.status(500).json(err); }
});

// Cập nhật
router.put('/:id', async (req, res) => {
    try { res.status(200).json(await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })); } 
    catch (err) { res.status(500).json(err); }
});

// Xóa
router.delete('/:id', async (req, res) => {
    try { 
        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json("Đã xóa danh mục"); 
    } catch (err) { res.status(500).json(err); }
});

module.exports = router;