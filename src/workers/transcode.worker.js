const { Worker } = require('bullmq');
const config = require('../config/config');
const transcodeService = require('../services/transcode.service');
const { addUploadJob } = require('../queues/upload.queue');

const connection = config.redis;

const transcodeWorker = new Worker('transcode-queue', async (job) => {
    console.log(`Processing transcode job ${job.id}`);
    const { filePath } = job.data;

    try {
        // 1. Transcode to HLS
        const hlsPath = await transcodeService.transcodeToHls(filePath, job.id);
        await job.updateProgress({ step: 'transcoded', hlsPath });

        // 2. Queue for Upload
        await addUploadJob({
            hlsPath,
            originalId: job.id,
            metadata: job.data.metadata
        });

        console.log(`Job ${job.id} transcoded to ${hlsPath}`);
        return { hlsPath, status: 'transcoded' };
    } catch (error) {
        console.error(`Transcode job ${job.id} failed:`, error);
        throw error;
    }
}, { connection });

module.exports = transcodeWorker;
