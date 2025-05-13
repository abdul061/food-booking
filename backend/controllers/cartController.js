import userModel from "../models/userModel.js";

// Add to user cart  
const addToCart = async (req, res) => {
   try {
      const userData = await userModel.findById(req.body.userId);
      if (!userData) return res.status(404).json({ success: false, message: "User not found" });

      let cartData = userData.cartData || {};
      cartData[req.body.itemId] = (cartData[req.body.itemId] || 0) + 1;

      await userModel.findByIdAndUpdate(req.body.userId, { cartData });
      res.json({ success: true, message: "Added to cart" });
   } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error adding to cart" });
   }
};
const updateCart = async (req, res) => {
   try {
     let userData = await userModel.findById(req.user.id);
     let cartData = userData.cartData;
     cartData[req.body.itemId] = req.body.quantity;
     await userModel.findByIdAndUpdate(req.user.id, { cartData });
     res.json({ success: true, message: "Cart updated" });
   } catch (error) {
     console.log(error);
     res.json({ success: false, message: "Error updating cart" });
   }
 };

// Remove food from user cart
const removeFromCart = async (req, res) => {
   try {
      const userData = await userModel.findById(req.body.userId);
      if (!userData) return res.status(404).json({ success: false, message: "User not found" });

      let cartData = userData.cartData || {};
      if (cartData[req.body.itemId] > 0) {
         cartData[req.body.itemId] -= 1;
      }

      await userModel.findByIdAndUpdate(req.body.userId, { cartData });
      res.json({ success: true, message: "Removed from cart" });
   } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error removing from cart" });
   }
};

// Get user cart
const getCart = async (req, res) => {
   try {
      const userData = await userModel.findById(req.body.userId);
      if (!userData) return res.status(404).json({ success: false, message: "User not found" });

      const cartData = userData.cartData || {};
      res.json({ success: true, cartData });
   } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error fetching cart" });
   }
};

export { addToCart, removeFromCart, getCart , updateCart};
