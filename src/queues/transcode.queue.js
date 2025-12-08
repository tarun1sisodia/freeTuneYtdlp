const { Queue } = require('bullmq');
const config = require('../config/config');

const transcodeQueue = new Queue('transcode-queue', {
    connection: config.redis
});

module.exports = {
    transcodeQueue,

    addTranscodeJob: async (data) => {
        return await transcodeQueue.add('transcode-audio', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
};
