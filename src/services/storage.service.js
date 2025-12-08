const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class StorageService {
    constructor() {
        this.s3Client = new S3Client({
            region: config.aws.region,
            endpoint: config.aws.endpoint,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            },
        });
    }

    /**
     * Upload a single file to R2
     * @param {string} filePath 
     * @param {string} key 
     */
    async uploadFile(filePath, key) {
        const fileStream = fs.createReadStream(filePath);
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: config.aws.bucket,
                Key: key,
                Body: fileStream,
                ContentType: this.getContentType(filePath),
            },
        });

        await upload.done();
        return `https://${config.aws.bucket}.r2.cloudflarestorage.com/${key}`; // Or your public domain
    }

    /**
     * Upload directory recursively
     * @param {string} dirPath 
     * @param {string} keyPrefix 
     */
    async uploadDirectory(dirPath, keyPrefix) {
        const files = fs.readdirSync(dirPath);
        const uploads = files.map(async (file) => {
            const fullPath = path.join(dirPath, file);
            const key = `${keyPrefix}/${file}`;

            if (fs.statSync(fullPath).isDirectory()) {
                return this.uploadDirectory(fullPath, key);
            } else {
                return this.uploadFile(fullPath, key);
            }
        });

        await Promise.all(uploads);
        return keyPrefix;
    }

    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.m3u8': return 'application/vnd.apple.mpegurl';
            case '.ts': return 'video/MP2T';
            case '.mp3': return 'audio/mpeg';
            default: return 'application/octet-stream';
        }
    }
}

module.exports = new StorageService();
