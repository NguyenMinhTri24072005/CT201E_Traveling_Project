const express = require('express');
const router = express.Router();
const Location = require('../models/Locations');

// Lấy tất cả
router.get('/', async (req, res) => {
    try { res.status(200).json(await Location.find({})); } 
    catch (err) { res.status(500).json(err); }
});

// Thêm mới
router.post('/', async (req, res) => {
    try { res.status(201).json(await Location.create(req.body)); } 
    catch (err) { res.status(500).json(err); }
});

// Cập nhật
router.put('/:id', async (req, res) => {
    try { res.status(200).json(await Location.findByIdAndUpdate(req.params.id, req.body, { new: true })); } 
    catch (err) { res.status(500).json(err); }
});

// Xóa
router.delete('/:id', async (req, res) => {
    try { 
        await Location.findByIdAndDelete(req.params.id);
        res.status(200).json("Đã xóa điểm đến"); 
    } catch (err) { res.status(500).json(err); }
});

module.exports = router;