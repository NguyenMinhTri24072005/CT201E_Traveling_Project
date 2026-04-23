const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true }, // CATEGORY_Name 
    description: { type: String }           // CATEGORY_Description 
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);