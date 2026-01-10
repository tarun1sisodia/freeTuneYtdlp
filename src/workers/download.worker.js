import { Worker } from 'bullmq';
import config from '../config/config.js';
import ytdlpService from '../services/ytdlp.service.js';
import { addTranscodeJob } from '../queues/transcode.queue.js';
import crypto from 'crypto';

import { getRedisConnection } from '../config/redis.js';

const connection = getRedisConnection();

const downloadWorker = new Worker('download-queue', async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);
    const { query, url } = job.data;

    try {
        // 1. Get Metadata & Determine ID
        const currentSongId = job.data.songId || crypto.randomUUID();
        let targetUrl = url;
        let metadata = {};

        const input = url || query;
        if (input) {
            console.log(`Fetching metadata for: ${input}`);
            metadata = await ytdlpService.getMetadata(input);

            // If we started with a query, use the resolved URL
            if (!url && metadata.webpage_url) {
                targetUrl = metadata.webpage_url;
            }

            await job.updateProgress({ step: 'metadata', metadata });
        }

        // 2. Download Audio
        // Use consistent ID for file naming
        const filePath = await ytdlpService.downloadAudio(targetUrl, currentSongId);
        console.log(`Job ${job.id} downloaded to ${filePath} (ID: ${currentSongId})`);

        // 3. Queue for Transcoding
        await addTranscodeJob({
            filePath,
            originalId: currentSongId, // Pass the UUID
            songId: currentSongId,     // Pass the UUID
            metadata,
            userId: job.data.userId,
            sourceUrl: url || targetUrl, // Pass original URL for context
            query // Pass original query for context
        });

        return { filePath, status: 'downloaded' };
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
    }
}, {
    connection: config.redis, // Use config to create fresh connection matching our requirements
    metrics: {
        maxDataPoints: 0
    }
});

downloadWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

downloadWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with ${err.message}`);
});

export default downloadWorker;
