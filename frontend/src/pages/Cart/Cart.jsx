import React, { useContext } from 'react';
import './Cart.css';
import { StoreContext } from '../../Context/StoreContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url, currency, deliveryCharge, updateCartItemQuantity } = useContext(StoreContext);
  const navigate = useNavigate();

  // Function to handle adding to the quantity
  const handleIncrease = (itemId) => {
    updateCartItemQuantity(itemId, cartItems[itemId] + 1); // Increase the quantity by 1
  };

  // Function to handle decreasing the quantity
  const handleDecrease = (itemId) => {
    if (cartItems[itemId] > 1) {
      updateCartItemQuantity(itemId, cartItems[itemId] - 1); // Decrease the quantity by 1, but not below 1
    }
  };

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p> <p>Title</p> <p>Price</p> <p>Quantity</p> <p>Total</p> <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={index}>
                <div className="cart-items-title cart-items-item">
                  <img src={url + "/images/" + item.image} alt="" />
                  <p>{item.name}</p>
                  <p>{currency}{item.price}</p>
                  <div className="cart-items-quantity">
                    <button className="quantity-btn" onClick={() => handleDecrease(item._id)}>-</button>
                    <div>{cartItems[item._id]}</div>
                    <button className="quantity-btn" onClick={() => handleIncrease(item._id)}>+</button>
                  </div>
                  <p>{currency}{item.price * cartItems[item._id]}</p>
                  <p className='cart-items-remove-icon' onClick={() => removeFromCart(item._id)}>x</p>
                </div>
                <hr />
              </div>
            );
          }
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details"><p>Subtotal</p><p>{currency}{getTotalCartAmount()}</p></div>
            <hr />
            <div className="cart-total-details"><p>Delivery Fee</p><p>{currency}{getTotalCartAmount() === 0 ? 0 : deliveryCharge}</p></div>
            <hr />
            <div className="cart-total-details"><b>Total</b><b>{currency}{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryCharge}</b></div>
          </div>
          <button onClick={() => navigate('/diningfood')}>PROCEED TO DINING</button>
          <button onClick={() => navigate('/order')}>PROCEED TO TAKE AWAY</button>
        </div>
        
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            <div className='cart-promocode-input'>
              <input type="text" placeholder='promo code'/>
              <button>Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
