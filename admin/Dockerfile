# Dockerfile – admin (React + Vite)
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente
COPY . .

# Puerto donde Vite sirve la app (5174)
EXPOSE 5174

# El comando real está en docker-compose.yml: npm run dev
