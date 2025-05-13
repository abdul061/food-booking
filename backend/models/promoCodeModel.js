import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true },
    discountAmount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // Optional
    used: { type: Boolean, default: false },
});

export default mongoose.model("PromoCode", promoCodeSchema);
