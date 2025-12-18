# Use Node.js as the base image
FROM node:25.2.1-slim

# Install system dependencies
# ffmpeg is required for audio processing
# python3 is required for yt-dlp to run
# curl is required for healthchecks
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create directory for yt-dlp binary and make sure scripts have permissions
RUN mkdir -p src/bin && chmod +x src/scripts/*.js

# Download the yt-dlp binary during build so it's ready
# This uses our update script
RUN npm run update-ytdlp

# Expose the port the app runs on
EXPOSE 3002

# Define environment variables (defaults, can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3002

# Security: Run as non-root user
# The node image already comes with a 'node' user
RUN chown -R node:node /app
USER node

# Healthcheck to verify the container is running and responsive
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start the application
CMD ["npm", "start"]
