import React from 'react';
import { 
  FaUsers, 
  FaClipboardCheck, 
  FaMoneyBillWave, 
  FaTools 
} from 'react-icons/fa';

const StatCard = ({ icon, title, value, change, changeType }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${getIconBgColor(changeType)} text-white mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {change !== undefined && (
              <span className={`ml-2 text-sm font-medium ${
                changeType === 'increase' ? 'text-green-500' : 'text-red-500'
              }`}>
                {changeType === 'increase' ? '↑' : '↓'} {change}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getIconBgColor = (changeType) => {
  switch(changeType) {
    case 'increase':
      return 'bg-green-500';
    case 'decrease':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

export const StatsGrid = ({ stats }) => {
  if (!stats) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        icon={<FaUsers className="text-xl" />}
        title="Total Users"
        value={stats.totalUsers || 0}
        change={12.5}
        changeType="increase"
      />
      <StatCard 
        icon={<FaClipboardCheck className="text-xl" />}
        title="Total Bookings"
        value={stats.totalBookings || 0}
        change={8.3}
        changeType="increase"
      />
      <StatCard 
        icon={<FaMoneyBillWave className="text-xl" />}
        title="Total Revenue"
        value={stats.totalRevenue ? formatCurrency(stats.totalRevenue) : '$0'}
        change={15.2}
        changeType="increase"
      />
      <StatCard 
        icon={<FaTools className="text-xl" />}
        title="Active Services"
        value={stats.activeServices || 0}
        change={-2.1}
        changeType="decrease"
      />
    </div>
  );
};

export default StatsGrid;
