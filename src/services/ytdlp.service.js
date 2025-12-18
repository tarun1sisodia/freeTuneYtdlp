import YTDlpWrapPkg from 'yt-dlp-wrap';
const YTDlpWrap = YTDlpWrapPkg.default;
import path from 'path';
import fs from 'fs';
import { updateYtDlp, BINARY_PATH } from '../scripts/update-ytdlp.js';

class YtdlpService {
    constructor() {
        this.downloadPath = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath);
        }

        // Initialize wrapper with designated binary path
        // We will check for existence in methods to allow async update
        this.ytDlp = new YTDlpWrap(BINARY_PATH);
    }

    /**
     * Ensures the binary exists before operation
     */
    async ensureBinary() {
        if (!fs.existsSync(BINARY_PATH)) {
            console.log('yt-dlp binary not found, triggering update...');
            await updateYtDlp();
        }
    }

    /**
     * Fetch video metadata
     * @param {string} query - Search query or URL
     * @returns {Promise<any>}
     */
    async getMetadata(query) {
        await this.ensureBinary();

        try {
            const isUrl = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/.test(query);
            const args = ['--dump-json'];

            if (isUrl) {
                args.push(query);
            } else {
                args.push(`ytsearch1:${query}`);
            }

            const result = await this.ytDlp.execPromise(args);
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
        await this.ensureBinary();

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
            this.ytDlp.exec(args)
                .on('error', (error) => reject(error))
                .on('close', () => resolve(outputPath));
        });
    }
}

export default new YtdlpService();
