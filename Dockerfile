# ---------- Build Stage ----------
  FROM node:20-alpine3.19 AS builder

# Fix DNS resolution issues in Alpine
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf

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

# Install SSL certificates for MongoDB & Redis Cloud TLS
RUN apk add --no-cache ca-certificates openssl

# Copy compiled app and package files from builder
COPY  --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose API port
EXPOSE 8000

# Start the backend server
CMD ["node", "dist/index.js"]