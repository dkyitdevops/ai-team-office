#!/bin/bash
# AI Team Office - Health Monitor
# Проверка доступности и отправка алертов

set -e

# Конфигурация
APP_URL="${APP_URL:-http://localhost:3001}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-/api/agents}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"
LOG_FILE="${LOG_FILE:-/var/log/ai-team-office/healthcheck.log}"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Логирование
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE" 2>/dev/null || echo "[$timestamp] [$level] $message"
}

# Проверка здоровья
check_health() {
    local response
    local http_code
    
    response=$(curl -sf -w "\n%{http_code}" "${APP_URL}${HEALTH_ENDPOINT}" 2>/dev/null) || {
        echo "DOWN"
        return 1
    }
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo "UP"
        return 0
    else
        echo "DOWN"
        return 1
    fi
}

# Получение метрик
get_metrics() {
    local uptime=$(docker inspect --format='{{.State.StartedAt}}' ai-team-office 2>/dev/null || echo "unknown")
    local memory=$(docker stats --no-stream --format "table {{.MemUsage}}" ai-team-office 2>/dev/null | tail -n1 || echo "unknown")
    local cpu=$(docker stats --no-stream --format "table {{.CPUPerc}}" ai-team-office 2>/dev/null | tail -n1 || echo "unknown")
    
    echo "Uptime: $uptime | Memory: $memory | CPU: $cpu"
}

# Отправка алерта
send_alert() {
    local status="$1"
    local message="$2"
    
    # Telegram webhook
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -sf -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🚨 AI Team Office Alert: $status - $message\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Локальный лог
    log "ALERT" "$status - $message"
}

# Проверка контейнеров
check_containers() {
    local containers=("ai-team-office")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            log "ERROR" "Контейнер $container не запущен"
            all_running=false
            
            # Попытка перезапуска
            log "INFO" "Попытка перезапуска $container..."
            cd /opt/ai-team-office && docker compose up -d "$container" 2>/dev/null || true
        fi
    done
    
    $all_running
}

# Главный цикл мониторинга
monitor() {
    local consecutive_failures=0
    local max_failures=3
    local was_down=false
    
    log "INFO" "Запуск мониторинга: $APP_URL (интервал: ${CHECK_INTERVAL}s)"
    
    while true; do
        local status
        status=$(check_health)
        
        if [ "$status" = "UP" ]; then
            consecutive_failures=0
            
            if [ "$was_down" = true ]; then
                log "INFO" "✅ Сервис восстановлен!"
                send_alert "RECOVERED" "AI Team Office снова доступен"
                was_down=false
            fi
            
            # Периодический лог каждые 10 проверок
            if [ $(($(date +%s) % 600)) -lt "$CHECK_INTERVAL" ]; then
                log "INFO" "Health: UP | $(get_metrics)"
            fi
            
        else
            consecutive_failures=$((consecutive_failures + 1))
            log "WARN" "Health check failed ($consecutive_failures/$max_failures)"
            
            if [ $consecutive_failures -ge $max_failures ] && [ "$was_down" = false ]; then
                log "ERROR" "❌ Сервис недоступен!"
                send_alert "DOWN" "AI Team Office не отвечает после $max_failures проверок"
                was_down=true
                
                # Попытка авто-восстановления
                log "INFO" "Попытка авто-восстановления..."
                cd /opt/ai-team-office && docker compose restart 2>/dev/null || true
            fi
        fi
        
        # Проверка контейнеров
        check_containers || true
        
        sleep "$CHECK_INTERVAL"
    done
}

# Одноразовая проверка (для cron)
single_check() {
    local status
    status=$(check_health)
    
    if [ "$status" = "UP" ]; then
        echo "✅ AI Team Office is healthy"
        exit 0
    else
        echo "❌ AI Team Office is down"
        send_alert "DOWN" "Health check failed"
        exit 1
    fi
}

# Инициализация
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true

# Режим работы
case "${1:-monitor}" in
    monitor)
        monitor
        ;;
    check)
        single_check
        ;;
    *)
        echo "Usage: $0 {monitor|check}"
        echo "  monitor - запустить постоянный мониторинг (по умолчанию)"
        echo "  check   - одноразовая проверка (для cron)"
        exit 1
        ;;
esac
