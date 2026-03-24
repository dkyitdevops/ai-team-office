# AI Team Office - Production Dockerfile

FROM node:20-alpine

# Установка зависимостей для healthcheck
RUN apk add --no-cache curl

# Рабочая директория
WORKDIR /app

# Копирование package.json и установка зависимостей
COPY server/package.json ./
RUN npm install --production && npm cache clean --force

# Копирование серверного кода
COPY server/ ./

# Копирование фронтенда
COPY index.html ./
COPY app.js ./
COPY animations/ ./animations/
COPY components/ ./components/
COPY styles.css ./

# Создание непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Права на файлы
RUN chown -R nodejs:nodejs /app
USER nodejs

# Порт приложения
EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/agents || exit 1

# Запуск
CMD ["node", "server.js"]
