# --- Base image ---
FROM node:22-alpine AS base
WORKDIR /app

# set environment default (bisa override lewat docker-compose)
ENV NODE_ENV=staging \
    PORT=3014

# --- Dependencies stage ---
FROM base AS dependencies
COPY package*.json ./
RUN npm install

# --- Builder stage ---
FROM dependencies AS builder
COPY . .
RUN npm run build

# --- Final stage ---
FROM base AS development

# Copy node_modules dari dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy prisma schema dan dist hasil build
COPY --from=builder /app/package*.json ./ 
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Generate Prisma Client untuk semua schema
RUN npx prisma generate --schema=./prisma/main/schema.prisma 

# Debug: cek isi dist
RUN ls -la ./dist

EXPOSE 3014
CMD ["node", "dist/src/main.js"]
  