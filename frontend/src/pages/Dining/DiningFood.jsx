import React, { useContext, useEffect, useState } from 'react';
import './Dining.css';
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
// <-- JWT decode imported

const DiningFood = () => {
    const [payment, setPayment] = useState("cod");
    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        phone: "",
        deliveryDate: "",
        deliveryTime: "",
        table: ""
    });

    const { getTotalCartAmount, token, food_list, cartItems, url, setCartItems, currency, deliveryCharge } = useContext(StoreContext);
    const navigate = useNavigate();

    // 🔓 Decode JWT token
    const decodedToken = token ? jwtDecode(token) : null;
    const userId = decodedToken?.id;

    const allTables = ["table1", "table2", "table3", "table4"];
    const [bookedTables, setBookedTables] = useState([]);

    useEffect(() => {
        const fetchBookedTables = async () => {
            try {
                const response = await axios.get(`${url}/api/order/booked`, { headers: { token } });
                if (response.data.success) {
                    setBookedTables(response.data.bookedTables);
                } else {
                    toast.error("Failed to fetch booked tables");
                }
            } catch (error) {
                toast.error("Error fetching booked tables");
            }
        };
        fetchBookedTables();
    }, [url, token]);

    const onChangeHandler = (event) => {
        const { name, value } = event.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const placeOrder = async (e) => {
        e.preventDefault();

        let orderItems = [];
        food_list.forEach((item) => {
            if (cartItems[item._id] > 0) {
                let itemInfo = { ...item, quantity: cartItems[item._id] };
                orderItems.push(itemInfo);
            }
        });

        const deliveryDateTime = new Date(`${data.deliveryDate}T${data.deliveryTime}`);

        const orderData = {
            address: { ...data },
            table: data.table,
            userId,
            items: orderItems,
            amount: getTotalCartAmount() + deliveryCharge,
            deliveryDateTime
        };

        try {
            const response = await axios.post(
                payment === "stripe"
                    ? `${url}/api/order/place`
                    : `${url}/api/order/tableplacecod`,
                orderData,
                { headers: { token } }
            );

            if (response.data.success) {
                if (payment === "stripe") {
                    window.location.replace(response.data.session_url);
                } else {
                    navigate("/myorders");
                    toast.success(response.data.message);
                    setCartItems({});
                }
            } else {
                toast.error("Something Went Wrong");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error placing order");
        }
    };

    useEffect(() => {
        if (!token) {
            toast.error("To place an order, sign in first");
            navigate('/cart');
        } else if (getTotalCartAmount() === 0) {
            navigate('/cart');
        }
    }, [token]);

    const [minDate, setMinDate] = useState('');
    const [minTime, setMinTime] = useState('');

    useEffect(() => {
        const now = new Date();
        const isoDate = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);
        setMinDate(isoDate);
        setMinTime(time);
    }, []);

    const onChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));

        if (name === 'deliveryDate') {
            const today = new Date().toISOString().split('T')[0];
            if (value !== today) {
                setMinTime('00:00');
            } else {
                const now = new Date().toTimeString().slice(0, 5);
                setMinTime(now);
            }
        }
    };

    return (
        <form onSubmit={placeOrder} className='place-order'>
            <div className="place-order-left">
                <p className='title'>User Information</p>

                <div className="multi-field">
                    <input type="text" name='firstName' onChange={onChangeHandler} value={data.firstName} placeholder='First name' required />
                    <input type="text" name='lastName' onChange={onChangeHandler} value={data.lastName} placeholder='Last name' required />
                </div>

                <input type="email" name='email' onChange={onChangeHandler} value={data.email} placeholder='Email address' required />
                <input type="text" name='phone' onChange={onChangeHandler} value={data.phone} placeholder='Phone' required />

                <div className="multi-field">
                    <label htmlFor="table">Select Table</label>
                    <select
                        name="table"
                        onChange={onChangeHandler}
                        value={data.table}
                        required
                        className='multi-field'
                    >
                        <option value="">Select a table</option>
                        {allTables.map(table => (
                            !bookedTables.includes(table) && (
                                <option key={table} value={table}>{table}</option>
                            )
                        ))}
                    </select>
                </div>

                <div className="multi-field">
                    <input
                        type="date"
                        name="deliveryDate"
                        onChange={onChange}
                        value={data.deliveryDate}
                        min={minDate}
                        required
                    />
                    <input
                        type="time"
                        name="deliveryTime"
                        onChange={onChange}
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
                        <div className="cart-total-details"><p>Subtotal</p><p>{currency}{getTotalCartAmount()}</p></div>
                        <hr />
                        <div className="cart-total-details"><p>Booking Fee</p><p>{currency}{getTotalCartAmount() === 0 ? 0 : deliveryCharge}</p></div>
                        <hr />
                        <div className="cart-total-details"><b>Total</b><b>{currency}{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + deliveryCharge}</b></div>
                    </div>
                </div>
                <div className="payment">
                    <h2>Payment Method</h2>
                    <div onClick={() => setPayment("cod")} className="payment-option">
                        <img src={payment === "cod" ? assets.checked : assets.un_checked} alt="" />
                        <p>COD ( Cash on Dining )</p>
                    </div>
                    <div onClick={() => setPayment("stripe")} className="payment-option">
                        <img src={payment === "stripe" ? assets.checked : assets.un_checked} alt="" />
                        <p>Stripe ( Credit / Debit )</p>
                    </div>
                </div>
                <button className='place-order-submit' type='submit'>
                    {payment === "cod" ? "Place Order" : "Proceed To Payment"}
                </button>
            </div>
        </form>
    );
};

export default DiningFood;
