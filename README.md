# RightBridge - Home Services Marketplace

A full-stack home services marketplace platform connecting customers with service providers.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### For Customers
- Browse and search for services
- View service provider profiles and reviews
- Book and manage appointments
- Real-time chat with service providers
- Secure payment processing

### For Service Providers
- Create and manage service listings
- Handle booking requests
- Manage availability calendar
- Receive payments
- Customer communication

### For Administrators
- User management
- Service category management
- Booking and payment monitoring
- Platform analytics

## Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v6
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **Real-time**: Socket.IO
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **File Upload**: Multer
- **Email**: Nodemailer
- **Validation**: Express Validator
- **Logging**: Morgan
- **Real-time**: Socket.IO

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher) or Yarn
- MongoDB (v5 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pkuma007/home-services-marketplace.git
   cd home-services-marketplace
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## Environment Variables

### Backend (`.env` in the backend folder)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/rightbridge
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_email_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env` in the frontend folder)
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd ../frontend
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
rightbridge/
├── backend/               # Backend server code
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── .env              # Environment variables
│   └── server.js         # Main server file
│
├── frontend/             # Frontend React application
│   ├── public/           # Static files
│   ├── src/
│   │   ├── assets/       # Images, fonts, etc.
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context providers
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service functions
│   │   ├── styles/       # Global styles
│   │   ├── utils/        # Utility functions
│   │   ├── App.jsx       # Main App component
│   │   └── main.jsx      # Entry point
│   ├── .env              # Frontend environment variables
│   └── vite.config.js    # Vite configuration
│
├── .gitignore
└── README.md
```

## Frontend API Services

The frontend uses a centralized API service (`src/services/api.js`) to interact with the backend. Here are the available API methods:

### Authentication
```javascript
import { authAPI } from '../services/api';

// Login user
const { data } = await authAPI.login(email, password);

// Register new user
const { data } = await authAPI.register(userData);

// Get current user profile
const { data } = await authAPI.getProfile();
```

### Users
```javascript
import { usersAPI } from '../services/api';

// Get all users (admin only)
const { data } = await usersAPI.getUsers();

// Get user by ID
const { data } = await usersAPI.getUser(userId);

// Update user
const { data } = await usersAPI.updateUser(userId, userData);

// Delete user
await usersAPI.deleteUser(userId);

// Get user statistics
const { data } = await usersAPI.getUserStats();
```

### Bookings
```javascript
import { bookingsAPI } from '../services/api';

// Get all bookings (admin only)
const { data } = await bookingsAPI.getBookings();

// Get booking by ID
const { data } = await bookingsAPI.getBooking(bookingId);

// Update booking status
const { data } = await bookingsAPI.updateBookingStatus(bookingId, 'confirmed');

// Assign provider to booking
const { data } = await bookingsAPI.assignProvider(bookingId, providerId);
```

### Services
```javascript
import { servicesAPI } from '../services/api';

// Get all services
const { data } = await servicesAPI.getServices();

// Get service by ID
const { data } = await servicesAPI.getService(serviceId);

// Create new service (admin only)
const { data } = await servicesAPI.createService(serviceData);

// Update service (admin only)
const { data } = await servicesAPI.updateService(serviceId, serviceData);

// Delete service (admin only)
await servicesAPI.deleteService(serviceId);

// Get service statistics
const { data } = await servicesAPI.getServiceStats();
```

### Reports & Analytics
```javascript
import { reportsAPI } from '../services/api';

// Get dashboard statistics
const { data } = await reportsAPI.getDashboardStats();

// Get booking statistics
const { data } = await reportsAPI.getBookingStats('month');

// Get provider metrics
const { data } = await reportsAPI.getProviderMetrics();

// Get service distribution
const { data } = await reportsAPI.getServiceDistribution();

// Get booking trends
const { data } = await reportsAPI.getBookingTrends('year');

// Get revenue analytics
const { data } = await reportsAPI.getRevenueAnalytics({
  startDate: '2023-01-01',
  endDate: '2023-12-31'
});
```

### Real-time Socket Service
```javascript
import { connectSocket, getSocket, disconnectSocket } from '../services/socket';

// Connect to socket server
const socket = connectSocket();

// Get the socket instance
const socket = getSocket();

// Listen for events
socket.on('booking:created', (booking) => {
  console.log('New booking:', booking);
});

// Disconnect socket when done
disconnectSocket();
```

## Backend API Documentation

### Authentication
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/api/users/register` | Register a new user | Public |
| `POST` | `/api/users/login` | Login user | Public |
| `GET` | `/api/users/me` | Get current user profile | Required |

### Users
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/api/users` | Get all users | Admin |
| `GET` | `/api/users/providers` | Get all service providers | Public |
| `GET` | `/api/users/skills` | Get user's skills | Required |
| `PUT` | `/api/users/skills` | Update user's skills | Required |

### Services
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/api/services` | Get all services | Public |
| `POST` | `/api/services` | Create a new service | Admin |
| `GET` | `/api/services/:id` | Get service by ID | Public |
| `PUT` | `/api/services/:id` | Update service | Admin |
| `DELETE` | `/api/services/:id` | Delete service | Admin |

### Bookings
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/api/bookings` | Create a new booking | Customer |
| `GET` | `/api/bookings/my` | Get current user's bookings | Required |
| `GET` | `/api/bookings` | Get all bookings (admin) | Admin |
| `GET` | `/api/bookings/unassigned` | Get unassigned bookings | Admin |
| `PUT` | `/api/bookings/:id` | Update booking status | Admin |
| `PUT` | `/api/bookings/:id/assign-provider` | Assign provider to booking | Admin |
| `GET` | `/api/bookings/provider` | Get provider's bookings | Provider |
| `PUT` | `/api/bookings/:id/status` | Update booking status | Provider |

### Admin
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/api/admin/stats` | Get dashboard statistics | Admin |
| `GET` | `/api/admin/bookings` | Get all bookings | Admin |
| `PUT` | `/api/admin/bookings/:id/status` | Update booking status | Admin |
| `PUT` | `/api/admin/bookings/:id/assign-provider` | Assign provider to booking | Admin |
| `GET` | `/api/admin/analytics/services` | Get service statistics | Admin |
| `GET` | `/api/admin/analytics/revenue` | Get revenue analytics | Admin |

### Reports
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/api/reports/bookings` | Generate bookings report | Admin |
| `GET` | `/api/reports/revenue` | Generate revenue report | Admin |
| `GET` | `/api/reports/users` | Generate users report | Admin |

### Skills
| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/api/skills` | Get all skills | Public |
| `POST` | `/api/skills` | Create a new skill | Admin |
| `PUT` | `/api/skills/:id` | Update skill | Admin |
| `DELETE` | `/api/skills/:id` | Delete skill | Admin |

**Note**: 
- `Public` - No authentication required
- `Required` - Valid JWT token required
- `Admin` - Admin privileges required
- `Customer` - Customer role required
- `Provider` - Service Provider role required

## Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended for production)
2. Configure environment variables in your hosting platform
3. Deploy to your preferred hosting (e.g., Heroku, AWS, DigitalOcean)

### Frontend Deployment
1. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `dist` folder to a static hosting service (Vercel, Netlify, or AWS S3)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Pravin Kumar - pravin.jhablu@gmail.com

Project Link: [https://github.com/pkuma007/home-services-marketplace(https://github.com/pkuma007/home-services-marketplace)
