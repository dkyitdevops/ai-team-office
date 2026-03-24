# AI Team Office - Deployment Guide

## Быстрый старт

### 1. Локальный запуск

```bash
# Клонировать репозиторий
git clone <repo-url>
cd ai-team-office

# Создать .env
cp .env.example .env

# Запуск
./scripts/deploy.sh
```

### 2. Настройка GitHub Actions

В настройках репозитория (Settings → Secrets and variables → Actions) добавь:

| Secret | Описание |
|--------|----------|
| `SSH_PRIVATE_KEY` | Приватный SSH ключ для деплоя |
| `SSH_KNOWN_HOSTS` | `ssh-keyscan -H your-server.com` |
| `SERVER_HOST` | IP или домен сервера |
| `SERVER_USER` | Пользователь для SSH |
| `DEPLOY_DIR` | `/opt/ai-team-office` |

### 3. Мониторинг

```bash
# Запуск health monitor
./scripts/health-monitor.sh monitor

# Одноразовая проверка (для cron)
./scripts/health-monitor.sh check
```

### 4. Cron для мониторинга

```bash
# Открыть crontab
crontab -e

# Добавить проверку каждые 5 минут
*/5 * * * * /opt/ai-team-office/scripts/health-monitor.sh check >> /var/log/ai-team-office/cron.log 2>&1
```

## Структура

```
ai-team-office/
├── .github/workflows/deploy.yml  # GitHub Actions
├── scripts/
│   ├── deploy.sh                 # Скрипт деплоя
│   └── health-monitor.sh         # Мониторинг
├── docker-compose.yml            # Базовая конфигурация
├── docker-compose.prod.yml       # Production overrides
├── Dockerfile                    # Сборка образа
└── .env.example                  # Пример переменных
```

## Команды

```bash
# Локальный запуск
docker compose up -d

# Логи
docker compose logs -f

# Перезапуск
docker compose restart

# Обновление
./scripts/deploy.sh
```
