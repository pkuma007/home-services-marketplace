import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';

const getMinDate = () => {
  const today = new Date();
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(today.getDate() + 2);
  return twoDaysFromNow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { openLoginModal } = useUI();
  const navigate = useNavigate();

  const [date, setDate] = useState(getMinDate());
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

  useEffect(() => {
    if (!userInfo) {
      openLoginModal();
    } else if (cartItems.length === 0) {
      navigate('/services');
    }
  }, [userInfo, navigate, cartItems, openLoginModal]);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Create a booking for each item in the cart
      for (const item of cartItems) {
        const bookingDetails = {
          serviceId: item._id,
          quantity: item.qty,
          date,
          address,
          notes: `${item.title} - ${notes}`.trim(),
        };
        await axios.post('/api/bookings', bookingDetails, config);
      }

      clearCart();
      navigate('/my-bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
      setLoading(false);
    }
  };

  // The form is now always rendered, and the modal will appear on top if the user is not logged in.
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
          <ul className="space-y-2">
            {cartItems.map((item) => (
              <li key={item._id} className="flex justify-between">
                <span>{item.title} (x{item.qty})</span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <h2 className="text-2xl font-semibold mb-4">Booking Details</h2>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="date">Preferred Date</label>
            <input
              type="date"
              id="date"
              className="w-full p-3 border rounded-lg"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getMinDate()} // Prevent selecting past dates
              required
              disabled={!userInfo} // Disable form if not logged in
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="address">Address</label>
            <textarea
              id="address"
              className="w-full p-3 border rounded-lg"
              rows="3"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              disabled={!userInfo} // Disable form if not logged in
            ></textarea>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              className="w-full p-3 border rounded-lg"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!userInfo} // Disable form if not logged in
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700" disabled={loading || !userInfo}>
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
