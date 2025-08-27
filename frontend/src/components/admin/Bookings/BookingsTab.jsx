import React, { useState, useEffect } from 'react';
import { ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BookingsTab = ({ showUnassigned }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };

        // Fetch bookings
        const [bookingsRes, providersRes] = await Promise.all([
          axios.get('/api/bookings', config),
          axios.get('/api/users?role=service_provider', config)
        ]);

        setBookings(bookingsRes.data);
        setProviders(providersRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleDetails = (bookingId) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
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
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const { data: updatedBooking } = await axios.put(
        `/api/bookings/${selectedBooking._id}/assign-provider`,
        { providerId: selectedProvider },
        config
      );

      setBookings(prev => 
        prev.map(booking => 
          booking._id === updatedBooking._id ? updatedBooking : booking
        )
      );

      toast.success('Provider assigned successfully!');
      closeAssignModal();
    } catch (error) {
      console.error('Error assigning provider:', error);
      toast.error(error.response?.data?.message || 'Failed to assign provider');
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const { data: updatedBooking } = await axios.put(
        `/api/bookings/${bookingId}`,
        { status: newStatus },
        config
      );

      setBookings(prev => 
        prev.map(booking => 
          booking._id === updatedBooking._id ? updatedBooking : booking
        )
      );

      toast.success(`Booking marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredBookings = showUnassigned
    ? bookings.filter(booking => !booking.assignedProvider && booking.status === 'pending')
    : bookings;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          {showUnassigned ? (
            <>
              <ClockIcon className="h-6 w-6 mr-2 text-yellow-500" />
              Unassigned Bookings
            </>
          ) : (
            'All Bookings'
          )}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer & Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <React.Fragment key={booking._id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600">
                            {booking.customer?.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.customer?.name || 'Unknown Customer'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.service?.title || 'Service N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {booking.assignedProvider ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserGroupIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.assignedProvider.name}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {!booking.assignedProvider && (
                          <button
                            onClick={() => openAssignModal(booking)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                          >
                            Assign
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleDetails(booking._id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {expandedBookingId === booking._id ? 'Hide' : 'View'} Details
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedBookingId === booking._id && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Details</h4>
                            <div className="text-sm text-gray-700 space-y-1">
                              <p><strong>Name:</strong> {booking.customer?.name || 'N/A'}</p>
                              <p><strong>Email:</strong> {booking.customer?.email || 'N/A'}</p>
                              <p><strong>Phone:</strong> {booking.customer?.phone || booking.customer?.mobileNumber || 'N/A'}</p>
                              <p><strong>Address:</strong> {booking.address || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Service Details</h4>
                            <div className="text-sm text-gray-700 space-y-1">
                              <p><strong>Service:</strong> {booking.service?.title || 'N/A'}</p>
                              <p><strong>Description:</strong> {booking.service?.description || 'N/A'}</p>
                              <p><strong>Price:</strong> ${booking.service?.price?.toFixed(2) || '0.00'}</p>
                              <p><strong>Duration:</strong> {booking.service?.duration || 'N/A'} mins</p>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Booking Notes</h4>
                            <p className="text-sm text-gray-700">
                              {booking.notes || 'No additional notes provided.'}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Update Status</h4>
                            <div className="flex flex-wrap gap-2">
                              {['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(booking._id, status)}
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    booking.status === status
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  {status.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <ClockIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-lg font-medium">
                      {showUnassigned 
                        ? 'No unassigned bookings at the moment.' 
                        : 'No bookings found.'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {showUnassigned 
                        ? 'All current bookings have been assigned to providers.' 
                        : 'New bookings will appear here.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Provider Modal */}
      {isAssignModalOpen && selectedBooking && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Assign Service Provider
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Select a provider to assign to this booking.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Provider
                </label>
                <select
                  id="provider"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                >
                  <option value="">Select a provider</option>
                  {providers.map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.name} ({provider.serviceCategories?.join(', ') || 'General'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm ${
                    !selectedProvider ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleAssignProvider}
                  disabled={!selectedProvider}
                >
                  Assign
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={closeAssignModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsTab;
