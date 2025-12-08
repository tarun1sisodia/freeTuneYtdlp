const { Queue } = require('bullmq');
const config = require('../config/config');

const uploadQueue = new Queue('upload-queue', {
    connection: config.redis
});

module.exports = {
    uploadQueue,

    addUploadJob: async (data) => {
        return await uploadQueue.add('upload-files', data, {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }
};
