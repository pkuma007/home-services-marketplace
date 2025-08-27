import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginModal({ isOpen, onClose }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/users/login', { identifier, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setError('');
      onClose(); // Close modal on successful login
      if (data.isAdmin) {
        navigate('/admin/dashboard');
      } else if (data.role === 'service_provider') {
        navigate('/provider/dashboard');
      } else {
        window.location.reload(); // Refresh for regular users
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={submitHandler}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="identifier">Mobile or Email</label>
            <input
              type="text"
              id="identifier"
              placeholder="Enter your mobile or email"
              className="w-full p-3 border rounded-lg"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter password"
              className="w-full p-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 mb-4">Login</button>
          <div className="text-center mb-4">
            <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot Password?</a>
          </div>
          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              onClose();
              navigate('/register');
            }}
            className="w-full bg-white border-2 border-blue-600 text-blue-600 p-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Create New Account
          </button>
        </form>
      </div>
    </div>
  );
}
