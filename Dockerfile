FROM node:20

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY backend ./backend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend ./frontend
RUN cd frontend && npm run build

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

RUN rm -rf /usr/share/nginx/html/* && cp -r frontend/dist/. /usr/share/nginx/html/
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4000
CMD ["sh", "-c", "node /app/backend/src/server.js & nginx -g 'daemon off;'"]
