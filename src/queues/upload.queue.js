import { Queue } from 'bullmq';
import config from '../config/config.js';

import { getRedisConnection } from '../config/redis.js';

export const uploadQueue = new Queue('upload-queue', {
    connection: getRedisConnection(),
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 100 },
    }
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
