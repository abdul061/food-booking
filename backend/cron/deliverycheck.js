import orderModel from "../models/orderModel.js";
import promoCodeModel from "../models/promoCodeModel.js";
import nodemailer from "nodemailer";

// Setup mail transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// Promo code generator
const generatePromoCode = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const checkOrders = async () => {
    const now = new Date();

    try {
        const pendingOrders = await orderModel.find({
            status: { $ne: "Delivered" },
            deliveryDateTime: { $lte: now },
        });

        for (const order of pendingOrders) {
            // Skip if the order is already cancelled
            if (order.status === "Cancelled") {
                console.log(`⚠️ Order ${order._id} is already cancelled, skipping.`);
                continue;
            }

            const userEmail = order.address.email;
            const userName = order.address.firstName;
            const promoCode = generatePromoCode();

            // Half of the order amount as discount
            const discountAmount = order.amount / 2;

            // Save promo code to DB
            await promoCodeModel.create({
                code: promoCode,
                userEmail,
                discountAmount,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Optional: valid for 7 days
            });

            // Send email
            const mailOptions = {
                from: process.env.MAIL_USER,
                to: userEmail,
                subject: "We're Sorry That you order has been cancelled because you havent come yet , We are giving you a POMOCODE to get offer on your or your friends next order it will only valid for 12 hours",
                text: `Hi ${userName},\n\n We apologize for the order cancellation , order cancelled because you are not reached for the proper time ${order.deliveryDateTime}.\n\nAs a token of our apology, here's a promo code just for you:\n\n🔖 Promo Code: ${promoCode}\n💸 Discount: ₹${discountAmount.toFixed(2)} off your next order\n\nThis promo code is valid for 2 days and will be automatically applied during your next purchase.\n\nThank you for your patience.\n- Tomatto Team`,
            };

            await transporter.sendMail(mailOptions);
            console.log(`📧 Promo mail sent to ${userEmail} with ₹${discountAmount} off`);

            // Cancel the order
            order.status = "Cancelled";
            await order.save();
            console.log(`❌ Order ${order._id} marked as Cancelled`);
        }
    } catch (err) {
        console.error("❌ Error checking orders:", err);
    }
};

export default checkOrders;
