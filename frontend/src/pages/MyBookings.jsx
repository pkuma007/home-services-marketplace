import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userInfo = useMemo(() => (
    localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null
  ), []);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('/api/bookings/my', config);
        // Sort bookings by creation date, newest first
        const sortedBookings = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(sortedBookings);
      } catch (err) {
        setError('Could not fetch bookings.');
      }
      setLoading(false);
    };

    fetchBookings();
  }, [userInfo, navigate]);

  if (loading) return <div className="p-4 text-center">Loading bookings...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'pending':
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="text-center">
          <p className="text-lg text-gray-600">You have no bookings yet.</p>
          <Link to="/services" className="text-blue-600 hover:underline mt-2 inline-block">
            Browse services and make your first booking!
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <img 
                  src={booking.service.image || '/placeholder.jpg'} 
                  alt={booking.service.title} 
                  className="w-full md:w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">{booking.service.title}</h2>
                    <p className={`text-sm font-bold px-3 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </p>
                  </div>
                  <p className="text-gray-600 mb-4">Booked on: {new Date(booking.createdAt).toLocaleDateString()}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                    <p><strong>Preferred Date:</strong> {new Date(booking.date).toLocaleDateString()}</p>
                    <p><strong>Quantity:</strong> {booking.quantity || 1}</p>
                    <p><strong>Price per Item:</strong> ₹{booking.service.price.toFixed(2)}</p>
                    <p><strong>Total Price:</strong> ₹{(booking.service.price * (booking.quantity || 1)).toFixed(2)}</p>
                    <p className="sm:col-span-2"><strong>Address:</strong> {booking.address}</p>
                    {booking.notes && <p className="sm:col-span-2 italic"><strong>Notes:</strong> {booking.notes}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
