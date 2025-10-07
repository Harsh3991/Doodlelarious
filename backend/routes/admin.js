const express = require('express');
const User = require('../models/User');
const Review = require('../models/Review');
const { authenticateAdmin } = require('../middleware/auth');
const rapidApiService = require('../services/rapidApiService');

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 */
router.get('/users', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Admin]
 */
router.put('/users/:userId/role', authenticateAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users/{userId}/deactivate:
 *   put:
 *     summary: Deactivate/activate user (Admin only)
 *     tags: [Admin]
 */
router.put('/users/:userId/deactivate', authenticateAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/sync-genres:
 *   get:
 *     summary: Sync genres from RapidAPI (Admin only)
 *     tags: [Admin]
 */
router.get('/sync-genres', authenticateAdmin, async (req, res, next) => {
  try {
    const genres = await rapidApiService.getGenres();
    
    res.json({
      success: true,
      message: 'Genres synced successfully',
      genres
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: Get all reviews for moderation (Admin only)
 *     tags: [Admin]
 */
router.get('/reviews', authenticateAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, moderated } = req.query;
    
    let query = {};
    if (moderated !== undefined) {
      query.isModerated = moderated === 'true';
    }
    
    const reviews = await Review.find(query)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments(query);
    
    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
