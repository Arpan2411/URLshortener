# Dockerfile
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install system dependencies for build tooling
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies so dev scripts such as nodemon work in compose
RUN npm ci

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"]