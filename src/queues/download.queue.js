import { Queue } from 'bullmq';
import config from '../config/config.js';

import { getRedisConnection } from '../config/redis.js';

export const downloadQueue = new Queue('download-queue', {
    connection: getRedisConnection(),
    defaultJobOptions: {
        removeOnComplete: true, // Auto-remove completed jobs
        removeOnFail: { count: 100 }, // Keep only last 100 failed
    }
});

export const addDownloadJob = async (data) => {
    return await downloadQueue.add('download-audio', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
};
