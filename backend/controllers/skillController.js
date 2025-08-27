import Skill from "../models/Skill.js";
import asyncHandler from "express-async-handler";

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
export const getSkills = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const skills = await Skill.find(query).sort({ name: 1 });
  res.json(skills);
});

// @desc    Add a new skill
// @route   POST /api/skills
// @access  Admin
export const createSkill = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;

  const skillExists = await Skill.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (skillExists) {
    res.status(400);
    throw new Error('Skill already exists');
  }

  const skill = await Skill.create({
    name: name.trim(),
    description,
    category
  });

  res.status(201).json(skill);
});

// @desc    Update a skill
// @route   PUT /api/skills/:id
// @access  Admin
export const updateSkill = asyncHandler(async (req, res) => {
  const { name, description, category, isActive } = req.body;
  const skill = await Skill.findById(req.params.id);

  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  if (name) {
    const nameExists = await Skill.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: skill._id }
    });
    
    if (nameExists) {
      res.status(400);
      throw new Error('Skill with this name already exists');
    }
    skill.name = name.trim();
  }

  if (description !== undefined) skill.description = description;
  if (category) skill.category = category;
  if (isActive !== undefined) skill.isActive = isActive;

  const updatedSkill = await skill.save();
  res.json(updatedSkill);
});

// @desc    Delete a skill
// @route   DELETE /api/skills/:id
// @access  Admin
export const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  
  if (!skill) {
    res.status(404);
    throw new Error('Skill not found');
  }

  // Check if any service provider has this skill
  const User = (await import('./userController.js')).default;
  const usersWithSkill = await User.countDocuments({
    'skills.skillId': skill._id
  });

  if (usersWithSkill > 0) {
    res.status(400);
    throw new Error('Cannot delete skill as it is being used by service providers');
  }

  await skill.remove();
  res.json({ message: 'Skill removed' });
});
