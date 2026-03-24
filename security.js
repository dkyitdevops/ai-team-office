/**
 * AI Team Office - Security Module
 * XSS Protection, Input Validation, Sanitization
 */

const SecurityModule = {
    // ========== XSS PROTECTION ==========
    
    /**
     * Экранирование HTML-спецсимволов
     * Предотвращает XSS-атаки через внедрение HTML/JS
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            return '';
        }
        
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\\/g, "&#92;")
            .replace(/\//g, "&#47;");
    },
    
    /**
     * Экранирование для CSS (защита от CSS injection)
     */
    escapeCss(unsafe) {
        if (typeof unsafe !== 'string') {
            return '';
        }
        
        // Удаляем опасные CSS-символы
        return unsafe
            .replace(/[<>\"']/g, '')
            .replace(/javascript:/gi, '')
            .replace(/expression/gi, '')
            .replace(/@import/gi, '');
    },
    
    /**
     * Экранирование для JavaScript строк
     */
    escapeJs(unsafe) {
        if (typeof unsafe !== 'string') {
            return '';
        }
        
        return unsafe
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    },
    
    // ========== INPUT VALIDATION ==========
    
    /**
     * Валидация названия проекта
     * - Максимум 50 символов
     * - Только разрешённые символы
     * - Без HTML тегов
     */
    validateProjectName(projectName) {
        const maxLength = 50;
        
        // Проверка типа
        if (typeof projectName !== 'string') {
            return {
                valid: false,
                error: 'Название проекта должно быть строкой',
                sanitized: ''
            };
        }
        
        // Проверка длины
        if (projectName.length > maxLength) {
            return {
                valid: false,
                error: `Название проекта слишком длинное (максимум ${maxLength} символов)`,
                sanitized: this.truncate(projectName, maxLength)
            };
        }
        
        // Проверка на пустую строку
        if (projectName.trim().length === 0) {
            return {
                valid: false,
                error: 'Название проекта не может быть пустым',
                sanitized: ''
            };
        }
        
        // Проверка на запрещённые символы (только разрешённые)
        // Разрешаем: буквы, цифры, пробелы, дефис, подчёркивание, точка
        const allowedPattern = /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_\.]+$/;
        
        if (!allowedPattern.test(projectName)) {
            // Санитизируем - оставляем только разрешённые символы
            const sanitized = projectName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-_\.]/g, '');
            
            return {
                valid: false,
                error: 'Название проекта содержит недопустимые символы',
                sanitized: this.truncate(sanitized, maxLength)
            };
        }
        
        return {
            valid: true,
            error: null,
            sanitized: projectName.trim()
        };
    },
    
    /**
     * Валидация названия задачи
     * - Максимум 100 символов
     */
    validateTaskName(taskName) {
        const maxLength = 100;
        
        if (typeof taskName !== 'string') {
            return {
                valid: false,
                sanitized: ''
            };
        }
        
        if (taskName.length > maxLength) {
            return {
                valid: false,
                sanitized: this.truncate(taskName, maxLength)
            };
        }
        
        return {
            valid: true,
            sanitized: taskName.trim()
        };
    },
    
    // ========== SANITIZATION ==========
    
    /**
     * Санитизация для отображения на экране монитора
     * Комбинирует валидацию и экранирование
     */
    sanitizeForDisplay(text, maxLength = 50) {
        if (typeof text !== 'string') {
            return '';
        }
        
        // Обрезаем
        let sanitized = this.truncate(text, maxLength);
        
        // Экранируем HTML
        sanitized = this.escapeHtml(sanitized);
        
        return sanitized;
    },
    
    /**
     * Обрезка строки до указанной длины
     */
    truncate(str, maxLength) {
        if (typeof str !== 'string') {
            return '';
        }
        
        if (str.length <= maxLength) {
            return str;
        }
        
        return str.substring(0, maxLength - 3) + '...';
    },
    
    // ========== PROJECT DISPLAY SECURITY ==========
    
    /**
     * Безопасное обновление названия проекта на экране
     * Используется при динамическом обновлении через WebSocket/API
     */
    safeUpdateProjectDisplay(monitorElement, projectName, taskName) {
        if (!monitorElement) {
            console.warn('[Security] Monitor element not found');
            return false;
        }
        
        // Валидация
        const projectValidation = this.validateProjectName(projectName);
        const taskValidation = this.validateTaskName(taskName);
        
        // Получаем санитизированные значения
        const safeProject = projectValidation.sanitized;
        const safeTask = taskValidation.sanitized;
        
        // Обновляем DOM через textContent (безопасно от XSS)
        const projectEl = monitorElement.querySelector('.screen-project');
        const taskEl = monitorElement.querySelector('.screen-task');
        
        if (projectEl) {
            projectEl.textContent = safeProject;
        }
        
        if (taskEl) {
            taskEl.textContent = safeTask;
        }
        
        return {
            success: true,
            projectValid: projectValidation.valid,
            taskValid: taskValidation.valid,
            warnings: [
                ...(!projectValidation.valid ? [`Project: ${projectValidation.error}`] : []),
                ...(!taskValidation.valid ? [`Task: ${taskValidation.error}`] : [])
            ]
        };
    },
    
    /**
     * Проверка безопасности данных перед отправкой на сервер
     */
    sanitizeProjectData(data) {
        const result = {
            valid: true,
            errors: [],
            sanitized: {}
        };
        
        // Проверка project name
        if (data.project) {
            const validation = this.validateProjectName(data.project);
            result.sanitized.project = validation.sanitized;
            if (!validation.valid) {
                result.valid = false;
                result.errors.push(validation.error);
            }
        }
        
        // Проверка task name
        if (data.task) {
            const validation = this.validateTaskName(data.task);
            result.sanitized.task = validation.sanitized;
            if (!validation.valid) {
                result.valid = false;
                result.errors.push(validation.error);
            }
        }
        
        return result;
    },
    
    // ========== SERVER-SIDE VALIDATION (Node.js) ==========
    
    /**
     * Валидация для серверной части (Node.js)
     * Экспортируется отдельно для использования в server.js
     */
    serverValidation: {
        validateProjectName(projectName) {
            const maxLength = 50;
            
            if (typeof projectName !== 'string') {
                return { valid: false, sanitized: '' };
            }
            
            // Обрезаем
            let sanitized = projectName.substring(0, maxLength).trim();
            
            // Удаляем HTML-теги
            sanitized = sanitized.replace(/<[^>]*>/g, '');
            
            // Разрешаем только безопасные символы
            sanitized = sanitized.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-_\.]/g, '');
            
            return {
                valid: sanitized.length > 0 && sanitized.length <= maxLength,
                sanitized: sanitized
            };
        },
        
        escapeHtml(unsafe) {
            if (typeof unsafe !== 'string') return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    }
};

// Экспорт для разных окружений
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityModule;
} else if (typeof window !== 'undefined') {
    window.SecurityModule = SecurityModule;
}