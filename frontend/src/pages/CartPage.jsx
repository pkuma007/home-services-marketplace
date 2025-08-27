import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';

export default function CartPage() {
  const { cartItems, addToCart, decreaseCartItem, removeFromCart } = useCart();
  const { openLoginModal } = useUI();
  const navigate = useNavigate();
  const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  const checkoutHandler = () => {
    if (userInfo) {
      navigate('/checkout');
    } else {
      openLoginModal();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty. <Link to="/services" className="text-blue-600">Go Shopping</Link></p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {cartItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md mb-4">
                <div className="flex items-center">
                  <img src={item.image || '/placeholder.jpg'} alt={item.title} className="w-20 h-20 object-cover rounded-md mr-4" />
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-600">₹{item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => decreaseCartItem(item)} className="px-3 py-1 text-lg font-semibold hover:bg-gray-100 rounded-l-lg">-</button>
                    <span className="px-4 py-1 font-semibold">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="px-3 py-1 text-lg font-semibold hover:bg-gray-100 rounded-r-lg">+</button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item._id)}
                    className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100"
                    title="Remove item"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-2xl font-bold mb-4">Cart Summary</h2>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Total Items</span>
              <span className="font-bold">{cartItems.reduce((acc, item) => acc + item.qty, 0)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-semibold">Total Price</span>
              <span className="font-bold text-xl">₹{total.toFixed(2)}</span>
            </div>
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-xl font-bold">Total: ₹{cartItems.reduce((acc, item) => acc + item.qty * item.price, 0).toFixed(2)}</h2>
              <button 
                onClick={checkoutHandler}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
