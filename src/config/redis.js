const redis = require('redis');

class RedisClient {
    constructor() {
        this.client = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.client.on('connect', () => {
            console.log('Redis Client Connected');
        });
    }

    async set(key, value, expiry = 3600) {
        return new Promise((resolve, reject) => {
            this.client.setex(key, expiry, JSON.stringify(value), (err, reply) => {
                if (err) reject(err);
                resolve(reply);
            });
        });
    }

    async get(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, reply) => {
                if (err) reject(err);
                resolve(JSON.parse(reply));
            });
        });
    }

    async del(key) {
        return new Promise((resolve, reject) => {
            this.client.del(key, (err, reply) => {
                if (err) reject(err);
                resolve(reply);
            });
        });
    }
}

module.exports = new RedisClient();