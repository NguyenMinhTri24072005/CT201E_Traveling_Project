// gộp USER, PROFILE_CUSTOMER, PROFILE_PARTNER

const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Partner', 'Customer'], default: 'Customer' },
    commissionRate: { 
        type: Number, 
        default: 10,
        min: [0, 'Hoa hồng không được âm'],
        max: [100, 'Hoa hồng tối đa là 100%']
    },
    isTrusted: { 
        type: Boolean, 
        default: false 
    },
    commissionRate: {
        type: Number,
        default: 10 // Mặc định thu 10% hoa hồng
    },
    createat: { type: Date, required: true },
    //thông tin chi tiết (customer)
    fullname: { type: String },
    phone: { type: String },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    cccd: {
        type: String,
        default: ''
    },
    companyname: { type: String },
    taxcode: { type: String },
    address: {
        type: String,
        default: ""
    },
    isLocked: {
        type: Boolean,
        default: false // Mặc định tạo tài khoản là Không bị khóa
    },
    shopName: { type: String, default: '' },
    shopDescription: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    shopPolicies: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema)