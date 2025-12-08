import express from 'express';
import config from './config/config.js';
import { addDownloadJob } from './queues/download.queue.js';
import './workers/download.worker.js';
import './workers/transcode.worker.js';
import './workers/upload.worker.js';

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
