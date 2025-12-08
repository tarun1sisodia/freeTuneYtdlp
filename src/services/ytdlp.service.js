import YTDlpWrap from 'yt-dlp-wrap';
import config from '../config/config.js';
import path from 'path';
import fs from 'fs';

// Ensure binary path is correct. In production, this might need to be downloaded or available in path.
const ytDlp = new YTDlpWrap.default(); // YTDlpWrap exports default as commonjs, might need .default depending on import handling or just check behavior. 
// Actually, 'yt-dlp-wrap' default export behavior in ES modules might vary. 
// Based on previous file: const YTDlpWrap = require('yt-dlp-wrap').default;
// In ES6 import YTDlpWrap from '...' usually gets the default export.
// Let's assume 'yt-dlp-wrap' exports the class as default.

class YtdlpService {
    constructor() {
        this.downloadPath = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath);
        }
    }

    /**
     * Fetch video metadata
     * @param {string} query - Search query or URL
     * @returns {Promise<any>}
     */
    async getMetadata(query) {
        try {
            // ytsearch1: searches for the first result
            const result = await ytDlp.execPromise([
                '--dump-json',
                `ytsearch1:${query}`
            ]);
            return JSON.parse(result);
        } catch (error) {
            console.error('YTDLP Metadata Error:', error);
            throw error;
        }
    }

    /**
     * Download audio and convert to format
     * @param {string} url - Video URL
     * @param {string} jobId - Unique job ID for filename
     * @returns {Promise<string>} - Path to downloaded file
     */
    async downloadAudio(url, jobId) {
        const outputPath = path.join(this.downloadPath, `${jobId}.mp3`);

        // Command to download best audio and convert to mp3
        const args = [
            url,
            '-x', // Extract audio
            '--audio-format', 'mp3',
            '--audio-quality', '0', // Best quality
            '-o', outputPath
        ];

        return new Promise((resolve, reject) => {
            ytDlp.exec(args)
                .on('error', (error) => reject(error))
                .on('close', () => resolve(outputPath));
        });
    }
}

export default new YtdlpService();
