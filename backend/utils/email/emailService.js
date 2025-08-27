import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ejs from 'ejs';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Compile email template
const compileTemplate = async (templateName, data) => {
  const templatePath = join(__dirname, 'templates', `${templateName}.ejs`);
  const template = await fs.promises.readFile(templatePath, 'utf-8');
  return ejs.render(template, data);
};

// Send email function
export const sendEmail = async (to, subject, template, data) => {
  try {
    const html = await compileTemplate(template, data);
    
    const mailOptions = {
      from: `"RightBridge" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Specific email functions
export const sendStatusUpdateEmail = async (booking, user) => {
  const { customer, service, status, _id } = booking;
  const subject = `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}: ${service?.title || 'Your Service'}`;
  
  const statusMap = {
    'assigned': 'A provider has been assigned to your booking',
    'in_progress': 'Service is in progress',
    'completed': 'Service has been completed',
    'cancelled': 'Booking has been cancelled'
  };

  return sendEmail(
    customer.email,
    subject,
    'statusUpdate',
    {
      userName: customer.name,
      serviceName: service?.title || 'your service',
      status: status.replace('_', ' '),
      statusMessage: statusMap[status] || `Status updated to ${status}`,
      bookingId: _id,
      date: new Date(booking.date).toLocaleDateString(),
      providerName: booking.assignedProvider?.name || 'your service provider',
      workNotes: booking.workCompleted?.notes,
      images: booking.workCompleted?.images || [],
      supportEmail: process.env.SUPPORT_EMAIL || 'support@rightbridge.com'
    }
  );
};

export const sendNewBookingNotification = async (booking, provider) => {
  return sendEmail(
    provider.email,
    `New Booking: ${booking.service?.title || 'Service Request'}`,
    'newBooking',
    {
      providerName: provider.name,
      serviceName: booking.service?.title || 'a service',
      customerName: booking.customer?.name || 'a customer',
      bookingId: booking._id,
      date: new Date(booking.date).toLocaleDateString(),
      notes: booking.notes || 'No additional notes',
      adminEmail: process.env.ADMIN_EMAIL || 'admin@rightbridge.com'
    }
  );
};
