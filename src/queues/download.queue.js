import { Queue } from 'bullmq';
import config from '../config/config.js';

export const downloadQueue = new Queue('download-queue', {
    connection: config.redis
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
