const axios = require('axios');
const logger = require('../utils/logger');

class RapidApiService {
  constructor() {
    this.baseURL = 'https://streaming-availability.p.rapidapi.com';
    this.headers = {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'streaming-availability.p.rapidapi.com'
    };
  }

  async makeRequest(endpoint, params = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: this.headers,
        params
      });
      return response.data;
    } catch (error) {
      logger.error(`RapidAPI request failed for ${endpoint}:`, error.message);
      if (error.response) {
        logger.error(`Status: ${error.response.status}, Data:`, error.response.data);
      }
      throw new Error(`Failed to fetch data from streaming service: ${error.message}`);
    }
  }

  // Get trending content using searchShowsByFilters with popularity ordering
  async getTrending(country = 'us', type = 'all') {
    const params = {
      country: country,
      order_by: 'popularity_1year',
      order_direction: 'desc'
    };

    if (type !== 'all') {
      params.show_type = type === 'series' ? 'series' : 'movie';
    }

    return await this.makeRequest('/shows/search/filters', params);
  }

  // Get popular movies
  async getPopularMovies(country = 'us', page = 1) {
    const params = {
      country: country,
      show_type: 'movie',
      order_by: 'popularity_1year',
      order_direction: 'desc'
    };

    if (page > 1) {
      // Calculate cursor for pagination - this would need to be stored from previous requests
      // For now, we'll just return the first page
    }

    return await this.makeRequest('/shows/search/filters', params);
  }

  // Get popular TV shows
  async getPopularShows(country = 'us', page = 1) {
    const params = {
      country: country,
      show_type: 'series',
      order_by: 'popularity_1year',
      order_direction: 'desc'
    };

    return await this.makeRequest('/shows/search/filters', params);
  }

  // Search content by title
  async searchContent(query, country = 'us', type = 'all') {
    const params = {
      title: query,
      country: country
    };

    if (type !== 'all') {
      params.show_type = type === 'series' ? 'series' : 'movie';
    }

    return await this.makeRequest('/shows/search/title', params);
  }

  // Get content details by ID
  async getContentDetails(id, type) {
    const params = {
      country: 'us'
    };

    return await this.makeRequest(`/shows/${id}`, params);
  }

  // Get content by genre
  async getContentByGenre(genre, country = 'us', type = 'all') {
    const params = {
      country: country,
      genres: [genre]
    };

    if (type !== 'all') {
      params.show_type = type === 'series' ? 'series' : 'movie';
    }

    return await this.makeRequest('/shows/search/filters', params);
  }

  // Get upcoming movies using changes endpoint
  async getUpcomingMovies(country = 'us') {
    const params = {
      country: country,
      change_type: 'upcoming',
      item_type: 'show',
      show_type: 'movie'
    };

    return await this.makeRequest('/changes', params);
  }

  // Get now playing movies - use popular movies as fallback
  async getNowPlayingMovies(country = 'us') {
    return await this.getPopularMovies(country);
  }

  // Get airing today shows using changes endpoint
  async getAiringTodayShows(country = 'us') {
    const params = {
      country: country,
      change_type: 'new',
      item_type: 'show',
      show_type: 'series'
    };

    return await this.makeRequest('/changes', params);
  }

  // Get similar content - use genre-based search as approximation
  async getSimilarContent(id, type) {
    try {
      // First get the show details to find genres
      const showDetails = await this.getContentDetails(id, type);
      
      if (showDetails && showDetails.genres && showDetails.genres.length > 0) {
        // Use the first genre to find similar content
        const genreId = showDetails.genres[0].id;
        return await this.getContentByGenre(genreId, 'us', type);
      }
      
      // Fallback to empty results
      return { shows: [], hasMore: false };
    } catch (error) {
      logger.error('Error fetching similar content:', error.message);
      return { shows: [], hasMore: false };
    }
  }

  // Get content videos - API doesn't provide video endpoints, return empty
  async getContentVideos(id, type) {
    return { videos: [] };
  }

  // Get top shows by service
  async getTopShows(country = 'us', service = 'netflix', showType = null) {
    const params = {
      country: country,
      service: service
    };

    if (showType) {
      params.show_type = showType;
    }

    return await this.makeRequest('/shows/top', params);
  }

  // Get new releases using changes endpoint
  async getNewReleases(country = 'us', catalogs = ['netflix']) {
    const params = {
      country: country,
      change_type: 'new',
      item_type: 'show',
      catalogs: catalogs
    };

    return await this.makeRequest('/changes', params);
  }

  // Get expiring content using changes endpoint
  async getExpiringContent(country = 'us', catalogs = ['netflix']) {
    const params = {
      country: country,
      change_type: 'expiring',
      item_type: 'show',
      catalogs: catalogs
    };

    return await this.makeRequest('/changes', params);
  }

  // Get content by streaming service
  async getContentByService(service, country = 'us', type = 'all') {
    const params = {
      country: country,
      catalogs: [service],
      order_by: 'popularity_1year',
      order_direction: 'desc'
    };

    if (type !== 'all') {
      params.show_type = type === 'series' ? 'series' : 'movie';
    }

    return await this.makeRequest('/shows/search/filters', params);
  }

  // Search with advanced filters
  async searchAdvanced(filters) {
    const params = {
      country: filters.country || 'us',
      ...filters
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    return await this.makeRequest('/shows/search/filters', params);
  }

  // Get show by IMDb ID
  async getShowByImdbId(imdbId, country = 'us') {
    const params = { country };
    return await this.makeRequest(`/shows/${imdbId}`, params);
  }

  // Legacy method implementations for backward compatibility
  async getContentImages(id, type) {
    // Images are included in the show details, no separate endpoint
    try {
      const showDetails = await this.getContentDetails(id, type);
      return { images: showDetails.imageSet || {} };
    } catch (error) {
      return { images: {} };
    }
  }

  async getContentCredits(id, type) {
    // Credits info is included in show details (directors, cast)
    try {
      const showDetails = await this.getContentDetails(id, type);
      return {
        cast: showDetails.cast || [],
        crew: showDetails.directors ? showDetails.directors.map(d => ({ name: d, job: 'Director' })) : []
      };
    } catch (error) {
      return { cast: [], crew: [] };
    }
  }

  async getSeasonDetails(showId, seasonNumber) {
    // Season details would be in the show details with series_granularity=season
    const params = {
      country: 'us',
      series_granularity: 'season'
    };
    
    try {
      const showDetails = await this.makeRequest(`/shows/${showId}`, params);
      const season = showDetails.seasons?.find(s => s.seasonNumber === seasonNumber);
      return season || null;
    } catch (error) {
      return null;
    }
  }

  async getEpisodeDetails(showId, seasonNumber, episodeNumber) {
    // Episode details would be in the show details with series_granularity=episode
    const params = {
      country: 'us',
      series_granularity: 'episode'
    };
    
    try {
      const showDetails = await this.makeRequest(`/shows/${showId}`, params);
      const season = showDetails.seasons?.find(s => s.seasonNumber === seasonNumber);
      const episode = season?.episodes?.find(e => e.episodeNumber === episodeNumber);
      return episode || null;
    } catch (error) {
      return null;
    }
  }

  async getGenres() {
    // The API doesn't have a dedicated genres endpoint, return common genres
    return {
      genres: [
        { id: 'action', name: 'Action' },
        { id: 'adventure', name: 'Adventure' },
        { id: 'animation', name: 'Animation' },
        { id: 'comedy', name: 'Comedy' },
        { id: 'crime', name: 'Crime' },
        { id: 'documentary', name: 'Documentary' },
        { id: 'drama', name: 'Drama' },
        { id: 'family', name: 'Family' },
        { id: 'fantasy', name: 'Fantasy' },
        { id: 'history', name: 'History' },
        { id: 'horror', name: 'Horror' },
        { id: 'music', name: 'Music' },
        { id: 'mystery', name: 'Mystery' },
        { id: 'romance', name: 'Romance' },
        { id: 'scifi', name: 'Science Fiction' },
        { id: 'thriller', name: 'Thriller' },
        { id: 'war', name: 'War' },
        { id: 'western', name: 'Western' }
      ]
    };
  }
}

module.exports = new RapidApiService();
