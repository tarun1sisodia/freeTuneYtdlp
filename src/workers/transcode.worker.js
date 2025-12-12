import { Worker } from 'bullmq';
import config from '../config/config.js';
import transcodeService from '../services/transcode.service.js';
import storageService from '../services/storage.service.js';
import { addUploadJob } from '../queues/upload.queue.js';
import path from 'path';
import fs from 'fs';

const connection = config.redis;

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

        // 1. Transcode to HLS
        const hlsPath = await transcodeService.transcodeToHls(filePath, job.id);
        await job.updateProgress({ step: 'transcoded', hlsPath });

        // 2. Queue for Upload
        await addUploadJob({
            hlsPath,
            originalId: songId || job.id, // Use songId for R2 uploads, job.id for scraping
            metadata: job.data.metadata
        });

        console.log(`Job ${job.id} transcoded to ${hlsPath}`);
        return { hlsPath, status: 'transcoded' };
    } catch (error) {
        console.error(`Transcode job ${job.id} failed:`, error);
        throw error;
    }
}, { connection });

export default transcodeWorker;
