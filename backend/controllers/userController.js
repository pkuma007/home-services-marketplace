import User from "../models/User.js";
import Skill from "../models/Skill.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const registerUser = async (req, res) => {
  try {
    const { name, mobileNumber, email, password, role } = req.body;
    const exists = await User.findOne({ mobileNumber });
    if (exists) return res.status(400).json({ message: "User with this mobile number already exists" });

    const user = await User.create({ name, mobileNumber, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      mobileNumber: user.mobileNumber,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Add or update skills for a service provider
// @route   PUT /api/users/skills
// @access  Private/Service Provider
export const updateUserSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  const userId = req.user._id;

  // Validate that the user is a service provider
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'service_provider') {
    res.status(403);
    throw new Error('Only service providers can update skills');
  }

  // Validate skills
  if (!Array.isArray(skills) || skills.length === 0) {
    res.status(400);
    throw new Error('Please provide at least one skill');
  }

  // Check if all skill IDs are valid
  const skillIds = skills.map(skill => skill.skillId);
  const validSkills = await Skill.find({ _id: { $in: skillIds }, isActive: true });
  
  if (validSkills.length !== skillIds.length) {
    res.status(400);
    throw new Error('One or more skills are invalid or inactive');
  }

  // Validate each skill object
  const validatedSkills = skills.map(skill => {
    const skillData = validSkills.find(s => s._id.toString() === skill.skillId);
    
    return {
      skillId: skill.skillId,
      experience: Math.max(0, Number(skill.experience) || 0),
      hourlyRate: Math.max(0, Number(skill.hourlyRate) || 0),
      isPrimary: !!skill.isPrimary
    };
  });

  // Only one skill can be primary
  const primarySkills = validatedSkills.filter(skill => skill.isPrimary);
  if (primarySkills.length > 1) {
    res.status(400);
    throw new Error('Only one skill can be marked as primary');
  }

  // If no primary skill is set, set the first one as primary
  if (primarySkills.length === 0 && validatedSkills.length > 0) {
    validatedSkills[0].isPrimary = true;
  }

  // Update user skills
  user.skills = validatedSkills;
  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    skills: updatedUser.skills
  });
});

// @desc    Get skills for a service provider
// @route   GET /api/users/skills
// @access  Private
export const getUserSkills = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const user = await User.findById(userId).populate('skills.skillId', 'name category description');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    _id: user._id,
    skills: user.skills
  });
});

// @desc    Get service providers by skill
// @route   GET /api/users/providers
// @access  Public
export const getServiceProviders = asyncHandler(async (req, res) => {
  const { skillId, minRating, location, page = 1, limit = 10 } = req.query;
  const query = { role: 'service_provider', isVerified: true };

  // Filter by skill if provided
  if (skillId) {
    query['skills.skillId'] = skillId;
  }

  // Filter by minimum rating if provided
  if (minRating) {
    query['rating.average'] = { $gte: Number(minRating) };
  }

  // TODO: Add location-based filtering when location services are implemented

  const users = await User.find(query)
    .select('-password -__v')
    .populate('skills.skillId', 'name category')
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const count = await User.countDocuments(query);

  res.json({
    providers: users,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    totalProviders: count
  });
});

export const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { mobileNumber: identifier }] 
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const keyword = req.query.keyword ? {
    $or: [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { email: { $regex: req.query.keyword, $options: 'i' } },
      { mobileNumber: { $regex: req.query.keyword, $options: 'i' } }
    ]
  } : {};

  // Filter by role if provided
  const roleFilter = req.query.role ? { role: req.query.role } : {};

  const count = await User.countDocuments({ ...keyword, ...roleFilter });
  const users = await User.find({ ...keyword, ...roleFilter })
    .select('-password')
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    users,
    page,
    pages: Math.ceil(count / pageSize),
    total: count
  });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user by admin
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.mobileNumber = req.body.mobileNumber || user.mobileNumber;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    
    if (req.body.address) {
      user.address = {
        ...user.address,
        ...req.body.address,
        location: req.body.address.location || user.address?.location
      };
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobileNumber: updatedUser.mobileNumber,
      role: updatedUser.role,
      isActive: updatedUser.isActive
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot delete admin user');
    }
    
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = asyncHandler(async (req, res) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format data for chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats = Array(12).fill(0);
    
    data.forEach(item => {
      stats[item._id - 1] = item.total;
    });
    
    res.json({
      labels: months,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
