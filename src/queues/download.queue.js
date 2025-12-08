const { Queue } = require('bullmq');
const config = require('../config/config');

const downloadQueue = new Queue('download-queue', {
    connection: config.redis
});

module.exports = {
    downloadQueue,

    addDownloadJob: async (data) => {
        return await downloadQueue.add('download-audio', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
};
