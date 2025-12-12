import { Worker } from 'bullmq';
import config from '../config/config.js';
import ytdlpService from '../services/ytdlp.service.js';
import { addTranscodeJob } from '../queues/transcode.queue.js';

const connection = config.redis;

const downloadWorker = new Worker('download-queue', async (job) => {
    console.log(`Processing job ${job.id}: ${job.name}`);
    const { query, url } = job.data;

    try {
        // 1. Get Metadata (if not provided)
        let targetUrl = url;
        let metadata = {};
        if (!url && query) {
            metadata = await ytdlpService.getMetadata(query);
            targetUrl = metadata.webpage_url;
            await job.updateProgress({ step: 'metadata', metadata });
        }

        // 2. Download Audio
        const filePath = await ytdlpService.downloadAudio(targetUrl, job.id);
        console.log(`Job ${job.id} downloaded to ${filePath}`);

        // 3. Queue for Transcoding
        await addTranscodeJob({
            filePath,
            originalId: job.id || songId, // Pass original ID for consistency
            metadata
        });

        return { filePath, status: 'downloaded' };
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
    }
}, { connection });

downloadWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed!`);
});

downloadWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with ${err.message}`);
});

export default downloadWorker;
