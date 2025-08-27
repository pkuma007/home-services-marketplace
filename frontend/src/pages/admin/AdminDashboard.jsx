import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserGroupIcon, ChartBarIcon, ClockIcon, CalendarIcon, CogIcon } from '@heroicons/react/24/outline';
import BookingsTab from '../components/admin/Bookings/BookingsTab';
import CustomersTab from '../components/admin/Customers/CustomersTab';
import ServicesTab from '../components/admin/Services/ServicesTab';
import ProvidersTab from '../components/admin/Providers/ProvidersTab';
import ReportsTab from '../components/admin/Reports/ReportsTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('unassigned');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Tabs configuration
  const tabs = [
    { id: 'unassigned', name: 'Unassigned', icon: ClockIcon },
    { id: 'all', name: 'All Bookings', icon: CalendarIcon },
    { id: 'services', name: 'Services', icon: CogIcon },
    { id: 'providers', name: 'Providers', icon: UserGroupIcon },
    { id: 'customers', name: 'Customers', icon: UserGroupIcon },
    { id: 'reports', name: 'Reports', icon: ChartBarIcon },
  ];

  // Check admin authentication
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }
    setIsLoading(false);
  }, [navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'unassigned':
      case 'all':
        return <BookingsTab showUnassigned={activeTab === 'unassigned'} />;
      case 'services':
        return <ServicesTab />;
      case 'providers':
        return <ProvidersTab />;
      case 'customers':
        return <CustomersTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
