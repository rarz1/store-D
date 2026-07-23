# Dockerfile – backend (NestJS)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the NestJS app (optional, for production you could use a multistage build)
RUN npm run build

EXPOSE 3000

# The command is defined in docker-compose.yml (npm run start:dev)
