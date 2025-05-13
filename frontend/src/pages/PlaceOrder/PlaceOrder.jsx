import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
 // Corrected named import
import QRCode from 'react-qr-code';


const PlaceOrder = () => {
  const initialData = {
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
    deliveryDate: '',
    deliveryTime: '',
  };

  const [payment, setPayment] = useState('cod');
  const [data, setData] = useState(initialData);
  const [minDate, setMinDate] = useState('');
  const [minTime, setMinTime] = useState('');
  const [upiUrl, setUpiUrl] = useState('');

  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    url,
    setCartItems,
    currency,
    deliveryCharge,
  } = useContext(StoreContext);

  const navigate = useNavigate();

  useEffect(() => {
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    setMinDate(isoDate);
    setMinTime(time);
  }, []);

  useEffect(() => {
    if (!token) {
      toast.error('To place an order, sign in first');
      navigate('/cart');
    } else if (getTotalCartAmount() === 0) {
      navigate('/cart');
    }
  }, [token]);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));

    if (name === 'deliveryDate') {
      const today = new Date().toISOString().split('T')[0];
      setMinTime(value !== today ? '00:00' : new Date().toTimeString().slice(0, 5));
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();

    const orderItems = food_list
      .filter((item) => cartItems[item._id] > 0)
      .map((item) => ({
        ...item,
        quantity: cartItems[item._id],
      }));

    const deliveryDateTime = new Date(`${data.deliveryDate}T${data.deliveryTime}`);

    const orderData = {
      address: { ...data },
      items: orderItems,
      amount: getTotalCartAmount() + deliveryCharge,
      deliveryDateTime,
    };

    try {
      const response = await axios.post(url + '/api/order/placecod', orderData, {
        headers: { token },
      });

      if (response.data.success) {
        setCartItems({});
        setData(initialData);
        toast.success(response.data.message);

        // UPI Payment details
        const upiId = '9345621965@ptaxis';
        const payeeName = 'Santhirakumar Vetrivel';
        const amount = getTotalCartAmount() + deliveryCharge;
        const transactionNote = 'Order Payment';

        // Create UPI URL
        const generatedUpiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
          payeeName
        )}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
        // alert("Scan the below Qr code  to complete payment")
        setUpiUrl(generatedUpiUrl); // Set UPI URL in state

        // Redirect user to the generated UPI URL with a fallback option
        window.location.href = generatedUpiUrl; // Opens UPI app directly in supported browsers
      } else {
        toast.error('Something went wrong!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error placing order!');
    }
  };

  return (
    <form onSubmit={placeOrder} className="place-order">
      <div className="place-order-left">
        <p className="title">User Information</p>
        <div className="multi-field">
          <input
            type="text"
            name="firstName"
            onChange={onChangeHandler}
            value={data.firstName}
            placeholder="First name"
            required
          />
          <input
            type="text"
            name="lastName"
            onChange={onChangeHandler}
            value={data.lastName}
            placeholder="Last name"
            required
          />
        </div>
        <input
          type="email"
          name="email"
          onChange={onChangeHandler}
          value={data.email}
          placeholder="Email address"
          required
        />
        <input
          type="text"
          name="phone"
          onChange={onChangeHandler}
          value={data.phone}
          placeholder="Phone"
          required
        />

        <div className="multi-field">
          <label>Dining</label>
          <input type="radio" name="orderType" value="dining" />
          <label>TakeAway</label>
          <input type="radio" name="orderType" value="takeaway" />
        </div>

        <div className="multi-field">
          <input
            type="date"
            name="deliveryDate"
            onChange={onChangeHandler}
            value={data.deliveryDate}
            min={minDate}
            required
          />
          <input
            type="time"
            name="deliveryTime"
            onChange={onChangeHandler}
            value={data.deliveryTime}
            min={minTime}
            required
          />
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>
                {currency}
                {getTotalCartAmount()}
              </p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Booking Fee</p>
              <p>
                {currency}
                {getTotalCartAmount() === 0 ? 0 : deliveryCharge}
              </p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>
                {currency}
                {getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryCharge}
              </b>
            </div>
          </div>
        </div>

        <div className="payment">
          <h2>Payment Method</h2>
          <div onClick={() => setPayment('cod')} className="payment-option">
            <img src={payment === 'cod' ? assets.checked : assets.un_checked} alt="" />
            <p>GPay / UPI</p>
          </div>
        </div>

        <button className="place-order-submit" type="submit">
          Place Order & Pay
        </button>

        {upiUrl && (
          <>
            <QRCode value={upiUrl} size={128} level="H" includeMargin={true} />
            <a
              href={upiUrl}
              className="upi-payment-button"
              target="_blank"
              rel="noopener noreferrer"

            >
            </a>
          </>
        )}
      </div>
    </form>
  );
};

export default PlaceOrder;
