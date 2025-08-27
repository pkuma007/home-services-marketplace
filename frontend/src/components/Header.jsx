import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { FaSearch } from 'react-icons/fa';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const { cartItems } = useCart();
  const { openLoginModal } = useUI();
  const navigate = useNavigate();
  const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/services?q=${searchTerm}`);
      setSearchTerm('');
    } else {
      navigate('/services');
    }
  };

  return (
    <header className="bg-white text-gray-800 p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left Side: Brand and Main Navigation */}
        <div className="flex items-center space-x-8">
          <Link to="/">
            <img src="/logo.png" alt="RightBridge Logo" className="h-10" />
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-blue-600 transition duration-200 font-medium">Home</Link>
            
            {userInfo && userInfo.isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="hover:text-blue-600 transition duration-200 font-medium">Dashboard</Link>
                <Link to="/admin/bookings" className="hover:text-blue-600 transition duration-200 font-medium">Bookings</Link>
                <Link to="/admin/services" className="hover:text-blue-600 transition duration-200 font-medium">Services</Link>
                <Link to="/admin/customers" className="hover:text-blue-600 transition duration-200 font-medium">Customers</Link>
              </>
            ) : (
              <Link to="/services" className="hover:text-blue-600 transition duration-200 font-medium">Services</Link>
            )}
          </nav>
        </div>

        {/* Right Side: Search, Contact, and User Actions */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center border rounded-lg overflow-hidden">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              className="px-3 py-1.5 focus:outline-none text-sm"
            />
            <button type="submit" className="p-2 bg-gray-100 hover:bg-gray-200">
              <FaSearch className="text-gray-600" />
            </button>
          </form>

          {/* Contact Number */}
          <div className="hidden md:block font-semibold text-gray-700">+91-1234567890</div>

          <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 transition duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            {cartItems.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartItems.reduce((acc, item) => acc + item.qty, 0)}</span>
            )}
          </Link>

          {userInfo ? (
            <div className="relative group">
              <button className="font-semibold focus:outline-none flex items-center space-x-1 p-2 rounded-full hover:bg-gray-100 transition duration-200">
                <span>{userInfo.name}</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
              <div className="absolute right-0 pt-2 w-48 bg-transparent z-20 hidden group-hover:block">
                <div className="bg-white rounded-md shadow-lg py-1">
                  {userInfo.isAdmin ? (
                    <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Dashboard</Link>
                  ) : userInfo.role === 'service_provider' ? (
                    <Link to="/provider/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Dashboard</Link>
                  ) : (
                    <Link to="/my-bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Bookings</Link>
                  )}
                  <button onClick={logoutHandler} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={openLoginModal} className="hover:text-blue-600 transition duration-200 font-medium">Login</button>
          )}
        </div>
      </div>
    </header>
  );
}
