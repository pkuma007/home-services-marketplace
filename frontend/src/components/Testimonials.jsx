import React from 'react';

const testimonials = [
  {
    quote: "RightBridge made finding a reliable plumber so easy! The service was professional, on-time, and the quality of work was exceptional. I'll definitely be using them for all my home service needs.",
    name: "Sarah L.",
    location: "Mumbai, MH"
  },
  {
    quote: "I was hesitant to book a cleaning service online, but RightBridge exceeded my expectations. The team was thorough, friendly, and my apartment has never looked better. Highly recommended!",
    name: "Arjun P.",
    location: "Delhi, DL"
  },
  {
    quote: "The electrician we booked through this platform was a true professional. He fixed a complex issue that others couldn't. The pricing was transparent and fair. Five stars!",
    name: "Priya K.",
    location: "Bengaluru, KA"
  }
];

export default function Testimonials() {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
              <p className="text-right font-bold text-gray-800">- {testimonial.name}</p>
              <p className="text-right text-sm text-gray-500">{testimonial.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
