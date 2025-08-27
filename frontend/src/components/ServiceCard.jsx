import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ServiceCard({ service }) {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    e.stopPropagation(); // Stop the click from bubbling up to the Link
    addToCart(service);
  };

  return (
    <Link to={`/service/${service._id}`} className="block border p-4 rounded shadow hover:shadow-lg transition-shadow duration-200">
      <img src={service.image || '/placeholder.jpg'} alt={service.title} className="w-full h-40 object-cover"/>
      <h3 className="text-lg font-bold mt-2">{service.title}</h3>
      <p className="text-sm text-gray-600">{service.category}</p>
      <p className="font-semibold text-lg mt-1">${service.price}</p>
      <button 
        onClick={handleAddToCart}
        className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-300"
      >
        Add to Cart
      </button>
    </Link>
  );
}
