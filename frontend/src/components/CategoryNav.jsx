import React from 'react';
import { MdOutlineBlender, MdOutlineCleaningServices, MdFace } from 'react-icons/md';
import { FaWrench } from 'react-icons/fa';

const categories = [
  {
    name: 'Appliances Care',
    icon: <MdOutlineBlender className="text-4xl text-blue-500" />,
  },
  {
    name: 'Home Care',
    icon: <MdOutlineCleaningServices className="text-4xl text-green-500" />,
  },
  {
    name: 'Beauty Care',
    icon: <MdFace className="text-4xl text-pink-500" />,
  },
  {
    name: 'Handyman',
    icon: <FaWrench className="text-4xl text-orange-500" />,
  },
];

const CategoryNav = () => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">What are you looking for?</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category.name}
            className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center justify-center text-center"
          >
            {category.icon}
            <p className="mt-2 font-semibold text-gray-800 text-sm">{category.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryNav;
