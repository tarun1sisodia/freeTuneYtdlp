require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3001,

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    },

    ytdlp: {
        maxConcurrent: parseInt(process.env.YTDLP_MAX_CONCURRENT) || 5,
        timeout: parseInt(process.env.YTDLP_TIMEOUT) || 300000, // 5 minutes
    },

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'auto',
        endpoint: process.env.AWS_ENDPOINT, // Cloudflare R2 endpoint
        bucket: process.env.R2_BUCKET_MUSIC || 'freetune-music',
    }
};
