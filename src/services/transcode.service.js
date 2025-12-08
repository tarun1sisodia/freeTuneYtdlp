import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import config from '../config/config.js';

class TranscodeService {
    /**
     * Transcode input file to HLS playlist with multiple qualities
     * @param {string} inputPath - Path to input audio file
     * @param {string} jobId - Job ID for unique output directory
     * @returns {Promise<string>} - Path to the output directory containing HLS files
     */
    async transcodeToHls(inputPath, jobId) {
        const outputDir = path.join(path.dirname(inputPath), jobId);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputMasterPlaylist = path.join(outputDir, 'master.m3u8');

        // Quality variants
        const qualities = [
            { name: 'low', bitrate: '64k' },
            { name: 'medium', bitrate: '128k' },
            { name: 'high', bitrate: '256k' }
        ];

        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath);

            qualities.forEach((q) => {
                command
                    .output(path.join(outputDir, `${q.name}.m3u8`))
                    .audioCodec('aac')
                    .audioBitrate(q.bitrate)
                    .format('hls')
                    .addOption('-hls_time', '6') // 6 second segments
                    .addOption('-hls_list_size', '0') // All segments in playlist
                    .addOption('-hls_segment_filename', path.join(outputDir, `${q.name}_%03d.ts`));
            });

            command
                .on('end', () => {
                    // Generate master playlist manually or assume client handles variant selection
                    // For simplicity, we will create a basic master playlist pointing to variants
                    this.createMasterPlaylist(outputMasterPlaylist, qualities);
                    resolve(outputDir);
                })
                .on('error', (err) => {
                    console.error('Transcoding error:', err);
                    reject(err);
                })
                .run();
        });
    }

    createMasterPlaylist(outputPath, qualities) {
        let content = '#EXTM3U\n#EXT-X-VERSION:3\n';
        qualities.forEach(q => {
            // Approximate bandwidth calculation
            const bandwidth = parseInt(q.bitrate) * 1000;
            content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},CODECS="mp4a.40.2"\n`;
            content += `${q.name}.m3u8\n`;
        });
        fs.writeFileSync(outputPath, content);
    }
}

export default new TranscodeService();
