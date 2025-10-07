const express = require('express');
const Review = require('../models/Review');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/reviews/{contentId}:
 *   get:
 *     summary: Get reviews for content
 *     tags: [Reviews]
 */
router.get('/:contentId', optionalAuth, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    const reviews = await Review.find({ contentId })
      .populate('userId', 'username firstName lastName profileImage')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments({ contentId });
    
    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 */
router.post('/', authenticateToken, validateRequest(schemas.review), async (req, res, next) => {
  try {
    const { contentId, contentType, rating, title, content } = req.body;
    
    // Check if user already reviewed this content
    const existingReview = await Review.findOne({
      userId: req.user._id,
      contentId,
      contentType
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this content' });
    }
    
    const review = new Review({
      userId: req.user._id,
      contentId,
      contentType,
      rating,
      title,
      content
    });
    
    await review.save();
    await review.populate('userId', 'username firstName lastName profileImage');
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 */
router.put('/:reviewId', authenticateToken, validateRequest(schemas.review), async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, content } = req.body;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }
    
    review.rating = rating;
    review.title = title;
    review.content = content;
    
    await review.save();
    await review.populate('userId', 'username firstName lastName profileImage');
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 */
router.delete('/:reviewId', authenticateToken, async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
