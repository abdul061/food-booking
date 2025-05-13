import React, { useContext, useState } from 'react';
import './Cart.css';
import { StoreContext } from '../../Context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Cart = () => {
  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url, currency, deliveryCharge, updateCartItemQuantity } = useContext(StoreContext);
  const navigate = useNavigate();

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');

  const handlePromoSubmit = async () => {
    try {
      const response = await axios.post(`${url}/api/order/validate-promo`, { promoCode });
      if (response.data.success) {
        setDiscount(response.data.discountAmount);
        setError('');
        alert(`Promo code applied! You get ₹${response.data.discountAmount} off.`);
      } else {
        setDiscount(0);
        setError('Invalid promo code.');
      }
    } catch (err) {
      setDiscount(0);
      setError('Error validating promo code.');
    }
  };

  const handleIncrease = (itemId) => {
    updateCartItemQuantity(itemId, cartItems[itemId] + 1);
  };

  const handleDecrease = (itemId) => {
    if (cartItems[itemId] > 1) {
      updateCartItemQuantity(itemId, cartItems[itemId] - 1);
    }
  };

  const subtotal = getTotalCartAmount();
  const fee = subtotal === 0 ? 0 : deliveryCharge;
  const total = subtotal + fee - discount;

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p><p>Title</p><p>Price</p><p>Quantity</p><p>Total</p><p>Remove</p>
        </div>
        <hr />
        {food_list.map((item, index) => (
          cartItems[item._id] > 0 && (
            <div key={index} className="cart-items-item">
              <img src={`${url}/images/${item.image}`} alt={item.name} />
              <p>{item.name}</p>
              <p>{currency}{item.price}</p>
              <div className="cart-items-quantity">
                <button className="quantity-btn" onClick={() => handleDecrease(item._id)}>-</button>
                <span>{cartItems[item._id]}</span>
                <button className="quantity-btn" onClick={() => handleIncrease(item._id)}>+</button>
              </div>
              <p>{currency}{item.price * cartItems[item._id]}</p>
              <button className='cart-items-remove-icon' onClick={() => removeFromCart(item._id)}>x</button>
              <hr />
            </div>
          )
        ))}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details"><p>Subtotal</p><p>{currency}{subtotal}</p></div>
            <hr />
            <div className="cart-total-details"><p>Booking Fee</p><p>{currency}{fee}</p></div>
            <hr />
            {discount > 0 && (
              <div className="cart-total-details"><p>Discount</p><p>-{currency}{discount}</p></div>
            )}
            {discount > 0 && <hr />}
            <div className="cart-total-details"><b>Total</b><b>{currency}{total}</b></div>
          </div>
          <button onClick={() => navigate('/order')}>PROCEED TO CHECKOUT</button>
        </div>
        <div className="cart-promocode">
          <p>If you have a promo code, enter it here</p>
          <div className='cart-promocode-input'>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder='Promo code'
            />
            <button onClick={handlePromoSubmit}>Apply</button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Cart;
