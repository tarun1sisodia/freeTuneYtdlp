const express = require('express');
const config = require('./config/config');
const { addDownloadJob } = require('./queues/download.queue');
require('./workers/download.worker');
require('./workers/transcode.worker');
require('./workers/upload.worker');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'freeTuneYtdlp' });
});

app.post('/download', async (req, res) => {
    const { query, url } = req.body;
    if (!query && !url) {
        return res.status(400).json({ error: 'Missing query or url' });
    }

    try {
        const job = await addDownloadJob({ query, url });
        res.json({ jobId: job.id, status: 'queued' });
    } catch (error) {
        console.error('Error queuing job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(config.port, () => {
    console.log(`freeTuneYtdlp service running on port ${config.port}`);
});
