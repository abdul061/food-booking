import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import tableModel from '../models/tableModel.js';
import promoCodeModel from "../models/promoCodeModel.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//config variables
const currency = "inr";
const deliveryCharge = 50;
const frontend_URL = 'http://localhost:5173';


const allTables = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const orders = await orderModel.find({
          deliveryDateTime: {
            $gte: new Date(today),
            $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
          }
        });
    
        const bookedTables = orders.map(order => order.address.table).filter(Boolean);
        res.json({ bookedTables });
      } catch (error) {
        console.error("Error fetching booked tables:", error);
        res.status(400).json({ message: "Failed to fetch booked tables." });
      }
}// Placing User Order for Frontend using stripe
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address, table, deliveryDateTime } = req.body;

        // 1. Check if table exists
        const tableDoc = await tableModel.findOne({ tableId: table });
        if (!tableDoc) {
            return res.status(400).json({ success: false, message: "Selected table does not exist." });
        }

        // 2. Check if table is already booked
        if (tableDoc.status === "booked") {
            return res.status(400).json({ success: false, message: "This table is already booked." });
        }

        // 3. Proceed to create order
        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
            table,
            deliveryDateTime,
            payment: true
        });

        await newOrder.save();
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // 4. Update table status to 'booked'
        const tableModel = findOneAndUpdate(
            { tableId: table },
            {
                status: "booked",
                bookingInfo: {
                    orderId: newOrder._id,
                    userId,
                    deliveryDateTime
                }
            }
        );

        // 5. Create Stripe session
        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }));

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charge"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        });

        const session = await stripe.checkout.sessions.create({
            success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
};

// Placing User Order for Frontend using stripe
const placeOrderCod = async (req, res) => {

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            payment: true,
            deliveryDateTime:req.body.deliveryDateTime,
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}
const tableplaceOrderCod = async (req, res) => {
    try {
        const { userId, items, amount, address, table, deliveryDateTime } = req.body;
        console.log("Table:", table);

        // 1. Check if the table exists
        let tableDoc = await tableModel.findOne({ tableId: table });

        // 2. If the table doesn't exist, create it
        if (!tableDoc) {
            tableDoc = await tableModel.create({
                tableId: table,
                status: "available"  // Default status is available
            });
        }

        // 3. Prevent double-booking
        if (tableDoc.status === "booked") {
            return res.status(400).json({ success: false, message: "This table is already booked." });
        }

        // 4. Create the order
        const newOrder = new orderModel({
            userId,
            items,
            amount,
            address,
            table,
            deliveryDateTime,
            payment: true  // Mark as paid for COD
        });

        await newOrder.save();

        // 5. Clear the user's cart
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // 6. Mark the table as booked
        await tableModel.findOneAndUpdate(
            { tableId: table },
            {
                status: "booked",  // Mark table as booked
                bookingInfo: {
                    orderId: newOrder._id,
                    userId,
                    deliveryDateTime
                }
            }
        );

        // 7. Respond with success
        res.json({ success: true, message: "Order Placed Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error placing order" });
    }
};

// Listing Order for Admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const updateStatus = async (req, res) => {
    const { orderId, status: newStatus } = req.body;

    try {
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Don't update if already cancelled
        if (order.status === "Cancelled") {
            return res.json({ success: true, message: "Order is already cancelled. Status not updated." });
        }

        order.status = newStatus;
        await order.save();

        res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Paid" })
        }
        else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false, message: "Not Paid" })
        }
    } catch (error) {
        res.json({ success: false, message: "Not  Verified" })
    }

}
const validatePromoCode = async (req, res) => {
    const { promoCode } = req.body;

    try {
        // Find promo code in the database
        const promo = await promoCodeModel.findOne({ code: promoCode });

        if (!promo) {
            return res.json({ success: false, message: "Invalid promo code." });
        }

        // Check if promo code is expired
        if (new Date() > new Date(promo.expiresAt)) {
            return res.json({ success: false, message: "Promo code has expired." });
        }

        // Check if promo code is already used
        if (promo.status === 'used') {
            return res.json({ success: false, message: "Promo code already used." });
        }

        // Apply the discount
        const discountAmount = promo.discountAmount;

        // Optionally: Mark the promo code as used
        promo.status = 'used';
        await promo.save();

        res.json({ success: true, discountAmount });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Error validating promo code." });
    }
};


export { placeOrder, listOrders, userOrders, updateStatus, verifyOrder, placeOrderCod ,tableplaceOrderCod,validatePromoCode ,allTables}