import mongoose from "mongoose";
const tableSchema = new mongoose.Schema({
    tableId: { type: String, required: false },  // e.g., "table1"
    status: { type: String, default: "available" },  // available or booked
    bookingInfo: { type: Object, default: null }  // optional: store order info when booked
});

const tableModel = mongoose.models.table || mongoose.model("table", tableSchema);
export default tableModel;
