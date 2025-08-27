import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  description: { 
    type: String,
    required: false
  },
  category: {
    type: String,
    enum: ['home_repair', 'cleaning', 'plumbing', 'electrical', 'other'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model("Skill", skillSchema);
