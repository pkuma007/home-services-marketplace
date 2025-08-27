import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import { getIO } from '../server.js';
import { sendStatusUpdateEmail, sendNewBookingNotification } from "../utils/email/emailService.js";

export const createBooking = async (req, res) => {
  try {
    const { serviceId, date, address, notes, quantity } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const booking = await Booking.create({
      service: serviceId,
      customer: req.user._id,
      date,
      address,
      notes,
      quantity,
      status: 'pending' // Initial status is pending until admin assigns a provider
    });

    // Populate the service and customer fields in the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('service')
      .populate('customer', 'name email mobileNumber');

     // Emit WebSocket event
     const io = getIO();
     io.to('admin-dashboard').emit('bookingCreated', {
       booking: populatedBooking,
       message: 'New booking created'
     });

    // Notify admin about new booking
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      // You can implement admin notification here if needed
      console.log(`New booking created. Admin notified at ${admin.email}`);
    }

    res.status(201).json(populatedBooking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id }).populate("service");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('service')
      .populate('customer', 'name email mobileNumber')
      .populate('assignedProvider', 'name email mobileNumber')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnassignedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ 
      status: 'pending',
      assignedProvider: { $exists: false }
    })
    .populate('service')
    .populate('customer', 'name email mobileNumber')
    .sort({ createdAt: -1 });
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update booking status (for providers)
export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    )
    .populate('customer', 'name email mobileNumber')
    .populate('service')
    .populate('assignedProvider', 'name email');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Emit WebSocket event
    const io = getIO();
    io.to('admin-dashboard').emit('bookingStatusUpdated', {
      bookingId: booking._id,
      status: booking.status,
      updatedAt: booking.updatedAt
    });

    // Send status update email to customer
    if (booking.customer?.email) {
      await sendStatusUpdateEmail(
        booking.customer.email,
        booking.service.title,
        booking.status,
        booking._id
      );
    }

    res.json(booking);
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ error: err.message });
  }
};

export const assignProviderToBooking = async (req, res) => {
  try {
    const { providerId } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        assignedProvider: providerId,
        status: 'assigned',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('customer', 'name email mobileNumber')
    .populate('service')
    .populate('assignedProvider', 'name email');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Emit WebSocket event
    const io = getIO();
    io.to('admin-dashboard').emit('providerAssigned', {
      bookingId: booking._id,
      provider: booking.assignedProvider,
      status: booking.status,
      updatedAt: booking.updatedAt
    });

    // Send notification to provider (you can implement this)
    // await sendProviderAssignmentEmail(...);

    res.json(booking);
  } catch (err) {
    console.error('Error assigning provider to booking:', err);
    res.status(500).json({ error: err.message });
  }
};


export const getProviderBookings = async (req, res) => {
  try {
    // Ensure the user has the service_provider role
    if (req.user.role !== 'service_provider') {
      return res.status(403).json({ message: 'Access denied. Not a service provider.' });
    }
    
    const bookings = await Booking.find({ provider: req.user._id })
      .populate({
        path: 'service',
        select: 'title price category',
        populate: {
          path: 'provider',
          select: 'name mobileNumber'
        }
      })
      .populate('customer', 'name mobileNumber email')
      .sort({ createdAt: -1 }); // Sort by most recent first
      
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching provider bookings:', err);
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// In the deleteBooking function (add this if not exists)
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await booking.remove();

    // Emit WebSocket event
    const io = getIO();
    io.to('admin-dashboard').emit('bookingDeleted', {
      bookingId: booking._id,
      message: 'Booking deleted'
    });

    res.json({ message: 'Booking removed' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: err.message });
  }
};
