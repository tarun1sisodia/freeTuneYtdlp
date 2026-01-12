import { Worker } from 'bullmq';
import config from '../config/config.js';
import storageService from '../services/storage.service.js';
import fs from 'fs';

import { getRedisConnection } from '../config/redis.js';

const connection = getRedisConnection();

const uploadWorker = new Worker('upload-queue', async (job) => {
    console.log(`Processing upload job ${job.id}`);
    const { hlsPath, originalId, originalMp3Path } = job.data;
    console.log(`Upload Worker: Checking path ${hlsPath} (Exists: ${fs.existsSync(hlsPath)})`);

    try {
        // 1. Upload Directory to R2 (HLS)
        // Key structure: songs/songId/master.m3u8, etc.
        const keyPrefix = `songs/${originalId}`;
        const uploadResult = await storageService.uploadDirectory(hlsPath, keyPrefix);

        // 1.5 Upload Original MP3 to R2
        let originalMp3Url = null;
        if (originalMp3Path && fs.existsSync(originalMp3Path)) {
            const mp3Key = `songs/${originalId}/original.mp3`;
            console.log(`Uploading original MP3 to ${mp3Key}...`);
            originalMp3Url = await storageService.uploadFile(originalMp3Path, mp3Key);
        }

        // 2. Cleanup Local Files
        // Cleanup HLS directory
        if (fs.existsSync(hlsPath)) fs.rmSync(hlsPath, { recursive: true, force: true });
        // Cleanup Original MP3
        if (originalMp3Path && fs.existsSync(originalMp3Path)) fs.rmSync(originalMp3Path, { force: true });


        console.log(`Job ${job.id} uploaded to ${keyPrefix}`);
        return {
            url: uploadResult.url, // Master playlist URL
            originalMp3Url,        // Direct MP3 URL for caching/mobile
            keyPrefix: uploadResult.keyPrefix,
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
