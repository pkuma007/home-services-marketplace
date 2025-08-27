// backend/controllers/reportController.js
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Helper function to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  switch(period) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 })
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    default: // week
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 })
      };
  }
};

// Get booking statistics
export const getBookingStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const { start, end } = getDateRange(period);

    // Get total bookings
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get revenue
    const revenueData = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData'
        }
      },
      {
        $unwind: '$serviceData'
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$serviceData.price' }
        }
      }
    ]);

    res.json({
      totalBookings,
      bookingsByStatus,
      totalRevenue: revenueData[0]?.totalRevenue || 0
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ message: 'Error fetching booking statistics' });
  }
};

// Get provider performance metrics
export const getProviderMetrics = async (req, res) => {
  try {
    const providers = await User.find({ role: 'service_provider' })
      .select('name email')
      .lean();

    const providerStats = await Promise.all(providers.map(async (provider) => {
      const completedBookings = await Booking.countDocuments({
        assignedProvider: provider._id,
        status: 'completed'
      });

      const totalBookings = await Booking.countDocuments({
        assignedProvider: provider._id
      });

      const avgRating = await Booking.aggregate([
        {
          $match: {
            assignedProvider: provider._id,
            rating: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' }
          }
        }
      ]);

      return {
        ...provider,
        completedBookings,
        totalBookings,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        avgRating: avgRating[0]?.avgRating?.toFixed(1) || 0
      };
    }));

    res.json(providerStats);
  } catch (error) {
    console.error('Error fetching provider metrics:', error);
    res.status(500).json({ message: 'Error fetching provider metrics' });
  }
};

// Get service distribution
export const getServiceDistribution = async (req, res) => {
  try {
    const distribution = await Booking.aggregate([
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData'
        }
      },
      {
        $unwind: '$serviceData'
      },
      {
        $group: {
          _id: '$serviceData.title',
          count: { $sum: 1 },
          revenue: { $sum: '$serviceData.price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching service distribution:', error);
    res.status(500).json({ message: 'Error fetching service distribution' });
  }
};

// Get booking trends over time
export const getBookingTrends = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const { start, end } = getDateRange(period);

    // Group bookings by time period (day/week/month)
    const groupBy = period === 'year' ? { $month: '$createdAt' } :
                   period === 'month' ? { $dayOfMonth: '$createdAt' } :
                   { $dayOfWeek: '$createdAt' };

    const trends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(trends);
  } catch (error) {
    console.error('Error fetching booking trends:', error);
    res.status(500).json({ message: 'Error fetching booking trends' });
  }
};