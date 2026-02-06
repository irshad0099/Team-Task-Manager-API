const redisClient = require('../config/redis');

class CacheService {
    constructor() {
        this.client = redisClient;
        this.DEFAULT_TTL = 3600; // 1 hour
    }

    // Generate cache key
    generateCacheKey(prefix, params) {
        const paramsString = JSON.stringify(params);
        return `${prefix}:${paramsString}`;
    }

    // Get cached data
    async get(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    // Set cache data
    async set(key, data, ttl = this.DEFAULT_TTL) {
        try {
            await this.client.set(key, JSON.stringify(data), 'EX', ttl);
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    // Delete cache key
    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    // Invalidate cache by pattern
    async invalidateByPattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
            return keys.length;
        } catch (error) {
            console.error('Cache invalidate pattern error:', error);
            return 0;
        }
    }

    // Task-specific cache methods
    async getTasks(teamId, page, limit, filters) {
        const cacheKey = this.generateCacheKey('tasks', {
            teamId,
            page,
            limit,
            ...filters
        });
        return this.get(cacheKey);
    }

    async setTasks(teamId, page, limit, filters, data, ttl = 1800) {
        const cacheKey = this.generateCacheKey('tasks', {
            teamId,
            page,
            limit,
            ...filters
        });
        return this.set(cacheKey, data, ttl);
    }

    async invalidateTeamTasks(teamId) {
        // Invalidate all task-related cache for this team
        const patterns = [
            `tasks:*teamId*${teamId}*`,
            `tasks:*teamId*${teamId}:*`,
            `*tasks*team*${teamId}*`
        ];

        let totalInvalidated = 0;
        for (const pattern of patterns) {
            const count = await this.invalidateByPattern(pattern);
            totalInvalidated += count;
        }

        console.log(`Invalidated ${totalInvalidated} cache entries for team ${teamId}`);
        return totalInvalidated;
    }

    // User-specific cache methods
    async getUserData(userId) {
        const cacheKey = `user:${userId}`;
        return this.get(cacheKey);
    }

    async setUserData(userId, data, ttl = 7200) {
        const cacheKey = `user:${userId}`;
        return this.set(cacheKey, data, ttl);
    }

    async invalidateUserData(userId) {
        const cacheKey = `user:${userId}`;
        return this.del(cacheKey);
    }

    // Team-specific cache methods
    async getTeamData(teamId) {
        const cacheKey = `team:${teamId}`;
        return this.get(cacheKey);
    }

    async setTeamData(teamId, data, ttl = 7200) {
        const cacheKey = `team:${teamId}`;
        return this.set(cacheKey, data, ttl);
    }

    async invalidateTeamData(teamId) {
        const cacheKey = `team:${teamId}`;
        return this.del(cacheKey);
    }

    // Activity cache methods
    async getActivities(teamId, page, limit) {
        const cacheKey = this.generateCacheKey('activities', {
            teamId,
            page,
            limit
        });
        return this.get(cacheKey);
    }

    async setActivities(teamId, page, limit, data, ttl = 900) {
        const cacheKey = this.generateCacheKey('activities', {
            teamId,
            page,
            limit
        });
        return this.set(cacheKey, data, ttl);
    }

    async invalidateTeamActivities(teamId) {
        const pattern = `activities:*teamId*${teamId}*`;
        return this.invalidateByPattern(pattern);
    }

    // Clear all cache
    async clearAll() {
        try {
            await this.client.flushall();
            console.log('All cache cleared');
            return true;
        } catch (error) {
            console.error('Cache clear all error:', error);
            return false;
        }
    }

    // Get cache statistics
    async getStats() {
        try {
            const info = await this.client.info('memory');
            const keysCount = await this.client.dbSize();
            
            return {
                keysCount,
                info: info.split('\r\n').reduce((obj, line) => {
                    const [key, value] = line.split(':');
                    if (key && value) obj[key] = value;
                    return obj;
                }, {})
            };
        } catch (error) {
            console.error('Cache stats error:', error);
            return null;
        }
    }

    // Health check
    async healthCheck() {
        try {
            await this.client.ping();
            return { status: 'healthy', timestamp: new Date() };
        } catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date() };
        }
    }
}

module.exports = new CacheService();