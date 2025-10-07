const express = require('express');
const rapidApiService = require('../services/rapidApiService');

const router = express.Router();

/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get available genres
 *     tags: [Utilities]
 */
router.get('/genres', async (req, res, next) => {
  try {
    const genres = await rapidApiService.getGenres();
    
    res.json({
      success: true,
      genres
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
