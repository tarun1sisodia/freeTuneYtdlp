import { Worker } from 'bullmq';
import config from '../config/config.js';
import transcodeService from '../services/transcode.service.js';
import storageService from '../services/storage.service.js';
import { addUploadJob } from '../queues/upload.queue.js';
import path from 'path';
import fs from 'fs';

import { getRedisConnection } from '../config/redis.js';

const connection = getRedisConnection();

const transcodeWorker = new Worker('transcode-queue', async (job) => {
    console.log(`Processing transcode job ${job.id}`);
    let { filePath, source, fileKey, songId } = job.data;

    try {
        // 0. Download from R2 if needed
        if (source === 'r2') {
            await job.updateProgress({ step: 'downloading', fileKey });
            const downloadDir = path.resolve('downloads');
            if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

            const localFileName = `${songId}_${path.basename(fileKey)}`;
            filePath = path.join(downloadDir, localFileName);

            console.log(`Downloading ${fileKey} to ${filePath}...`);
            await storageService.downloadFile(fileKey, filePath);
            console.log(`Download complete.`);
        }

        // 0.5 Pre-transcode check
        if (!filePath || !fs.existsSync(filePath)) {
            throw new Error(`Input file not found for transcoding: ${filePath}`);
        }

        // 1. Transcode to HLS
        // Use the stable ID for the HLS directory, not the ephemeral job ID
        const stableId = job.data.songId || job.data.originalId || job.id;
        const hlsPath = await transcodeService.transcodeToHls(filePath, stableId);
        await job.updateProgress({ step: 'transcoded', hlsPath });

        // 2. Queue for Upload
        await addUploadJob({
            hlsPath,
            originalId: stableId,
            songId: stableId,
            songId: stableId,
            metadata: job.data.metadata,
            userId: job.data.userId,
            originalMp3Path: filePath // Pass original MP3 for direct upload
        });

        console.log(`Job ${job.id} transcoded to ${hlsPath}`);
        return { hlsPath, status: 'transcoded' };
    } catch (error) {
        console.error(`Transcode job ${job.id} failed:`, error);
        throw error;
    }
}, {
    connection: config.redis,
    metrics: {
        maxDataPoints: 0
    }
});

export default transcodeWorker;
