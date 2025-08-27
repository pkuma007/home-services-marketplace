import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { PencilIcon, CheckIcon, XMarkIcon as XIcon, CameraIcon } from '@heroicons/react/24/outline';

export default function ProviderDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('assigned');
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        throw new Error('Please log in to view your bookings');
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get('/api/bookings/provider', config);
      setBookings(data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         err.message || 
                         'Failed to fetch bookings. Please try again later.';
      setError(errorMessage);
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === statusFilter);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      setIsSubmitting(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      const formData = new FormData();
      formData.append('status', newStatus);
      if (statusNotes) formData.append('notes', statusNotes);
      
      // Handle image uploads if any
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      await axios.put(
        `/api/bookings/${bookingId}/status`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${userInfo.token}`
          }
        }
      );

      toast.success('Status updated successfully');
      setEditingStatus(null);
      setStatusNotes('');
      setSelectedImages([]);
      fetchBookings();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update status';
      toast.error(errorMessage);
      console.error('Update status error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      'assigned': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    return statusFlow[currentStatus] || [];
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBookingCard = (booking) => (
    <div key={booking._id} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{booking.service?.title || 'Service'}</h3>
          <p className="text-gray-600">Customer: {booking.customer?.name || 'N/A'}</p>
          <p className="text-gray-600">Date: {format(new Date(booking.date), 'PPpp')}</p>
          <p className="text-gray-600 flex items-center">
            Status: 
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(booking.status)}`}>
              {booking.status.replace('_', ' ')}
            </span>
          </p>
          
          {booking.workCompleted?.completed && (
            <div className="mt-2 p-2 bg-green-50 rounded-md">
              <p className="text-sm text-green-700">
                <strong>Completed on:</strong> {format(new Date(booking.workCompleted.completedAt), 'PPpp')}
              </p>
              {booking.workCompleted.notes && (
                <p className="mt-1 text-sm text-gray-700">{booking.workCompleted.notes}</p>
              )}
              {booking.workCompleted.images?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {booking.workCompleted.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img} 
                      alt={`Work completed ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="ml-4 flex flex-col items-end space-y-2">
          <p className="text-lg font-bold">${booking.service?.price || '0'}</p>
          
          {editingStatus === booking._id ? (
            <div className="mt-2 space-y-2 w-full max-w-xs">
              <select
                className="w-full p-2 border rounded text-sm"
                defaultValue={booking.status}
                onChange={(e) => {
                  if (e.target.value === booking.status) return;
                  handleStatusUpdate(booking._id, e.target.value);
                }}
              >
                <option value="">Select Status</option>
                {getStatusOptions(booking.status).map(option => (
                  <option key={option} value={option}>
                    {option.replace('_', ' ')}
                  </option>
                ))}
              </select>
              
              {booking.status === 'in_progress' && (
                <>
                  <textarea
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Add completion notes..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows="2"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      id={`images-${booking._id}`}
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor={`images-${booking._id}`}
                      className="flex items-center justify-center w-full p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm cursor-pointer"
                    >
                      <CameraIcon className="w-4 h-4 mr-1" />
                      Add Images
                    </label>
                    {selectedImages.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Preview ${idx + 1}`}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setEditingStatus(null);
                    setStatusNotes('');
                    setSelectedImages([]);
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(booking._id, booking.status)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => {
                setEditingStatus(booking._id);
                setStatusNotes('');
                setSelectedImages([]);
              }}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center"
              disabled={['completed', 'cancelled'].includes(booking.status)}
            >
              <PencilIcon className="w-3 h-3 mr-1" />
              Update Status
            </button>
          )}
        </div>
      </div>
      
      {booking.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700">Customer Notes:</h4>
          <p className="text-gray-600 text-sm mt-1">{booking.notes}</p>
        </div>
      )}
      
      {booking.statusHistory?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Status History:</h4>
          <div className="space-y-2">
            {[...booking.statusHistory].reverse().map((history, idx) => (
              <div key={idx} className="text-sm text-gray-600 flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-gray-400 mr-2"></div>
                <div>
                  <span className="font-medium">{history.status.replace('_', ' ')}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-500">
                    {format(new Date(history.changedAt), 'PPpp')}
                  </span>
                  {history.changedBy?.name && (
                    <span className="text-gray-500 ml-2">by {history.changedBy.name}</span>
                  )}
                  {history.notes && (
                    <p className="text-gray-500 mt-1">{history.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all service requests assigned to you.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex items-center space-x-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
              Filter by status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {filteredBookings.length === 0 ? (
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {statusFilter === 'all' 
                      ? "You don't have any bookings yet." 
                      : `No ${statusFilter.replace('_', ' ')} bookings found.`}
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View all bookings
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredBookings.map(booking => (
                    <div key={booking._id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                              {booking.service?.name || 'Service'}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                              Customer: {booking.customer?.name || 'N/A'}
                            </p>
                          </div>
                          <div className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="text-gray-900">
                              {booking.date ? format(new Date(booking.date), 'MMM d, yyyy') : 'N/A'}
                            </div>
                            <div className="text-gray-500">
                              {booking.date ? format(new Date(booking.date), 'h:mm a') : ''}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status ? booking.status.replace('_', ' ') : 'pending'}
                            </span>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              onClick={() => {
                                // View booking details
                                console.log('View booking:', booking._id);
                              }}
                            >
                              View<span className="sr-only">, {booking.service?.title || 'booking'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
