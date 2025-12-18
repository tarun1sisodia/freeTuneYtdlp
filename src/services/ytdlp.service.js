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
     * Validates and sanitizes the input URL or query
     * @param {string} input 
     * @returns {boolean}
     */
    isValidInput(input) {
        if (!input || typeof input !== 'string') return false;
        // Block file:// protocol and other dangerous patterns
        if (input.match(/^(file|ftp|local|data):/i)) return false;
        // Block internal IP ranges (basic check)
        if (input.match(/(^|\s|@)(localhost|127\.|169\.254\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1]))/)) return false;
        return true;
    }

    /**
     * Fetch video metadata
     * @param {string} query - Search query or URL
     * @returns {Promise<any>}
     */
    async getMetadata(query) {
        await this.ensureBinary();

        if (!this.isValidInput(query)) {
            throw new Error('Invalid or restricted input query/url');
        }

        try {
            const isUrl = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/.test(query);

            // Security flags to prevent SSRF and DoS
            const securityArgs = [
                '--force-ipv4',
                '--no-check-certificate', // Sometimes needed but can be risky, keep strict if possible. Let's stick to safe defaults.
                '--match-filter', 'duration < 1200', // Max 20 mins to prevent huge downloads DOS
                '--max-filesize', '100M', // Hard limit 100MB
            ];

            const args = ['--dump-json', ...securityArgs];

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

        if (!this.isValidInput(url)) {
            throw new Error('Invalid or restricted input URL');
        }

        const outputPath = path.join(this.downloadPath, `${jobId}.mp3`);

        // Security flags
        const securityArgs = [
            '--force-ipv4',
            '--match-filter', 'duration < 1200',
            '--max-filesize', '100M',
        ];

        // Command to download best audio and convert to mp3
        const args = [
            url,
            '-x', // Extract audio
            '--audio-format', 'mp3',
            '--audio-quality', '0', // Best quality
            '-o', outputPath,
            ...securityArgs
        ];

        return new Promise((resolve, reject) => {
            this.ytDlp.exec(args)
                .on('error', (error) => reject(error))
                .on('close', () => resolve(outputPath));
        });
    }
}

export default new YtdlpService();
