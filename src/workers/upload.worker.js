import { Worker } from 'bullmq';
import config from '../config/config.js';
import storageService from '../services/storage.service.js';
import fs from 'fs';

import { getRedisConnection } from '../config/redis.js';

const connection = getRedisConnection();

const uploadWorker = new Worker('upload-queue', async (job) => {
    console.log(`Processing upload job ${job.id}`);
    const { hlsPath, originalId } = job.data;

    try {
        // 1. Upload Directory to R2
        // Key structure: songId/master.m3u8, songId/low.m3u8, etc.
        const keyPrefix = `songs/${originalId}`;
        const uploadResult = await storageService.uploadDirectory(hlsPath, keyPrefix);

        // 2. Cleanup Local Files (Optional but recommended)
        fs.rmSync(hlsPath, { recursive: true, force: true });

        console.log(`Job ${job.id} uploaded to ${keyPrefix}`);
        return {
            url: uploadResult.url, // Master playlist URL
            keyPrefix: uploadResult.keyPrefix, // Directory key in R2
            originalId: job.data.originalId,
            songId: job.data.songId,
            metadata: job.data.metadata,
            userId: job.data.userId
        };
    } catch (error) {
        console.error(`Upload job ${job.id} failed:`, error);
        throw error;
    }
}, {
    connection: config.redis,
    metrics: {
        maxDataPoints: 0
    }
});

export default uploadWorker;
