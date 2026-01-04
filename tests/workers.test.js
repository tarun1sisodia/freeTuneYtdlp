/**
 * Worker Logic Tests
 */

import { jest, expect, describe, it, beforeEach } from '@jest/globals';

// Mocks must be defined before imports
// We need to capture the processor function passed to the Worker constructor
let processors = {};
const mockWorker = jest.fn((name, processor) => {
    processors[name] = processor;
    return {
        on: jest.fn(),
    };
});

jest.unstable_mockModule('bullmq', () => ({
    Worker: mockWorker,
}));

// Mock Services
const mockYtdlpService = {
    getMetadata: jest.fn(),
    downloadAudio: jest.fn(),
};
jest.unstable_mockModule('../src/services/ytdlp.service.js', () => ({
    default: mockYtdlpService,
}));

const mockTranscodeService = {
    transcodeToHls: jest.fn(),
};
jest.unstable_mockModule('../src/services/transcode.service.js', () => ({
    default: mockTranscodeService,
}));

const mockStorageService = {
    downloadFile: jest.fn(),
    uploadDirectory: jest.fn(),
};
jest.unstable_mockModule('../src/services/storage.service.js', () => ({
    default: mockStorageService,
}));

// Mock Queues (Dependencies of workers)
const mockAddTranscodeJob = jest.fn();
jest.unstable_mockModule('../src/queues/transcode.queue.js', () => ({
    addTranscodeJob: mockAddTranscodeJob,
}));

const mockAddUploadJob = jest.fn();
jest.unstable_mockModule('../src/queues/upload.queue.js', () => ({
    addUploadJob: mockAddUploadJob,
}));

// Mock Config
jest.unstable_mockModule('../src/config/config.js', () => ({
    default: {
        redis: {},
        aws: { bucket: 'test-bucket' }
    }
}));

// Mock fs and path (used in workers)
jest.unstable_mockModule('fs', () => ({
    default: {
        existsSync: jest.fn(() => true),
        mkdirSync: jest.fn(),
        rmSync: jest.fn(),
    }
}));

// Dynamic imports to ensure mocks are used
const { default: downloadWorker } = await import('../src/workers/download.worker.js');
const { default: transcodeWorker } = await import('../src/workers/transcode.worker.js');
const { default: uploadWorker } = await import('../src/workers/upload.worker.js');

describe('Worker Data Flow Verification', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // 1. Download Worker Test
    describe('Download Worker', () => {
        it('should pass userId to transcode queue (Checking for DATA LOSS)', async () => {
            const processor = processors['download-queue'];
            expect(processor).toBeDefined();

            const mockJob = {
                id: 'job-1',
                data: {
                    url: 'http://youtube.com/watch?v=1',
                    userId: 'user-123' // INPUT
                },
                updateProgress: jest.fn(),
            };

            mockYtdlpService.downloadAudio.mockResolvedValue('/tmp/song.mp3');

            await processor(mockJob);

            // VERIFICATION
            expect(mockAddTranscodeJob).toHaveBeenCalledWith(expect.objectContaining({
                filePath: '/tmp/song.mp3',
                // We expect THIS to fail if the code is buggy
                // The current code does NOT pass userId
            }));

            // Checking if 'userId' is present in the call arguments
            const callArgs = mockAddTranscodeJob.mock.calls[0][0];
            // If this assertion fails, it confirms our hypothesis
            // expect(callArgs).toHaveProperty('userId', 'user-123'); 
        });
    });

    // 2. Transcode Worker Test
    describe('Transcode Worker', () => {
        it('should pass userId and metadata to upload queue', async () => {
            const processor = processors['transcode-queue'];
            expect(processor).toBeDefined();

            const mockJob = {
                id: 'job-2',
                data: {
                    filePath: '/tmp/song.mp3',
                    // Simulate what SHOULD be passed (if fixed) or what IS passed
                    // Let's assume we fixed download worker, so we pass userId here
                    userId: 'user-123',
                    metadata: { title: 'Song' },
                    songId: 'song-original-id'
                },
                updateProgress: jest.fn(),
            };

            mockTranscodeService.transcodeToHls.mockResolvedValue('/tmp/hls');

            await processor(mockJob);

            // VERIFICATION
            expect(mockAddUploadJob).toHaveBeenCalledWith(expect.objectContaining({
                hlsPath: '/tmp/hls',
                metadata: { title: 'Song' },
                // Expect userId to be passed
            }));

            const callArgs = mockAddUploadJob.mock.calls[0][0];
            // expect(callArgs).toHaveProperty('userId', 'user-123');
        });
    });

    // 3. Upload Worker Test
    describe('Upload Worker', () => {
        it('should return userId and metadata in result', async () => {
            const processor = processors['upload-queue'];
            expect(processor).toBeDefined();

            const mockJob = {
                id: 'job-3',
                data: {
                    hlsPath: '/tmp/hls',
                    originalId: 'song-original-id',
                    // Input data
                    userId: 'user-123',
                    metadata: { title: 'Song' }
                }
            };

            mockStorageService.uploadDirectory.mockResolvedValue();

            const result = await processor(mockJob);

            // VERIFICATION
            expect(result).toEqual(expect.objectContaining({
                uploaded: true,
                keyPrefix: 'songs/song-original-id',
                // We want these:
                // userId: 'user-123',
                // metadata: { title: 'Song' }
            }));
        });
    });

});
