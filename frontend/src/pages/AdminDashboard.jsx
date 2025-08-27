import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  UserCircleIcon,
  ArrowPathIcon,
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  UserPlusIcon,
  XCircleIcon, 
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ServiceFormModal from '../components/ServiceFormModal';
import { connectSocket, getSocket } from '../services/socket';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Helper function to get status badge class
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'assigned':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Mock data for demonstration
const MOCK_REPORT_DATA = {
  bookings: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [12, 19, 3, 5, 2, 3],
  },
  revenue: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [1200, 1900, 300, 500, 200, 300],
  },
  serviceDistribution: [
    { name: 'Plumbing', value: 35 },
    { name: 'Electrical', value: 25 },
    { name: 'Cleaning', value: 20 },
    { name: 'Carpentry', value: 15 },
    { name: 'Other', value: 5 },
  ],
  providerPerformance: [
    { name: 'John D.', completed: 12, rating: 4.8 },
    { name: 'Sarah M.', completed: 8, rating: 4.9 },
    { name: 'Mike T.', completed: 5, rating: 4.5 },
    { name: 'Emma W.', completed: 3, rating: 4.7 },
  ],
};

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('unassigned');
  const [reportRange, setReportRange] = useState('week');
  const [reportData, setReportData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // State for modals and expanded views
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    services: [],
    isActive: true
  });
  const [serviceInput, setServiceInput] = useState('');
  
  // Service modal handlers
  const handleOpenModal = (service = null) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  // Save service (create or update)
  const handleSaveService = async (serviceData) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`
        }
      };

      if (serviceData._id) {
        // Update existing service
        const { data: updatedService } = await axios.put(
          `/api/services/${serviceData._id}`,
          serviceData,
          config
        );
        setServices(services.map(s => s._id === updatedService._id ? updatedService : s));
        toast.success('Service updated successfully');
      } else {
        // Create new service
        const { data: newService } = await axios.post(
          '/api/services',
          serviceData,
          config
        );
        setServices([...services, newService]);
        toast.success('Service created successfully');
      }
      
      handleCloseModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save service';
      toast.error(message);
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`
          }
        };
        await axios.delete(`/api/services/${serviceId}`, config);
        setServices(services.filter(s => s._id !== serviceId));
        toast.success('Service deleted successfully');
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete service';
        toast.error(message);
      }
    }
  };

  // State for customer modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    isActive: true
  });

  const navigate = useNavigate();
  const userInfo = useMemo(() => (
    localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null
  ), []);

  // Tabs for the admin dashboard
  const [tabs] = useState([
    { id: 'unassigned', name: 'Unassigned', icon: ClockIcon },
    { id: 'all', name: 'All Bookings', icon: CalendarIcon },
    { id: 'services', name: 'Services', icon: ChartBarIcon },
    { id: 'providers', name: 'Service Providers', icon: UserCircleIcon },
    { id: 'customers', name: 'Customers', icon: UserCircleIcon },
    { id: 'reports', name: 'Reports', icon: ChartBarIcon },
  ]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Connect to WebSocket
    const socket = connectSocket();

    socket.on('bookingUpdated', (data) => {
      // Refresh relevant data
      if (activeTab === 'reports' || activeTab === 'metrics') {
        fetchReportData();
      } else {
        fetchData();
      }
    });

    // Subscribe to updates
    socket.emit('subscribeToUpdates', {});

    return () => {
      socket.off('bookingUpdated');
      socket.disconnect();
    };
  }, [activeTab]);

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setIsLoadingReport(true);
      // In a real app, you would make an API call here
      // Example: const response = await api.get(`/api/admin/reports?range=${reportRange}`);
      // setReportData(response.data);
      
      // For demo purposes, we'll use the mock data with a small delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setReportData(MOCK_REPORT_DATA);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchReportData();
  }, []);

  // Check admin authentication
  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      navigate('/login');
      return;
    }

    const fetchReportData = async () => {
      setIsLoadingReport(true);
      try {
        const [statsRes, providersRes, servicesRes, trendsRes] = await Promise.all([
          getBookingStats(reportRange),
          getProviderMetrics(),
          getServiceDistribution(),
          getBookingTrends(reportRange)
        ]);

        setReportData({
          stats: statsRes.data,
          providers: providersRes.data,
          services: servicesRes.data,
          trends: trendsRes.data
        });
      } catch (error) {
        toast.error('Failed to load report data');
      } finally {
        setIsLoadingReport(false);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
        const [bookingsData, servicesData, usersData, providersData] = await Promise.all([
          axios.get(activeTab === 'unassigned' ? '/api/bookings/unassigned' : '/api/bookings', config),
          axios.get('/api/services', config),
          axios.get('/api/users', config).then(response => {
            // Handle the nested users array in the response
            const usersData = response?.data?.users || [];
            return { ...response, data: Array.isArray(usersData) ? usersData : [] };
          }).catch(() => {
            return { data: [] }; // Return empty array on error
          }),
          axios.get('/api/users?role=service_provider', config).then(response => {
            // Handle the nested users array in the response if needed
            const providersData = response?.data?.users || response?.data || [];
            return { ...response, data: Array.isArray(providersData) ? providersData : [] };
          }).catch(() => {
            return { data: [] }; // Return empty array on error
          })
        ]);
        
        // Safely handle users data - response is already processed to be an array
        const usersList = usersData?.data || [];
        
        // Safely get roles
        const allRoles = [...new Set(usersList.map(user => user?.role).filter(Boolean))];
        
        const customers = usersList.filter(user => user?.role === 'customer');
        
        // Process providers data
        const providersList = providersData?.data || [];
        
        setBookings(Array.isArray(bookingsData?.data) ? bookingsData.data : []);
        setServices(Array.isArray(servicesData?.data) ? servicesData.data : []);
        setUsers(usersList);
        setProviders(providersList);
        
        // If we're on the reports tab, fetch report data
        if (activeTab === 'reports' || activeTab === 'metrics') {
          await fetchReportData();
        }
      } catch (err) {
        setError('Could not fetch dashboard data.');
      }
      setLoading(false);
    };

    fetchData();
  }, [userInfo, navigate, activeTab, reportRange]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data: updatedBooking } = await axios.put(`/api/bookings/${bookingId}`, { status: newStatus }, config);
      setBookings((prevBookings) =>
        prevBookings.map((booking) => (booking._id === bookingId ? updatedBooking : booking))
      );
    } catch (err) {
      setError('Failed to update status. Please try again.');
    }
  };

  const openAssignModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedProvider('');
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setSelectedBooking(null);
    setSelectedProvider('');
    setIsAssignModalOpen(false);
  };

  const handleAssignProvider = async () => {
    if (!selectedProvider || !selectedBooking) return;
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      // Update the booking with the selected provider
      const { data: updatedBooking } = await axios.put(
        `/api/bookings/${selectedBooking._id}/assign-provider`,
        { providerId: selectedProvider },
        config
      );

      // Update the bookings list
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking._id === updatedBooking._id ? updatedBooking : booking
        )
      );

      toast.success('Provider assigned successfully!');
      closeAssignModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign provider');
    }
  };


  const handleAddCustomer = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`
        }
      };

      const customerData = {
        ...newCustomer,
        role: 'customer',
        password: 'defaultPassword123!', // In a real app, implement a better way to set initial password
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone.trim(),
        address: newCustomer.address.trim()
      };

      const { data } = await axios.post('/api/users/register', customerData, config);
      
      // Update the users list
      setUsers([...users, data]);
      
      // Reset form and close modal
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        isActive: true
      });
      setShowCustomerModal(false);
      
      toast.success('Customer added successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add customer';
      toast.error(message);
    }
  };

  const handleAddServiceProvider = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const { data } = await axios.post(
        '/api/users/register-provider',
        {
          ...newProvider,
          password: 'temporaryPassword123', // In a real app, generate or let admin set a temporary password
          role: 'service_provider',
        },
        config
      );

      setProviders([...providers, data]);
      setShowProviderModal(false);
      setNewProvider({
        name: '',
        email: '',
        phone: '',
        serviceType: '',
        services: [],
        isActive: true
      });
      toast.success('Provider added successfully');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Error adding provider. Please try again.'
      );
    }
  };

  const addService = () => {
    if (serviceInput.trim() && !newProvider.services.includes(serviceInput.trim())) {
      setNewProvider({
        ...newProvider,
        services: [...newProvider.services, serviceInput.trim()]
      });
      setServiceInput('');
    }
  };

  const removeService = (serviceToRemove) => {
    setNewProvider({
      ...newProvider,
      services: newProvider.services.filter(service => service !== serviceToRemove)
    });
  };


  const handleToggleBookingDetails = (bookingId) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };

  if (loading) return <div className="p-4 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'unassigned':
      case 'all':
        const displayBookings = activeTab === 'unassigned' 
          ? bookings.filter(b => b.status === 'pending' && !b.assignedProvider)
          : bookings;
          
        return (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              {activeTab === 'unassigned' ? 'Unassigned Bookings' : 'All Bookings'}
            </h2>
            <div className="overflow-x-auto bg-white p-6 rounded-xl shadow-lg">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="w-full bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Customer</th>
                    <th className="py-3 px-6 text-left">Service</th>
                    <th className="py-3 px-6 text-center">Date</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-center">Provider</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                  {displayBookings.map((booking) => (
                    <React.Fragment key={`booking-${booking._id}`}>
                      <tr className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer" onClick={() => handleToggleBookingDetails(booking._id)}>
                        <td className="py-3 px-6 text-left whitespace-nowrap">
                          {booking.customer ? booking.customer.name : 'N/A'}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {booking.service ? booking.service.title : 'N/A'}
                        </td>
                        <td className="py-3 px-6 text-center">
                          {new Date(booking.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          {booking.assignedProvider ? (
                            <span className="text-sm">
                              {booking.assignedProvider.name || 'N/A'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Not assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex justify-center space-x-2">
                            {!booking.assignedProvider && (
                              <button
                                onClick={() => openAssignModal(booking)}
                                className="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-50"
                                title="Assign Provider"
                              >
                                <UserPlusIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleBookingDetails(booking._id)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                              title={expandedBookingId === booking._id ? 'Hide Details' : 'View Details'}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { /* Add edit functionality */ }}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                              title="Edit Booking"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { /* Add delete functionality */ }}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                              title="Delete Booking"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedBookingId === booking._id && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan="5" className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-bold">Customer Details</h4>
                                <p><strong>Name:</strong> {booking.customer.name}</p>
                                <p><strong>Mobile:</strong> {booking.customer.mobileNumber}</p>
                                {booking.customer.email && <p><strong>Email:</strong> {booking.customer.email}</p>}
                              </div>
                              <div>
                                <h4 className="font-bold">Booking Details</h4>
                                <p><strong>Booked On:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
                                <p><strong>Address:</strong> {booking.address}</p>
                                <p><strong>Notes:</strong> {booking.notes || 'N/A'}</p>
                              </div>
                              <div className="md:col-span-2">
                                <h4 className="font-bold">Service Details</h4>
                                <div className="flex items-center">
                                  <img src={booking.service.image} alt={booking.service.title} className="w-16 h-16 rounded-lg mr-4"/>
                                  <div>
                                    <p><strong>{booking.service.title}</strong></p>
                                    <p><strong>Price:</strong> ₹{booking.service.price.toFixed(2)}</p>
                                    <p><strong>Quantity:</strong> {booking.quantity || 1}</p>
                                    <p><strong>Total:</strong> ₹{(booking.service.price * (booking.quantity || 1)).toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'customers':
        // Filter customers from users
        const customerUsers = [];
        if (Array.isArray(users)) {
          users.forEach((user) => {
            if (user?.role === 'customer') {
              customerUsers.push(user);
            }
          });
        }
        
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Customers</h2>
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                  onClick={() => setShowCustomerModal(true)}
                >
                  + Add New Customer
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : customerUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600">{user.name?.charAt(0) || 'U'}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                              <div className="text-sm text-gray-500">ID: {user._id?.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email || 'No email'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.mobileNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => { /* Add view functionality */ }}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                              title="View User"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                              title="Edit User"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { /* Add delete functionality */ }}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                              title="Delete User"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new customer.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    New Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'services':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Services</h2>
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Service
              </button>
            </div>
            {services.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {service.image ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={service.image} alt={service.name} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500">{service.name?.charAt(0) || 'S'}</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{service.name}</div>
                              <div className="text-sm text-gray-500">{service.description?.substring(0, 30)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {service.category || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {service.price ? formatCurrency(service.price) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            service.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleOpenModal(service)}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                              title="Edit Service"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service._id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                              title="Delete Service"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white p-8 text-center rounded-lg shadow">
                <p className="text-gray-500">No services found. Click the 'Add Service' button above to get started.</p>
              </div>
            )}
          </div>
        );
        
      case 'providers':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Service Providers</h2>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
                onClick={() => setShowProviderModal(true)}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Provider
              </button>
            </div>
            {providers.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {providers.map((provider) => (
                      <tr key={provider._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {provider.avatar ? (
                                <img className="h-10 w-10 rounded-full object-cover" src={provider.avatar} alt={provider.name} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserCircleIcon className="h-6 w-6 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                              <div className="text-sm text-gray-500">{provider.serviceType || 'General'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {provider.mobileNumber || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {provider.services?.slice(0, 2).map((service, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {service}
                              </span>
                            ))}
                            {provider.services?.length > 2 && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                +{provider.services.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            provider.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {provider.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => { /* Add view functionality */ }}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                              title="View Provider"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { /* Add edit functionality */ }}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-50"
                              title="Edit Provider"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { /* Add delete functionality */ }}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                              title="Delete Provider"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white p-8 text-center rounded-lg shadow">
                <p className="text-gray-500">No service providers found.</p>
              </div>
            )}
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Business Reports</h2>
              <div className="flex space-x-2">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setReportRange(range)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      reportRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingReport ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Bookings Overview</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData?.bookings?.labels?.map((label, i) => ({
                          name: label,
                          bookings: reportData.bookings.data[i],
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="bookings" fill="#4F46E5" name="Bookings" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Revenue</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData?.revenue?.labels?.map((label, i) => ({
                          name: label,
                          revenue: reportData.revenue.data[i],
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
                    <h3 className="text-lg font-medium mb-4">Service Distribution</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData?.serviceDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {reportData?.serviceDistribution?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name, props) => [
                            `${props.payload.name}: ${formatCurrency(value)}`,
                            'Revenue'
                          ]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {bookings
                      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                      .slice(0, 5)
                      .map((booking) => (
                        <div key={booking._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">
                              {booking.customer?.name || 'Customer'} - {booking.service?.title || 'Service'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Status: <span className="font-medium">{booking.status}</span>
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(booking.updatedAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'metrics':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-6">Provider Performance</h2>
              
              {isLoadingReport ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reportData?.providerPerformance?.map((provider, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">{provider.name}</h3>
                          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                            {provider.rating} ★
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Completed Jobs</span>
                            <span className="font-medium">{provider.completed}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (provider.completed / 20) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Customer Rating</span>
                            <span className="font-medium">{provider.rating}/5.0</span>
                          </div>
                          <div className="flex mt-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${i < Math.floor(provider.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Service Completion Rate</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={reportData?.providerPerformance}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="completed" name="Completed Jobs" fill="#4F46E5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">Top Performing Services</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Rating</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {services.slice(0, 5).map((service) => (
                            <tr key={service._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{service.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{Math.floor(Math.random() * 20) + 5}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatCurrency(service.price * (Math.floor(Math.random() * 20) + 5))}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                  <span className="ml-1 text-sm text-gray-500">4.0</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
                <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                  <select
                    value={reportRange}
                    onChange={(e) => setReportRange(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                  <button
                    onClick={() => fetchReportData()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingReport ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Bookings */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <CalendarIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {MOCK_REPORT_DATA.bookings.data.reduce((a, b) => a + b, 0)}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed Bookings */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <CheckCircleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {MOCK_REPORT_DATA.providerPerformance.reduce((sum, p) => sum + p.completed, 0)}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* In Progress */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <ClockIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {Math.floor(Math.random() * 10) + 1}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <span className="text-white text-lg font-bold">₹</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              ₹{MOCK_REPORT_DATA.revenue.data.reduce((a, b) => a + b, 0).toLocaleString()}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Bookings Over Time */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Bookings Over Time</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={MOCK_REPORT_DATA.bookings.labels.map((label, i) => ({
                          date: label,
                          count: MOCK_REPORT_DATA.bookings.data[i]
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Bookings" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Service Distribution */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Service Distribution</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOCK_REPORT_DATA.serviceDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {MOCK_REPORT_DATA.serviceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Performing Providers */}
              <div className="mt-8">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Top Performing Service Providers</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {MOCK_REPORT_DATA.providerPerformance.map((provider, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {provider.completed} jobs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`h-5 w-5 ${star <= Math.round(provider.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-1 text-sm text-gray-500">{provider.rating}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{(provider.completed * 1500).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin Dashboard</h1>
      
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`whitespace-nowrap py-2 px-4 ${activeTab === 'unassigned' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Unassigned {bookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {bookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap py-2 px-4 ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`whitespace-nowrap py-2 px-4 ${activeTab === 'services' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`whitespace-nowrap py-2 px-4 ${activeTab === 'providers' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Service Providers
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`whitespace-nowrap py-2 px-4 ${activeTab === 'customers' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap py-2 px-4 flex items-center ${activeTab === 'reports' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            <ChartBarIcon className="h-5 w-5 mr-1" />
            Reports
          </button>
        </div>
      </div>

      <div>
        {renderContent()}
      </div>

      <ServiceFormModal
        isOpen={isModalOpen}
        service={editingService}
        onClose={handleCloseModal}
        onSave={handleSaveService}
      />

      {/* Add Provider Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-xl font-bold text-gray-800">Add New Service Provider</h3>
              <button 
                onClick={() => setShowProviderModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-5 py-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={newProvider.email}
                    onChange={(e) => setNewProvider({...newProvider, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={newProvider.phone}
                    onChange={(e) => setNewProvider({...newProvider, phone: e.target.value})}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Services</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 min-w-0 block w-full px-4 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && serviceInput.trim()) {
                        e.preventDefault();
                        setNewProvider({
                          ...newProvider,
                          services: [...newProvider.services, serviceInput.trim()]
                        });
                        setServiceInput('');
                      }
                    }}
                    placeholder="e.g., Plumbing, Electrical, Cleaning"
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                </div>
                
                {newProvider.services.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newProvider.services.map((service, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {service}
                        <button
                          type="button"
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300 focus:outline-none"
                          onClick={() => removeService(service)}
                        >
                          <span className="sr-only">Remove service</span>
                          <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                            <path fillRule="evenodd" d="M4 3.293L6.646.646a.5.5 0 01.708.708L4.707 4l2.647 2.646a.5.5 0 01-.708.708L4 4.707l-2.646 2.647a.5.5 0 01-.708-.708L3.293 4 .646 1.354a.5.5 0 01.708-.708L4 3.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center h-5">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={newProvider.isActive}
                    onChange={(e) => setNewProvider({...newProvider, isActive: e.target.checked})}
                  />
                </div>
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Provider
                </label>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setShowProviderModal(false);
                  setNewProvider({
                    name: '',
                    email: '',
                    phone: '',
                    serviceType: '',
                    services: [],
                    isActive: true
                  });
                  setServiceInput('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleAddServiceProvider}
              >
                Add Provider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-xl font-bold text-gray-800">Add New Customer</h3>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-5 py-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  placeholder="Enter full address"
                />
              </div>
              
              <div className="flex items-center">
                <div className="flex items-center h-5">
                  <input
                    id="customerIsActive"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={newCustomer.isActive}
                    onChange={(e) => setNewCustomer({...newCustomer, isActive: e.target.checked})}
                  />
                </div>
                <label htmlFor="customerIsActive" className="ml-2 block text-sm text-gray-700">
                  Active Customer
                </label>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setShowCustomerModal(false);
                  setNewCustomer({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    isActive: true
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleAddCustomer}
              >
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Provider Modal */}
      {isAssignModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Assign Provider</h3>
            <p className="mb-4">Assign a service provider to this booking:</p>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Select Provider</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
              >
                <option value="">Select a provider</option>
                {providers.map((provider) => (
                  <option key={provider._id} value={provider._id}>
                    {provider.name} - {provider.skills?.map(s => s.skillId?.name).filter(Boolean).join(', ') || 'No skills'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedProvider('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignProvider(selectedBooking._id)}
                disabled={!selectedProvider}
                className={`px-4 py-2 rounded text-white ${selectedProvider ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
              >
                Assign Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
