import ytdlpService from '../services/ytdlp.service.js';

async function test() {
    console.log('Starting verification...');

    try {
        // Test 1: Search Query
        console.log('\nTesting Search Query: "faded alan walker"');
        const metadataSearch = await ytdlpService.getMetadata('faded alan walker');
        console.log('Search Metadata Title:', metadataSearch.title);
        console.log('Search Metadata URL:', metadataSearch.webpage_url);

        // Test 2: Direct URL via getMetadata
        console.log('\nTesting Direct URL in Metadata: "https://www.youtube.com/watch?v=60ItHLz5WEA"');
        const metadataUrl = await ytdlpService.getMetadata('https://www.youtube.com/watch?v=60ItHLz5WEA');
        console.log('Direct URL Metadata Title:', metadataUrl.title);

        // Test 3: Download (Optional, maybe skip actual download to save time/bandwidth or use very short video)
        // console.log('\nTesting Download...');
        // const filePath = await ytdlpService.downloadAudio(metadataUrl.webpage_url, 'test-download');
        // console.log('Downloaded to:', filePath);

        console.log('\nVerification Successful!');
    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    }
}

test();
