# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY public ./public
COPY src ./src
COPY tsconfig.json ./

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "start"]
