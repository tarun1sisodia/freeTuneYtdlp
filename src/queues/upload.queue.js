import { Queue } from 'bullmq';
import config from '../config/config.js';

export const uploadQueue = new Queue('upload-queue', {
    connection: config.redis
});

export const addUploadJob = async (data) => {
    return await uploadQueue.add('upload-files', data, {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    });
};
