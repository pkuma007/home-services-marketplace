import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import services from './data/services.js';
import User from './models/User.js';
import Service from './models/Service.js';
import Booking from './models/Booking.js';
import connectDB from './config/db.js';

// Correctly configure dotenv to find the .env file in the backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

connectDB();

const importData = async () => {
  try {
    // Define identifiers for sample data
    const sampleUserMobile = '9876543210';
    const adminUserMobile = '1234567890';
    const providerUserMobile = '9999888877';
    const sampleServiceTitles = services.map(s => s.title);

    // Find the sample user to delete their bookings first
    const sampleUser = await User.findOne({ mobileNumber: sampleUserMobile });
    if (sampleUser) {
      await Booking.deleteMany({ customer: sampleUser._id });
    }

    // Delete only the specific sample users and services to ensure a clean slate for them
    await User.deleteMany({ mobileNumber: { $in: [sampleUserMobile, adminUserMobile, providerUserMobile] } });
    await Service.deleteMany({ title: { $in: sampleServiceTitles } });

    // Create a sample customer
    const createdUser = await User.create({
      name: 'Sample Customer',
      mobileNumber: sampleUserMobile,
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
    });

    // Create the admin user
    await User.create({
      name: 'Admin User',
      mobileNumber: adminUserMobile,
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'admin',
      isAdmin: true,
    });

    // Create a service provider user
    const providerUser = await User.create({
      name: 'Suresh Kumar',
      mobileNumber: providerUserMobile,
      email: 'suresh@provider.com',
      password: '123456',
      role: 'service_provider'
    });

    // Assign the new provider to all sample services
    const servicesWithProvider = services.map(service => ({
      ...service,
      provider: providerUser._id
    }));

    // Import services and get the created documents
    const createdServices = await Service.insertMany(servicesWithProvider);

    // Create a sample booking for the sample customer
    await Booking.create({
      customer: createdUser._id,
      service: createdServices[0]._id, 
      date: new Date(),
      address: '123 Sample St, Sample City, 12345',
      notes: 'Please ring the doorbell upon arrival.',
      quantity: 1,
      status: 'confirmed',
    });

    console.log('Sample data has been refreshed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Service.deleteMany();
    await User.deleteMany();
    await Booking.deleteMany(); 

    console.log('All Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
