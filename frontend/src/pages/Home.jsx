import { useState, useEffect } from 'react';
import axios from 'axios';
import Hero from "../components/Hero";
import ServiceCard from "../components/ServiceCard";
import Testimonials from '../components/Testimonials';
import { FloatingWhatsApp } from 'react-floating-whatsapp';

export default function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await axios.get('/api/services');
        setServices(data);
      } catch (err) {
        setError('Failed to fetch services.');
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  return (
    <div>
      <Hero />
      <div className="container mx-auto p-4">
        <h3 className="text-2xl font-bold text-center my-6">Our Services</h3>
        {loading ? (
          <p className="text-center p-4">Loading services...</p>
        ) : error ? (
          <p className="text-center p-4 text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.length > 0 ? (
              services.map((service) => (
                <ServiceCard key={service._id} service={service} />
              ))
            ) : (
              <p className="text-center col-span-3">No services found.</p>
            )}
          </div>
        )}
      </div>
      <Testimonials />
      <FloatingWhatsApp
        phoneNumber="9716319351"
        accountName="RightBridge Support"
        statusMessage="Typically replies within 1 hour"
        chatMessage="Hello there! 🤝 How can we help you today?"
        placeholder="Type a message..."
      />
    </div>
  );
}
