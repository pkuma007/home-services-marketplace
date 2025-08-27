import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          total: '$count',
          active: 1
        }
      }
    ]);

    // Get booking statistics
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          totalAmount: 1
        }
      }
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name email mobileNumber')
      .populate('service', 'name');

    // Get revenue data for the last 12 months
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));
    
    const monthlyRevenue = await Booking.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: lastYear }
        } 
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          amount: "$totalAmount"
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    // Format the response
    const stats = {
      users: {},
      bookings: {},
      revenue: {
        total: 0,
        monthly: Array(12).fill(0)
      },
      recentBookings
    };

    // Process user stats
    userStats.forEach(stat => {
      stats.users[stat.role] = {
        total: stat.total,
        active: stat.active
      };
    });

    // Process booking stats
    let totalBookings = 0;
    let totalRevenue = 0;
    
    bookingStats.forEach(stat => {
      stats.bookings[stat.status] = stat.count;
      totalBookings += stat.count;
      
      if (stat.status === 'completed') {
        totalRevenue += stat.totalAmount || 0;
      }
    });

    stats.bookings.total = totalBookings;
    stats.revenue.total = totalRevenue;

    // Process monthly revenue
    monthlyRevenue.forEach(item => {
      const monthIndex = item._id.month - 1; // Convert to 0-based index
      stats.revenue.monthly[monthIndex] = item.total;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// @desc    Get all bookings with filters
// @route   GET /api/admin/bookings
// @access  Private/Admin
export const getBookings = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const { status, startDate, endDate, customer, provider, service } = req.query;

  // Build filter object
  const filter = {};
  
  if (status) filter.status = status;
  if (customer && mongoose.Types.ObjectId.isValid(customer)) {
    filter.customer = customer;
  }
  if (provider && mongoose.Types.ObjectId.isValid(provider)) {
    filter.assignedProvider = provider;
  }
  if (service && mongoose.Types.ObjectId.isValid(service)) {
    filter.service = service;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const count = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate('customer', 'name email')
    .populate('service', 'name price')
    .populate('assignedProvider', 'name')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    bookings,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private/Admin
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Add any additional validation for status transitions if needed
  booking.status = status;
  
  // Update additional fields based on status
  if (status === 'in_progress') {
    booking.startedAt = new Date();
  } else if (status === 'completed') {
    booking.completedAt = new Date();
  } else if (status === 'cancelled') {
    booking.cancelledAt = new Date();
  }

  const updatedBooking = await booking.save();
  
  // Populate the updated booking for the response
  await updatedBooking.populate('customer', 'name email');
  await updatedBooking.populate('service', 'name price');
  await updatedBooking.populate('assignedProvider', 'name');

  res.json(updatedBooking);
});

// @desc    Assign provider to booking
// @route   PUT /api/admin/bookings/:id/assign-provider
// @access  Private/Admin
export const assignProviderToBooking = asyncHandler(async (req, res) => {
  const { providerId } = req.body;
  
  if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
    res.status(400);
    throw new Error('Valid provider ID is required');
  }

  // Check if provider exists
  const provider = await User.findById(providerId);
  if (!provider || provider.role !== 'service_provider') {
    res.status(404);
    throw new Error('Service provider not found');
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  booking.assignedProvider = providerId;
  booking.status = 'assigned';
  
  const updatedBooking = await booking.save();
  
  // Populate the updated booking for the response
  await updatedBooking.populate('customer', 'name email');
  await updatedBooking.populate('service', 'name price');
  await updatedBooking.populate('assignedProvider', 'name');

  // TODO: Send notification to provider
  
  res.json(updatedBooking);
});

// @desc    Get service statistics
// @route   GET /api/admin/services/stats
// @access  Private/Admin
export const getServiceStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Service.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'service',
          as: 'bookings'
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          isActive: 1,
          bookingCount: { $size: '$bookings' },
          totalRevenue: {
            $reduce: {
              input: '$bookings',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.totalAmount'] }
            }
          },
          avgRating: { $ifNull: ['$avgRating', 0] }
        }
      },
      { $sort: { bookingCount: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching service stats:', error);
    res.status(500).json({ message: 'Error fetching service statistics' });
  }
});

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let groupBy, dateFormat;
    
    if (period === 'daily') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      dateFormat = '%Y-%m-%d';
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      dateFormat = '%Y-%U';
    } else { // monthly
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      dateFormat = '%Y-%m';
    }

    const revenueData = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: subMonths(new Date(), 12) }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: dateFormat,
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day || 1'
                }
              }
            }
          },
          totalRevenue: 1,
          bookingCount: 1,
          averageOrderValue: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ message: 'Error fetching revenue analytics' });
  }
});

// Helper function to subtract months from a date
function subMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}
