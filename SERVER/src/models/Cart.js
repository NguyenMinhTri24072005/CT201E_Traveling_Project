const mongoose = require('mongoose')
const Tour = require('../models/Tours.js')
const User = require('../models/Users.js')

const cartSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    items: [
        {
            tour: {
                type: mongoose.Types.ObjectId,
                ref: 'Tour',
                required: true
            },
            tickets: [
                {
                    ticketType: String,
                    quantity: Number,
                    unitPrice: Number
                }
            ],
            addedat: {
                type: Date,
                default: Date.now
            }
        }
    ]
})

module.exports = mongoose.model('Cart', cartSchema)