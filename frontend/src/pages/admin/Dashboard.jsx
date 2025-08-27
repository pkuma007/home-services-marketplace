import React, { useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { StatsGrid } from '../../components/admin/StatsGrid';
import { RecentBookings } from '../../components/admin/RecentBookings';
import { UsersTable } from '../../components/admin/UsersTable';
import { RevenueChart } from '../../components/admin/RevenueChart';

const Dashboard = () => {
  const { 
    dashboard, 
    users, 
    fetchDashboardStats, 
    fetchUsers 
  } = useAdmin();

  useEffect(() => {
    fetchDashboardStats();
    fetchUsers({ page: 1, limit: 5 });
  }, [fetchDashboardStats, fetchUsers]);

  if (dashboard.loading && !dashboard.stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (dashboard.error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{dashboard.error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <StatsGrid stats={dashboard.stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Revenue Overview</h2>
          <div className="h-80">
            <RevenueChart data={dashboard.revenueData} />
          </div>
        </div>
        
        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Bookings</h2>
            <a href="/admin/bookings" className="text-blue-600 hover:underline text-sm">
              View All
            </a>
          </div>
          <RecentBookings />
        </div>
      </div>
      
      {/* Users Table */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Users</h2>
          <a href="/admin/users" className="text-blue-600 hover:underline">
            View All Users
          </a>
        </div>
        <UsersTable 
          users={Array.isArray(users.data) ? users.data : []}
          loading={users.loading}
          error={users.error}
        />
      </div>
    </div>
  );
};

export default Dashboard;
