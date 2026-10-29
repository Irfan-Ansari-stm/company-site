// backend/src/utils/cache.js
// High-performance in-memory cache with TTL and HTTP header integration

class MemoryCache {
  constructor(defaultTtlSeconds = 60) {
    this.store = new Map();
    this.defaultTtlMs = defaultTtlSeconds * 1000;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds) {
    const ttlMs = (ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlMs / 1000) * 1000;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(key) {
    this.store.delete(key);
  }

  flush() {
    this.store.clear();
  }

  // Express middleware for public GET endpoints
  middleware(ttlSeconds = 60) {
    return (req, res, next) => {
      // Only cache safe GET / HEAD requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      // Check if bypass header is present
      if (req.headers['x-bypass-cache'] || req.query.no_cache) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return next();
      }

      const cacheKey = `${req.originalUrl || req.url}`;
      const cached = this.get(cacheKey);

      // Set standard browser/CDN caching headers
      res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
      res.setHeader('X-Cache-Status', cached ? 'HIT' : 'MISS');

      if (cached) {
        return res.status(200).json(cached);
      }

      // Intercept res.json to populate cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, body, ttlSeconds);
        }
        return originalJson(body);
      };

      next();
    };
  }
}

const memoryCache = new MemoryCache(60);

module.exports = {
  memoryCache,
};

