import React from 'react';
import { FaStar, FaUsers } from 'react-icons/fa';

const Stats = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        {/* Service Rating Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-yellow-100 p-3 rounded-full">
            <FaStar className="text-yellow-500 text-2xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">4.5</p>
            <p className="text-sm text-gray-600">Service Rating</p>
          </div>
        </div>

        {/* Customer Globally Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-blue-100 p-3 rounded-full">
            <FaUsers className="text-blue-500 text-2xl" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">30 Lacs+</p>
            <p className="text-sm text-gray-600">Customer Globally</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
