const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentId: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['movie', 'tv'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Review title must be less than 100 characters']
  },
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Review content must be less than 1000 characters']
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ contentId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ contentType: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

// Compound index for content reviews
reviewSchema.index({ contentId: 1, contentType: 1 });

module.exports = mongoose.model('Review', reviewSchema);
