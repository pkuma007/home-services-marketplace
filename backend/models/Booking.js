import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true
  },
  quantity: { type: Number, required: true },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  date: { type: Date, required: true },
  address: { type: String, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
    default: "pending"
  },
  assignedProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  workCompleted: {
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    notes: { type: String },
    images: [{ type: String }],  // Store image URLs
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  statusHistory: [{
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    notes: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
