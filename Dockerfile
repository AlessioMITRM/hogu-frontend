# Stage 1: Build Node.js (React/Vite)
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
# Intercetta la variabile dal docker-compose in fase di build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Setup Nginx Reverse Proxy / Web Server
FROM nginx:alpine

# Installa il tool per creare le password criptate
RUN apk add --no-cache apache2-utils

# Genera il file delle password (user: clienteHogu / pass: demo2026)
RUN htpasswd -bc /etc/nginx/.htpasswd clienteHogu demo2026

# Copia la build di react
COPY --from=build /app/dist /usr/share/nginx/html

# Configurazione Nginx con Basic Authentication + React Router fallback
RUN echo 'server { \
    listen 80; \
    auth_basic "Collaudo HOGU - Accesso Riservato"; \
    auth_basic_user_file /etc/nginx/.htpasswd; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
