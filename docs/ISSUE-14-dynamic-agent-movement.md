# GitHub Issue #14: Динамическое перемещение агентов

## Описание

Реализована функциональность динамического перемещения агентов между рабочей зоной и комнатой отдыха на основе их assigned issues в GitHub.

## Как это работает

### Backend (`server/agents-api.js`)

1. **Получение Issues из GitHub**
   - Запрашивает открытые и закрытые issues из настроенных репозиториев
   - Фильтрует pull requests (оставляет только issues)

2. **Определение статуса агента**
   - `working` — есть открытые issues, назначенные агенту
   - `resting` — нет открытых issues

3. **Определение локации**
   - `work-zone` — рабочая зона (зелёное кольцо 🟢)
   - `rest-room` — комната отдыха (жёлтое кольцо 🟡)

### Frontend (`index.html`)

1. **Обновление каждые 30 секунд**
   ```javascript
   setInterval(updateAgentsStatus, 30000);
   ```

2. **Анимации перемещения**
   - `moveToRestRoom(agent)` — плавный переход в комнату отдыха
   - `moveToWorkZone(agent)` — плавный возврат на рабочее место

3. **Визуализация статуса**
   - 🟢 Зелёное кольцо — работает (есть assigned issues)
   - 🟡 Жёлтое кольцо — отдыхает (нет assigned issues)

## API Endpoints

### GET `/api/agents/status`

Возвращает статусы всех агентов:

```json
{
  "agents": [
    {
      "id": "1",
      "name": "Алексей",
      "role": "UI Designer",
      "emoji": "👨‍🎨",
      "status": "working",
      "location": "work-zone",
      "statusRing": "green",
      "statusRingColor": "#22c55e",
      "project": "Meetify",
      "task": "Виртуальный фон",
      "progress": 75,
      "openIssuesCount": 2,
      "issues": [...]
    }
  ],
  "zones": {
    "work-zone": { "label": "Рабочая зона", "color": "green" },
    "rest-room": { "label": "Комната отдыха", "color": "yellow" }
  },
  "meta": {
    "timestamp": "2026-03-24T18:00:00.000Z",
    "responseTimeMs": 150,
    "issuesFetched": 42,
    "source": "github"
  }
}
```

### GET `/api/agents/status/:name`

Возвращает статус конкретного агента.

### GET `/api/agents/zones`

Возвращает зоны офиса.

### GET `/api/agents/health`

Health check endpoint.

## Настройка

1. Создать `.env` файл:
   ```bash
   cp .env.example .env
   ```

2. Добавить GitHub Token:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   ```

3. Настроить репозитории (в `agents-api.js`):
   ```javascript
   const REPOS = [
     'dkyitdevops/meetify',
     'dkyitdevops/ai-team-office'
   ];
   ```

4. Настроить агентов (в `agents-api.js`):
   ```javascript
   const AGENTS_CONFIG = {
     'Алексей': { 
       githubUsername: 'alexey-username',
       role: 'UI Designer', 
       emoji: '👨‍🎨',
       deskId: '1'
     },
     // ...
   };
   ```

## Анимации

### CSS-анимации (добавлены в `index.html`)

- `@keyframes agentExit` — анимация ухода с рабочего места
- `@keyframes agentEnter` — анимация появления на рабочем месте
- `@keyframes restAgentEnter` — анимация появления в комнате отдыха
- `@keyframes restAgentExit` — анимация исчезновения из комнаты отдыха
- `@keyframes deskHighlight` — подсветка рабочего места

### JavaScript-функции

- `moveToRestRoom(agent)` — перемещает агента в комнату отдыха
- `moveToWorkZone(agent)` — возвращает агента на рабочее место
- `animateDeskExit(desk, agent)` — анимирует уход с рабочего места
- `animateDeskEntry(desk, agent)` — анимирует появление на рабочем месте

## Fallback-режим

Если GitHub API недоступен или токен не настроен, используются fallback-данные:
- Все агенты имеют статус `resting`
- Локация — `rest-room`
- Кольцо статуса — жёлтое 🟡

## Тестирование

```bash
cd server
npm install
npm start

# В другом терминале:
curl http://localhost:3001/api/agents/status
```
