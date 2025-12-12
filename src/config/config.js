import dotenv from 'dotenv';
dotenv.config();

const redisConfig = process.env.REDIS_URL
    ? {
        host: new URL(process.env.REDIS_URL).hostname,
        port: parseInt(new URL(process.env.REDIS_URL).port) || 6379,
        ...(process.env.REDIS_TOKEN && { password: process.env.REDIS_TOKEN }),
        tls: process.env.REDIS_URL.startsWith('https') ? {} : undefined,
    }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    };

export default {
    port: process.env.YTDLP_PORT || process.env.PORT || 3002, // Avoid port 3000 (Backend) and 3001 (Frontend?)

    redis: redisConfig,

    ytdlp: {
        maxConcurrent: parseInt(process.env.YTDLP_MAX_CONCURRENT) || 5,
        timeout: parseInt(process.env.YTDLP_TIMEOUT) || 300000, // 5 minutes
    },

    aws: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'auto',
        // Construct R2 endpoint if Account ID is provided, otherwise use AWS_ENDPOINT
        endpoint: process.env.R2_ACCOUNT_ID
            ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
            : process.env.AWS_ENDPOINT,
        bucket: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET_MUSIC || 'music',
    }
};
