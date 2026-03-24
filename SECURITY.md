# Security Implementation - GitHub Issue #7

## 🛡️ Реализованная защита для отображения названия проекта

### 1. XSS Protection

#### Client-side (`security.js`)
- **escapeHtml()** - экранирование HTML-спецсимволов:
  - `<` → `&lt;`
  - `>` → `&gt;`
  - `"` → `&quot;`
  - `'` → `&#039;`
  - `&` → `&amp;`

- **Использование textContent** - вместо innerHTML для безопасного обновления DOM

#### Server-side (`server/server.js`)
- Санитизация всех входящих данных через escapeHtml()
- Валидация перед отправкой через WebSocket

### 2. Input Validation

#### Название проекта (`validateProjectName`)
- **Максимальная длина:** 50 символов
- **Разрешённые символы:**
  - Буквы (a-z, A-Z, а-я, А-Я, ё, Ё)
  - Цифры (0-9)
  - Пробелы
  - Дефис (-)
  - Подчёркивание (_)
  - Точка (.)
- **Запрещено:** HTML-теги, JavaScript-протоколы, спецсимволы

#### Название задачи (`validateTaskName`)
- **Максимальная длина:** 100 символов
- **Защита:** Удаление HTML-тегов

### 3. Файлы

| Файл | Назначение |
|------|------------|
| `security.js` | Клиентский security-модуль |
| `security-tests.js` | Юнит-тесты для валидации |
| `server/server.js` | Серверная валидация |

### 4. API

#### Client-side: `SecurityModule`

```javascript
// Валидация названия проекта
const result = SecurityModule.validateProjectName('Meetify');
// result: { valid: true, sanitized: 'Meetify', error: null }

// Санитизация для отображения
const safe = SecurityModule.sanitizeForDisplay('<script>alert(1)</script>', 50);
// safe: '&lt;script&gt;alert(1)&lt;/script&gt;'

// Безопасное обновление экрана
SecurityModule.safeUpdateProjectDisplay(monitorElement, 'Project', 'Task');
```

#### Server-side: WebSocket Events

```javascript
// Отправка обновления проекта (client → server)
socket.emit('project-update', {
  agentId: '1',
  project: 'Meetify',
  task: 'Virtual Background'
});

// Получение обновления (server → client)
socket.on('project-updated', (data) => {
  // data.project и data.task уже санитизированы
  updateScreen(data.project, data.task);
});
```

### 5. Тестирование

Запуск тестов в браузере:
```javascript
// В консоли разработчика
runSecurityTests();
```

Или добавьте `?test` к URL:
```
http://localhost:3000?test
```

### 6. Примеры атак и защита

| Атака | Вход | Выход |
|-------|------|-------|
| XSS Script | `<script>alert(1)</script>` | `scriptalert1script` |
| XSS Image | `<img src=x onerror=alert(1)>` | `img srcx onerroralert1` |
| JavaScript protocol | `javascript:alert(1)` | `javascriptalert1` |
| Длинная строка | `A`.repeat(60) | `A`.repeat(50) |
| HTML entities | `Project<div>` | `Projectdiv` |

### 7. Чеклист безопасности

- [x] XSS-защита через экранирование
- [x] Валидация длины (max 50 для проекта)
- [x] Валидация длины (max 100 для задачи)
- [x] Фильтрация спецсимволов
- [x] Удаление HTML-тегов
- [x] Использование textContent вместо innerHTML
- [x] Серверная валидация
- [x] Юнит-тесты

---

**GitHub Issue:** #7  
**Security Engineer:** 🔒 Security Agent