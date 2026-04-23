const Cart = require('../models/Cart.js')

const cartControllers = {
    addToCart: async (req, res) => {
        try {
            const customerId = req.user.id;
            const { tourId, tickets } = req.body;
            console.log("tourid: ", tourId)
            console.log("tickets: ", tickets)

            let cart = await Cart.findOne({ customer: customerId });

            if (!cart) {
                console.log("lần đầu")
                cart = new Cart({
                    customer: customerId,
                    items: [
                        {
                            tour: tourId,
                            tickets
                        }
                    ]
                })
            } else {
                cart.items.push({
                    tour: tourId,
                    tickets
                })
            }

            await cart.save();
            res.status(200).json({
                message: "đã thêm vào giỏ hàng",
                cart
            })
        } catch (error) {
            res.status(500).json(error.message);
        }
    },
    getCart: async (req, res) => {
        try {
            const cart = Cart.findOne({ customer: req.user.id })
                .populate('items.tour')
            if (!cart) return res.status(200).json({ items: [] });
            res.status(200).json(cart)
        } catch (error) {
            res.status(500).json(error.message)
        }
    },
    removeFromCart: async (req, res) => {
        try {
            const { itemId } = req.params;
            console.log(itemId)
            await Cart.findOneAndUpdate(
                { customer: req.user.id },
                { $pull: { items: { tour: itemId } } }
            );
            res.status(200).json('Đã xóa khỏi giỏ hàng')
        } catch (error) {
            res.status(500).json(error.message)
        }
    }
}

module.exports = cartControllers;

