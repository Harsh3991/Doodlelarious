const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 */
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 */
router.put('/profile', authenticateToken, validateRequest(schemas.updateProfile), async (req, res, next) => {
  try {
    const { firstName, lastName, profileImage } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, profileImage },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/watchlist:
 *   get:
 *     summary: Get user watchlist
 *     tags: [User Interactions]
 */
router.get('/watchlist', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('watchlist');
    
    res.json({
      success: true,
      watchlist: user.watchlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/user/watchlist:
 *   post:
 *     summary: Add to watchlist
 *     tags: [User Interactions]
 */
router.post('/watchlist', authenticateToken, validateRequest(schemas.watchlistItem), async (req, res, next) => {
  try {
    const { contentId, contentType } = req.body;
    
    // Check if already in watchlist
    const existingItem = req.user.watchlist.find(
      item => item.contentId === contentId && item.contentType === contentType
    );
    
    if (existingItem) {
      return res.status(400).json({ message: 'Item already in watchlist' });
    }
    
    req.user.watchlist.push({ contentId, contentType });
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Added to watchlist'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/user/watchlist/{contentId}:
 *   delete:
 *     summary: Remove from watchlist
 *     tags: [User Interactions]
 */
router.delete('/watchlist/:contentId', authenticateToken, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    
    req.user.watchlist = req.user.watchlist.filter(
      item => item.contentId !== contentId
    );
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/user/favorites:
 *   get:
 *     summary: Get user favorites
 *     tags: [User Interactions]
 */
router.get('/favorites', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('favorites');
    
    res.json({
      success: true,
      favorites: user.favorites
    });
  } catch (error) {
    next(error);
  }
});

router.post('/favorites', authenticateToken, validateRequest(schemas.watchlistItem), async (req, res, next) => {
  try {
    const { contentId, contentType } = req.body;
    
    const existingItem = req.user.favorites.find(
      item => item.contentId === contentId && item.contentType === contentType
    );
    
    if (existingItem) {
      return res.status(400).json({ message: 'Item already in favorites' });
    }
    
    req.user.favorites.push({ contentId, contentType });
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Added to favorites'
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/favorites/:contentId', authenticateToken, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    
    req.user.favorites = req.user.favorites.filter(
      item => item.contentId !== contentId
    );
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/user/history:
 *   get:
 *     summary: Get watch history
 *     tags: [User Interactions]
 */
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('watchHistory');
    
    res.json({
      success: true,
      history: user.watchHistory.sort((a, b) => b.lastWatched - a.lastWatched)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/history', authenticateToken, validateRequest(schemas.historyItem), async (req, res, next) => {
  try {
    const { contentId, contentType, progress = 0, seasonNumber, episodeNumber } = req.body;
    
    // Find existing history item
    const existingIndex = req.user.watchHistory.findIndex(
      item => item.contentId === contentId && item.contentType === contentType
    );
    
    const historyItem = {
      contentId,
      contentType,
      progress,
      lastWatched: new Date(),
      ...(seasonNumber && { seasonNumber }),
      ...(episodeNumber && { episodeNumber })
    };
    
    if (existingIndex >= 0) {
      req.user.watchHistory[existingIndex] = historyItem;
    } else {
      req.user.watchHistory.push(historyItem);
    }
    
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Watch history updated'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/continue-watching', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('watchHistory');
    
    // Get items with progress between 5% and 95%
    const continueWatching = user.watchHistory
      .filter(item => item.progress > 5 && item.progress < 95)
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 20);
    
    res.json({
      success: true,
      continueWatching
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/history', authenticateToken, async (req, res, next) => {
  try {
    req.user.watchHistory = [];
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Watch history cleared'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
