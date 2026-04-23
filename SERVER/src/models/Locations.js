const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true }, // LOCATION_Name 
    imgLink: { type: String }               // LOCATION_ImgLink 
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);