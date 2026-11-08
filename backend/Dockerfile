# ==============================================================================
# JurisFlow Backend Production Dockerfile
# Student: MAMILLAPALLY ABHISHEK (Roll: 2303A51762)
# Course: DevOps & Full Stack (B.Tech IV-I, 2026–2027)
# ==============================================================================

# Supported Node.js LTS Alpine base image
FROM node:20-alpine

# Set application working directory
WORKDIR /usr/src/app

# Install wget for healthcheck inspection
RUN apk add --no-cache wget

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install production dependencies only (omit devDependencies)
RUN npm ci --omit=dev

# Copy backend source code
COPY src ./src

# Create uploads storage directory and configure non-root ownership
RUN mkdir -p ./src/uploads && chown -R node:node /usr/src/app

# Switch to non-root user for security hardening
USER node

# Expose backend REST API port
EXPOSE 5000

# Set default production environment flags
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Container health check using existing /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

# Start production server
CMD ["node", "src/server.js"]
