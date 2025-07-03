# ---------- Build Stage ----------
  FROM node:20-alpine3.19 AS builder

# Set working directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Typescript
RUN npm run build


# ---------- Production Stage ----------
  FROM node:20-alpine3.19

# Set working directory
WORKDIR /app

# Install SSL certificates for MongoDB TLS (as when running builded image, its failing to connect to MongoDB atlas)
RUN apk add --no-cache ca-certificates

# Copy compiled app and package files from builder
COPY  --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose API port
EXPOSE 8000

# Start the backend server
CMD ["node", "dist/index.js"]