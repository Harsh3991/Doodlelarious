const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorDetails = error.details.map(detail => detail.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: errorDetails
      });
    }
    
    next();
  };
};

const schemas = {
  signup: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50),
    profileImage: Joi.string().uri()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  review: Joi.object({
    contentId: Joi.string().required(),
    contentType: Joi.string().valid('movie', 'tv').required(),
    rating: Joi.number().min(1).max(10).required(),
    title: Joi.string().max(100).required(),
    content: Joi.string().max(1000).required()
  }),

  watchlistItem: Joi.object({
    contentId: Joi.string().required(),
    contentType: Joi.string().valid('movie', 'tv').required()
  }),

  historyItem: Joi.object({
    contentId: Joi.string().required(),
    contentType: Joi.string().valid('movie', 'tv').required(),
    progress: Joi.number().min(0).max(100),
    seasonNumber: Joi.number().min(1),
    episodeNumber: Joi.number().min(1)
  })
};

module.exports = {
  validateRequest,
  schemas
};
