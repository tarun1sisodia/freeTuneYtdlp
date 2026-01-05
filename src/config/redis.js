import IORedis from "ioredis";
import config from "./config.js";

let redisConnection = null;

export const getRedisConnection = () => {
    if (redisConnection) return redisConnection;

    if (!config.redis.host) {
        console.warn("Redis host not configured");
        return null;
    }

    try {
        const options = {
            host: config.redis.host,
            port: config.redis.port,
            maxRetriesPerRequest: null, // Required by BullMQ
            enableReadyCheck: false,
        };

        if (config.redis.password) {
            options.password = config.redis.password;
        }

        if (config.redis.tls) {
            options.tls = config.redis.tls;
        }

        redisConnection = new IORedis(options);

        redisConnection.on('error', (err) => {
            console.error('Redis Connection Error:', err);
        });

        redisConnection.on('connect', () => {
            console.log('Redis Connection Established (Shared)');
        });

        return redisConnection;
    } catch (error) {
        console.error("Failed to initialize Redis connection:", error);
        return null;
    }
};

export default getRedisConnection;
