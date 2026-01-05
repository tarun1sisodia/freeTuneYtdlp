import { Queue } from 'bullmq';
import config from '../config/config.js';

import { getRedisConnection } from '../config/redis.js';

export const transcodeQueue = new Queue('transcode-queue', {
    connection: getRedisConnection(),
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 100 },
    }
});

export const addTranscodeJob = async (data) => {
    return await transcodeQueue.add('transcode-audio', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    });
};
