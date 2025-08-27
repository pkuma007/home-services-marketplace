import React from 'react';
import CategoryNav from './CategoryNav';
import Stats from './Stats';

const Hero = () => {
  return (
    <div className="bg-white pt-12 pb-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Content */}
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
              <span className="text-blue-600">Home Services,</span>
              <br />
              Delivered to your doorstep.
            </h1>
            <div className="w-24 h-1.5 bg-purple-500 mt-4 mb-8 mx-auto md:mx-0"></div>
            
            <CategoryNav />
            <Stats />
          </div>

          {/* Right Column: Image Grid */}
          <div className="hidden md:grid grid-cols-2 gap-4">
            <div className="col-span-1 row-span-2">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                alt="Service Professional 1"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            </div>
            <div className="col-span-1">
              <img 
                src="https://content.jdmagicbox.com/comp/def_content/tv-repair-and-services-thomson/affrkmo7xp-tv-repair-and-services-thomson-6-6oce6.jpg"
                alt="Indian TV Repair Professional"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            </div>
            <div className="col-span-1">
              <img 
                src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
                alt="Service Professional 3"
                className="w-full h-full object-cover rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
