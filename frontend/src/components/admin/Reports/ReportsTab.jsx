import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ArrowUpIcon, 
  ArrowDownIcon 
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ReportsTab = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    completedServices: 0,
    bookingTrends: [],
    revenueByService: [],
    serviceDistribution: []
  });
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 6),
    endDate: new Date()
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo?.token}`,
          },
        };

        // In a real app, you would fetch this data from your API
        // For now, we'll use mock data
        const { data: bookings } = await axios.get('/api/bookings', config);
        const { data: services } = await axios.get('/api/services', config);
        const { data: customers } = await axios.get('/api/users?role=customer', config);

        // Process data for reports
        const now = new Date();
        let startDate, endDate;

        switch (timeRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
          case '7days':
            startDate = subDays(new Date(), 6);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
          case '30days':
            startDate = subDays(new Date(), 29);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            break;
          case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          default:
            startDate = subDays(new Date(), 6);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        }

        setDateRange({ startDate, endDate });

        // Filter bookings within date range
        const filteredBookings = bookings.filter(booking => {
          const bookingDate = parseISO(booking.createdAt);
          return isWithinInterval(bookingDate, { start: startDate, end: endDate });
        });

        // Calculate metrics
        const totalBookings = filteredBookings.length;
        const totalRevenue = filteredBookings.reduce((sum, booking) => {
          return sum + (booking.totalAmount || 0);
        }, 0);

        const activeCustomers = new Set(filteredBookings.map(b => b.customer?._id)).size;
        const completedServices = filteredBookings.filter(b => b.status === 'completed').length;

        // Generate booking trends data
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const bookingTrends = days.map(day => {
          const dateStr = format(day, 'MMM dd');
          const dayBookings = filteredBookings.filter(booking => {
            return format(parseISO(booking.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          });
          return {
            date: dateStr,
            count: dayBookings.length,
            revenue: dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
          };
        });

        // Calculate revenue by service
        const revenueByService = services.map(service => {
          const serviceBookings = filteredBookings.filter(
            b => b.service?._id === service._id
          );
          const revenue = serviceBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
          return {
            service: service.name,
            revenue
          };
        }).filter(item => item.revenue > 0);

        // Calculate service distribution
        const serviceDistribution = services.map(service => {
          const serviceBookings = filteredBookings.filter(
            b => b.service?._id === service._id
          ).length;
          return {
            service: service.name,
            count: serviceBookings,
            percentage: totalBookings > 0 ? (serviceBookings / totalBookings) * 100 : 0
          };
        }).filter(item => item.count > 0);

        setReportData({
          totalBookings,
          totalRevenue,
          activeCustomers,
          completedServices,
          bookingTrends,
          revenueByService: revenueByService.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
          serviceDistribution: serviceDistribution.sort((a, b) => b.count - a.count).slice(0, 5)
        });

      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [timeRange]);

  // Chart options and data
  const bookingTrendsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Bookings & Revenue Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Bookings'
        }
      },
      y1: {
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Revenue (₹)'
        }
      },
    },
  };

  const bookingTrendsData = {
    labels: reportData.bookingTrends.map(item => item.date),
    datasets: [
      {
        label: 'Bookings',
        data: reportData.bookingTrends.map(item => item.count),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Revenue (₹)',
        data: reportData.bookingTrends.map(item => item.revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 2,
        type: 'line',
        yAxisID: 'y1',
      },
    ],
  };

  const revenueByServiceOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue by Service',
      },
    },
  };

  const revenueByServiceData = {
    labels: reportData.revenueByService.map(item => item.service),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: reportData.revenueByService.map(item => item.revenue),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const serviceDistributionData = {
    labels: reportData.serviceDistribution.map(item => item.service),
    datasets: [
      {
        data: reportData.serviceDistribution.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-semibold mb-4 sm:mb-0">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
          <div className="text-sm text-gray-500">
            {format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {reportData.totalBookings}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(reportData.totalRevenue)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      8.2%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <UserGroupIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Customers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {reportData.activeCustomers}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      5.3%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Services</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {reportData.completedServices}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      3.8%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-80">
            {reportData.bookingTrends.length > 0 ? (
              <Line data={bookingTrendsData} options={bookingTrendsOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No booking data available for the selected period.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="h-80">
            {reportData.revenueByService.length > 0 ? (
              <Bar data={revenueByServiceData} options={revenueByServiceOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No revenue data available for the selected period.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {[1, 2, 3, 4, 5].map((item, idx) => (
                <li key={idx}>
                  <div className="relative pb-8">
                    {idx !== 4 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <UserGroupIcon className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            New booking for <span className="font-medium text-gray-900">Deep Cleaning</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2023-04-06">2h ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <a
              href="#"
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View all activity
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Distribution</h3>
          <div className="h-64">
            {reportData.serviceDistribution.length > 0 ? (
              <Pie 
                data={serviceDistributionData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.raw || 0;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No service distribution data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
