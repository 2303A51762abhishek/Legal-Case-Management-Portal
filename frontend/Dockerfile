# ==============================================================================
# JurisFlow Frontend Production Multi-Stage Dockerfile
# Student: MAMILLAPALLY ABHISHEK (Roll: 2303A51762)
# Course: DevOps & Full Stack (B.Tech IV-I, 2026–2027)
# ==============================================================================

# Stage 1: Build the React/Vite SPA
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Set API URL for reverse-proxy routing through container network
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve production assets via Nginx
FROM nginx:alpine

# Copy built static assets from build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for SPA routing & reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port 80
EXPOSE 80

# Health check using Nginx healthz endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
