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
        // 1. Get Metadata (Always fetch to ensure DB has info)
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
        const filePath = await ytdlpService.downloadAudio(targetUrl, job.id);
        console.log(`Job ${job.id} downloaded to ${filePath}`);

        // 3. Queue for Transcoding
        await addTranscodeJob({
            filePath,
            originalId: job.id, // Pass job.id as originalId
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
