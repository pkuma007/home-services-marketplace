import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FaClock, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return <FaCheckCircle className="mr-1" />;
    case 'cancelled':
      return <FaTimesCircle className="mr-1" />;
    case 'pending':
      return <FaClock className="mr-1" />;
    case 'in_progress':
      return <FaSpinner className="animate-spin mr-1" />;
    default:
      return <FaClock className="mr-1" />;
  }
};

const RecentBookings = () => {
  // This would typically come from props or context
  const recentBookings = [];
  const loading = false;
  const error = null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        Error loading recent bookings: {error}
      </div>
    );
  }

  if (!recentBookings?.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No recent bookings found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentBookings.slice(0, 5).map((booking) => (
        <div key={booking._id} className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              {getStatusIcon(booking.status)}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {booking.service?.name || 'Service'}
              </div>
              <div className="text-sm text-gray-500">
                {booking.customer?.name || 'Customer'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              ${booking.totalAmount?.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-gray-500">
              {format(new Date(booking.scheduledDate), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      ))}
      <div className="text-center mt-4">
        <Link 
          to="/admin/bookings" 
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View all bookings →
        </Link>
      </div>
    </div>
  );
};

export default RecentBookings;
