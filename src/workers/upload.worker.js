const { Worker } = require('bullmq');
const config = require('../config/config');
const storageService = require('../services/storage.service');
const fs = require('fs');

const connection = config.redis;

const uploadWorker = new Worker('upload-queue', async (job) => {
    console.log(`Processing upload job ${job.id}`);
    const { hlsPath, originalId } = job.data;

    try {
        // 1. Upload Directory to R2
        // Key structure: songId/master.m3u8, songId/low.m3u8, etc.
        const keyPrefix = `songs/${originalId}`;
        await storageService.uploadDirectory(hlsPath, keyPrefix);

        // 2. Cleanup Local Files (Optional but recommended)
        fs.rmSync(hlsPath, { recursive: true, force: true });

        console.log(`Job ${job.id} uploaded to ${keyPrefix}`);
        return {
            uploaded: true,
            keyPrefix,
            url: `https://${config.aws.bucket}.r2.cloudflarestorage.com/${keyPrefix}/master.m3u8`
        };
    } catch (error) {
        console.error(`Upload job ${job.id} failed:`, error);
        throw error;
    }
}, { connection });

module.exports = uploadWorker;
