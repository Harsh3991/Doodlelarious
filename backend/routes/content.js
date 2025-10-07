const express = require('express');
const rapidApiService = require('../services/rapidApiService');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/content/trending:
 *   get:
 *     summary: Get trending content
 *     tags: [Content]
 */
router.get('/trending', optionalAuth, async (req, res, next) => {
  try {
    const { country = 'us', type = 'all' } = req.query;
    const data = await rapidApiService.getTrending(country, type);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/popular/movies:
 *   get:
 *     summary: Get popular movies
 *     tags: [Content]
 */
router.get('/popular/movies', optionalAuth, async (req, res, next) => {
  try {
    const { country = 'us', page = 1 } = req.query;
    const data = await rapidApiService.getPopularMovies(country, page);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/popular/shows:
 *   get:
 *     summary: Get popular TV shows
 *     tags: [Content]
 */
router.get('/popular/shows', optionalAuth, async (req, res, next) => {
  try {
    const { country = 'us', page = 1 } = req.query;
    const data = await rapidApiService.getPopularShows(country, page);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/search:
 *   get:
 *     summary: Search content
 *     tags: [Content]
 */
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const { q, country = 'us', type = 'all' } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const data = await rapidApiService.searchContent(q, country, type);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/movie/{id}:
 *   get:
 *     summary: Get movie details
 *     tags: [Content]
 */
router.get('/movie/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await rapidApiService.getContentDetails(id, 'movie');
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/content/show/{id}:
 *   get:
 *     summary: Get TV show details
 *     tags: [Content]
 */
router.get('/show/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await rapidApiService.getContentDetails(id, 'series');
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/genre/:genreId', optionalAuth, async (req, res, next) => {
  try {
    const { genreId } = req.params;
    const { country = 'us', type = 'all' } = req.query;
    const data = await rapidApiService.getContentByGenre(genreId, country, type);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/upcoming', optionalAuth, async (req, res, next) => {
  try {
    const { country = 'us' } = req.query;
    const data = await rapidApiService.getUpcomingMovies(country);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/now-playing', optionalAuth, async (req, res, next) => {
  try {
    const { country = 'us' } = req.query;
    const data = await rapidApiService.getNowPlayingMovies(country);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/airing-today', optionalAuth, async (req, res, next) => {
  try {
    const { country = 'us' } = req.query;
    const data = await rapidApiService.getAiringTodayShows(country);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/videos', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'movie' } = req.query;
    const data = await rapidApiService.getContentVideos(id, type);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/similar', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type = 'movie' } = req.query;
    const data = await rapidApiService.getSimilarContent(id, type);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
