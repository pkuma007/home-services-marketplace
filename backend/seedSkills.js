import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import Skill from './models/Skill.js';

dotenv.config();

const skills = [
  {
    name: 'AC Repair',
    description: 'Professional air conditioning repair and maintenance services',
    category: 'home_repair'
  },
  {
    name: 'Home Cleaning',
    description: 'Thorough home cleaning services for all areas of your home',
    category: 'cleaning'
  },
  {
    name: 'Plumbing',
    description: 'Expert plumbing services including leaks, clogs, and installations',
    category: 'plumbing'
  },
  {
    name: 'Electrical',
    description: 'Professional electrical services including wiring, repairs, and installations',
    category: 'electrical'
  },
  {
    name: 'Carpentry',
    description: 'Custom carpentry and woodworking services',
    category: 'home_repair'
  },
  {
    name: 'Painting',
    description: 'Interior and exterior painting services',
    category: 'home_repair'
  },
  {
    name: 'Appliance Repair',
    description: 'Repair services for home appliances',
    category: 'home_repair'
  },
  {
    name: 'Pest Control',
    description: 'Professional pest control and extermination services',
    category: 'other'
  }
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Skill.deleteMany();
    await Skill.insertMany(skills);

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Skill.deleteMany();

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
