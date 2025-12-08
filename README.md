# freeTune - yt-dlp Microservice

This microservice handles the downloading and processing of songs using `yt-dlp`.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    PORT=3001
    REDIS_HOST=localhost
    REDIS_PORT=6379
    YTDLP_MAX_CONCURRENT=5
    ```

3.  **Run Service**:
    ```bash
    npm start
    ```

## Architecture
- **Queue**: BullMQ with Redis
- **Downloader**: `yt-dlp` (via `yt-dlp-wrap`)
- **API**: Express.js

## Testing
Run the manual test script:
```bash
node src/services/ytdlp.service.spec.js
```
