import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ServiceDetail() {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  const userInfo = localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null;

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await axios.get(`/api/services/${id}`);
        setService(data);
      } catch (err) {
        setError('Service not found');
      }
      setLoading(false);
    };

    fetchService();
  }, [id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!service) return <div className="p-4">Service not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <img className="w-full h-64 object-cover" src={service.image || '/placeholder.jpg'} alt={service.title} />
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
          <p className="text-gray-600 text-lg mb-4">${service.price}</p>
          <p className="text-gray-700 mb-4">{service.description}</p>
          <p className="text-gray-500 mb-6">Category: {service.category}</p>
          
          {userInfo ? (
            <Link 
              to={`/book/${service._id}`}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
            >
              Book Now
            </Link>
          ) : (
            <p className="text-red-500">
              Please <Link to={`/login?redirect=/services/${id}`} className="font-bold underline">login</Link> to book this service.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
