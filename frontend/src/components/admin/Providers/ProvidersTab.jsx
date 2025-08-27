import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ProvidersTab = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProvider, setEditingProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceCategories: [],
    address: '',
    isActive: true,
    password: '',
    confirmPassword: ''
  });
  const [availableCategories, setAvailableCategories] = useState([
    'Cleaning', 'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Pest Control', 'Other'
  ]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };

        const { data } = await axios.get('/api/users?role=service_provider', config);
        setProviders(data);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load service providers. Please try again.');
        toast.error('Failed to load service providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleOpenModal = (provider = null) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({
        name: provider.name || '',
        email: provider.email || '',
        phone: provider.phone || provider.mobileNumber || '',
        serviceCategories: provider.serviceCategories || [],
        address: provider.address?.formattedAddress || '',
        isActive: provider.isActive !== false,
        password: '',
        confirmPassword: ''
      });
    } else {
      setEditingProvider(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        serviceCategories: [],
        address: '',
        isActive: true,
        password: '',
        confirmPassword: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => {
      if (prev.serviceCategories.includes(category)) {
        return {
          ...prev,
          serviceCategories: prev.serviceCategories.filter(cat => cat !== category)
        };
      } else {
        return {
          ...prev,
          serviceCategories: [...prev.serviceCategories, category]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const providerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        serviceCategories: formData.serviceCategories,
        address: formData.address,
        isActive: formData.isActive,
        role: 'service_provider'
      };

      // Only include password if it's being set/updated
      if (formData.password) {
        providerData.password = formData.password;
      }

      if (editingProvider) {
        // Update existing provider
        const { data } = await axios.put(
          `/api/users/${editingProvider._id}`,
          providerData,
          config
        );
        setProviders(prev => 
          prev.map(p => p._id === editingProvider._id ? data : p)
        );
        toast.success('Provider updated successfully');
      } else {
        // Create new provider
        const { data } = await axios.post(
          '/api/users/register',
          providerData,
          config
        );
        setProviders(prev => [...prev, data]);
        toast.success('Provider created successfully');
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error(error.response?.data?.message || 'Failed to save provider');
    }
  };

  const handleDelete = async (providerId) => {
    if (window.confirm('Are you sure you want to delete this provider? This action cannot be undone.')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };

        await axios.delete(`/api/users/${providerId}`, config);
        setProviders(prev => prev.filter(provider => provider._id !== providerId));
        toast.success('Provider deleted successfully');
      } catch (error) {
        console.error('Error deleting provider:', error);
        toast.error(error.response?.data?.message || 'Failed to delete provider');
      }
    }
  };

  const toggleProviderStatus = async (providerId, currentStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const { data } = await axios.put(
        `/api/users/${providerId}`,
        { isActive: !currentStatus },
        config
      );

      setProviders(prev => 
        prev.map(provider => 
          provider._id === providerId ? { ...provider, isActive: data.isActive } : provider
        )
      );
      
      toast.success(`Provider ${data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling provider status:', error);
      toast.error('Failed to update provider status');
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
        <h2 className="text-2xl font-semibold">Service Providers</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Provider
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Services
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.length > 0 ? (
              providers.map((provider) => (
                <tr key={provider._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {provider.avatar ? (
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={provider.avatar} 
                            alt={provider.name} 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {provider.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {provider.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {provider.phone || provider.mobileNumber || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {provider.address?.formattedAddress || 'No address'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {provider.serviceCategories?.length > 0 ? (
                        provider.serviceCategories.map((category, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {category}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No services</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      onClick={() => toggleProviderStatus(provider._id, provider.isActive !== false)}
                      className={`cursor-pointer px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        provider.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {provider.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleOpenModal(provider)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Provider"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(provider._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Provider"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium">No service providers found</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Get started by adding your first service provider.
                    </p>
                    <button
                      onClick={() => handleOpenModal()}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Provider
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Provider Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editingProvider ? 'Edit Service Provider' : 'Add New Service Provider'}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full Name *
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="name"
                              id="name"
                              required
                              value={formData.name}
                              onChange={handleInputChange}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address *
                          </label>
                          <div className="mt-1">
                            <input
                              type="email"
                              name="email"
                              id="email"
                              required={!editingProvider}
                              disabled={!!editingProvider}
                              value={formData.email}
                              onChange={handleInputChange}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number *
                          </label>
                          <div className="mt-1">
                            <input
                              type="tel"
                              name="phone"
                              id="phone"
                              required
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        {!editingProvider && (
                          <>
                            <div className="sm:col-span-3">
                              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="password"
                                  name="password"
                                  id="password"
                                  required={!editingProvider}
                                  value={formData.password}
                                  onChange={handleInputChange}
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                              </label>
                              <div className="mt-1">
                                <input
                                  type="password"
                                  name="confirmPassword"
                                  id="confirmPassword"
                                  required={!editingProvider}
                                  value={formData.confirmPassword}
                                  onChange={handleInputChange}
                                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="sm:col-span-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Categories *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableCategories.map((category) => (
                              <div key={category} className="flex items-center">
                                <input
                                  id={`category-${category}`}
                                  name="serviceCategories"
                                  type="checkbox"
                                  checked={formData.serviceCategories.includes(category)}
                                  onChange={() => handleCategoryChange(category)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`category-${category}`} className="ml-2 block text-sm text-gray-700">
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="address"
                              name="address"
                              rows={2}
                              value={formData.address}
                              onChange={handleInputChange}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-6">
                          <div className="flex items-center">
                            <input
                              id="isActive"
                              name="isActive"
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                              Active (can receive bookings)
                            </label>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                  onClick={handleSubmit}
                  disabled={!formData.serviceCategories.length}
                >
                  {editingProvider ? 'Update Provider' : 'Create Provider'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={handleCloseModal}
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

export default ProvidersTab;
