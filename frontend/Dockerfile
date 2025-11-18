# Dockerfile for React Frontend
# Multi-stage build for optimized production image

# ============================================================================
# Stage 1: Build
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:18-alpine

WORKDIR /app

# Install serve to run production build
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Serve production build
CMD ["serve", "-s", "build", "-l", "3000"]
