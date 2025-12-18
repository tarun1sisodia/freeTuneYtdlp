# Deployment Guide for freeTuneYtdlp Microservice

This guide covers how to deploy the `freeTuneYtdlp` microservice and explains its self-updating architecture.

## 🔄 How Auto-Update Works

The `yt-dlp` library (which communicates with YouTube) requires frequent updates to bypass new changes on the YouTube platform. We have built an **Auto-Update Mechanism** directly into this service to handle this without requiring you to constantly redeploy.

### 1. Build-Time Update
When you deploy (or build the Docker image), the `Dockerfile` runs:
```bash
RUN npm run update-ytdlp
```
This fetches the absolute latest version of `yt-dlp` from GitHub *at the moment of deployment*.

### 2. Runtime Self-Healing
Inside the running application (`src/index.js`), we have a scheduler that:
- Check for updates **immediately on startup**.
- Checks for updates **every 24 hours**.

If a new version is released on GitHub, the service detects it, downloads it, and hot-swaps the binary. The next song download request will automatically use the new version. **You do not need to restart the server.**

---

## 🚀 Deployment Options

### Prerequisites
- GitHub Repository with this code.
- `Dockerfile` (included in repo).
- `.env` variables ready.

### Option A: Render (Easiest)
1. **New Web Service** -> Connect detailed GitHub repo.
2. Select **Docker** Runtime.
3. Add **Environment Variables** (from your `.env`):
   - `REDIS_URL`, `R2_...` keys, etc.
   - `PORT`: `3002`
4. **Deploy**.
   - Render detects the Dockerfile.
   - Builds the image (downloading latest yt-dlp).
   - Starts the server (initiating daily upgrade checks).

### Option B: Railway
1. **New Project** -> Deploy from GitHub.
2. Add Variables.
3. Railway handles the Buildpack/Dockerfile automatically.

### Option C: Docker (Manual/VPS)
Build the image:
```bash
docker build -t freetune-ytdlp .
```
Run the container:
```bash
docker run -d -p 3002:3002 --env-file .env freetune-ytdlp
```

## 🛠 Troubleshooting

- **"yt-dlp binary not found"**: The service will attempt to download it automatically on the first request.
- **Permission Denied**: The Dockerfile sets `chmod +x` on the binary folder to ensure the downloaded file is executable.
