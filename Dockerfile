# Stage 1: Build the application
FROM node:22-slim AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy codebase
COPY . .

# Build Vite frontend and bundle server.ts with esbuild
RUN npm run build

# Stage 2: Production runner
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled resources from builder stage
COPY --from=builder /app/dist ./dist

# Expose container entry port
EXPOSE 3000

# Start compiled Express full-stack server
CMD ["npm", "run", "start"]
