const ytdlpService = require('./ytdlp.service');

// Simple script to test yt-dlp wrapper manually
async function test() {
    console.log('Testing yt-dlp service...');

    try {
        const query = 'Tu hai kahan';
        console.log(`Fetching metadata for "${query}"...`);
        const metadata = await ytdlpService.getMetadata(query);
        console.log('Metadata fetched:', metadata.title);

        // Uncomment to test download
        // const filePath = await ytdlpService.downloadAudio(metadata.webpage_url, 'test-download');
        // console.log('Downloaded to:', filePath);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
