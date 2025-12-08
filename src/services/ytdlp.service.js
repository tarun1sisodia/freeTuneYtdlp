const YTDlpWrap = require('yt-dlp-wrap').default;
const config = require('../config/config');
const path = require('path');
const fs = require('fs');

// Ensure binary path is correct. In production, this might need to be downloaded or available in path.
const ytDlp = new YTDlpWrap();

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

module.exports = new YtdlpService();
