import YTDlpWrapPkg from 'yt-dlp-wrap';
const YTDlpWrap = YTDlpWrapPkg.default;
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define where the binary should be stored
// Going up from src/scripts to src/bin
const BINARY_DIR = path.join(__dirname, '..', 'bin');
const BINARY_FILENAME = os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
export const BINARY_PATH = path.join(BINARY_DIR, BINARY_FILENAME);

export async function updateYtDlp() {
    try {
        console.log('Checking for yt-dlp updates...');

        // Ensure bin directory exists
        if (!fs.existsSync(BINARY_DIR)) {
            fs.mkdirSync(BINARY_DIR, { recursive: true });
        }

        // Get latest version info
        const releases = await YTDlpWrap.getGithubReleases(1, 1);
        const latestVersion = releases[0].tag_name;

        console.log(`Latest version available: ${latestVersion}`);

        // Check if we already have this version? 
        let currentVersion = null;
        if (fs.existsSync(BINARY_PATH)) {
            try {
                const wrapper = new YTDlpWrap(BINARY_PATH);
                currentVersion = await wrapper.getVersion();
                console.log(`Current local version: ${currentVersion}`);
            } catch (e) {
                console.log('Could not determine local version, redownloading...');
            }
        }

        if (currentVersion !== latestVersion) {
            console.log(`Downloading yt-dlp version ${latestVersion} to ${BINARY_PATH}...`);
            await YTDlpWrap.downloadFromGithub(BINARY_PATH, latestVersion, os.platform());
            console.log('Download completed successfully.');

            // Make executable on unix
            if (os.platform() !== 'win32') {
                fs.chmodSync(BINARY_PATH, '755');
            }
        } else {
            console.log('yt-dlp is already up to date.');
        }

        return BINARY_PATH;

    } catch (error) {
        console.error('Failed to update yt-dlp:', error);
        throw error;
    }
}

// Only run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    updateYtDlp().catch(err => process.exit(1));
}
