import { Queue } from 'bullmq';
import config from '../config/config.js';

export const transcodeQueue = new Queue('transcode-queue', {
    connection: config.redis
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
