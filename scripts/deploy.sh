#!/bin/bash
# AI Team Office - Deploy Script
# Использование: ./deploy.sh [environment]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Параметры
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"
DEPLOY_DIR="/opt/ai-team-office"
BACKUP_DIR="/opt/backups/ai-team-office"

# Функции
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker не установлен"; exit 1; }
    command -v docker compose >/dev/null 2>&1 || { log_error "Docker Compose не установлен"; exit 1; }
    
    log_success "Все зависимости установлены"
}

# Создание директорий
setup_directories() {
    log_info "Создание директорий..."
    
    sudo mkdir -p "$DEPLOY_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo mkdir -p "$DEPLOY_DIR/logs"
    
    log_success "Директории созданы"
}

# Резервное копирование
create_backup() {
    log_info "Создание резервной копии..."
    
    if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$DEPLOY_DIR" . 2>/dev/null || true
        log_success "Резервная копия создана: $BACKUP_NAME"
    else
        log_warn "Нечего бэкапить — директория пуста"
    fi
}

# Очистка старых бэкапов
cleanup_backups() {
    log_info "Очистка старых бэкапов..."
    
    # Оставляем только последние 10 бэкапов
    cd "$BACKUP_DIR" && ls -t | tail -n +11 | xargs -r sudo rm -f
    
    log_success "Старые бэкапы удалены"
}

# Копирование файлов
copy_files() {
    log_info "Копирование файлов..."
    
    sudo cp "$COMPOSE_FILE" "$DEPLOY_DIR/"
    
    if [ -f ".env" ]; then
        sudo cp ".env" "$DEPLOY_DIR/"
        sudo chmod 600 "$DEPLOY_DIR/.env"
    else
        log_warn "Файл .env не найден — используются значения по умолчанию"
    fi
    
    log_success "Файлы скопированы"
}

# Деплой
deploy() {
    log_info "Запуск деплоя..."
    
    cd "$DEPLOY_DIR"
    
    # Остановка старых контейнеров
    log_info "Остановка старых контейнеров..."
    sudo docker compose down --remove-orphans 2>/dev/null || true
    
    # Pull образов
    log_info "Загрузка образов..."
    sudo docker compose pull
    
    # Запуск
    log_info "Запуск контейнеров..."
    sudo docker compose up -d
    
    # Очистка
    log_info "Очистка неиспользуемых образов..."
    sudo docker image prune -af --filter "until=168h" 2>/dev/null || true
    
    log_success "Деплой завершён"
}

# Проверка здоровья
healthcheck() {
    log_info "Проверка здоровья приложения..."
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -sf http://localhost:3001/api/agents >/dev/null 2>&1; then
            log_success "Приложение работает!"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_info "Попытка $RETRY_COUNT/$MAX_RETRIES..."
        sleep 2
    done
    
    log_error "Приложение не отвечает после $MAX_RETRIES попыток"
    return 1
}

# Показать статус
show_status() {
    log_info "Статус контейнеров:"
    sudo docker compose -f "$DEPLOY_DIR/$COMPOSE_FILE" ps
    
    echo ""
    log_info "Последние логи:"
    sudo docker compose -f "$DEPLOY_DIR/$COMPOSE_FILE" logs --tail=20
}

# Главная функция
main() {
    echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     AI Team Office - Deploy          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
    echo ""
    
    log_info "Окружение: $ENVIRONMENT"
    log_info "Директория деплоя: $DEPLOY_DIR"
    echo ""
    
    check_dependencies
    setup_directories
    create_backup
    cleanup_backups
    copy_files
    deploy
    
    if healthcheck; then
        show_status
        echo ""
        log_success "🚀 Деплой успешно завершён!"
        echo ""
        echo -e "${BLUE}Приложение доступно по адресу:${NC}"
        echo -e "  • Web UI: http://$(hostname -I | awk '{print $1}'):3001"
        echo -e "  • API: http://$(hostname -I | awk '{print $1}'):3001/api/agents"
    else
        echo ""
        log_error "❌ Деплой завершён с ошибками"
        show_status
        exit 1
    fi
}

# Обработка ошибок
trap 'log_error "Скрипт прерван"; exit 1' INT TERM

# Запуск
main "$@"
