FROM node:20-alpine

# Install system deps for sharp (image processing)
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY src/ ./src/
COPY .env.example ./.env.example

# Create logs and uploads directories
RUN mkdir -p logs uploads

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/system/health || exit 1

CMD ["node", "src/index.js"]
