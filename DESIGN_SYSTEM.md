# AI Team Office - Design System

## Обзор
Современная дизайн-система для визуализации команды AI-агентов с glassmorphism/neumorphism стилем.

## Цветовая палитра

### Primary (Фиолетовый)
- `--color-primary-500`: #8b5cf6 - Основной акцент
- `--color-primary-600`: #7c3aed - Кнопки, активные состояния
- `--color-primary-400`: #a78bfa - Hover состояния

### Secondary (Розовый)
- `--color-secondary-500`: #ec4899 - Градиенты, акценты
- `--color-secondary-400`: #f472b6 - Мягкие акценты

### Accent (Голубой)
- `--color-accent-500`: #06b6d4 - Информационные элементы
- `--color-accent-400`: #22d3ee - Подсветка

### Status Colors
- `--color-success`: #22c55e - Работает
- `--color-warning`: #f59e0b - Отдыхает
- `--color-error`: #ef4444 - Ошибка
- `--color-offline`: #6b7280 - Офлайн

## Типографика

### Шрифты
- **Primary**: Inter (sans-serif)
- **Mono**: JetBrains Mono (code, numbers)

### Размеры
- `--text-xs`: 0.75rem (12px)
- `--text-sm`: 0.875rem (14px)
- `--text-base`: 1rem (16px)
- `--text-lg`: 1.125rem (18px)
- `--text-xl`: 1.25rem (20px)
- `--text-2xl`: 1.5rem (24px)
- `--text-3xl`: 1.875rem (30px)
- `--text-4xl`: 2.25rem (36px)

## Компоненты

### Glass Card
```css
.glass-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
```

### Buttons
- **Primary**: Градиент фиолетовый, скругленный
- **Secondary**: Полупрозрачный фон, бордер
- **Ghost**: Только текст

### Badges
- **Success**: Зеленый фон, зеленый текст
- **Warning**: Оранжевый фон, оранжевый текст
- **Error**: Красный фон, красный текст

## Анимации

### Timing
- `--duration-fast`: 150ms
- `--duration-normal`: 250ms
- `--duration-slow`: 350ms

### Easing
- `--ease-out`: cubic-bezier(0.16, 1, 0.3, 1)
- `--ease-bounce`: cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Key Animations
- `float` - Плавное парение
- `pulse-glow` - Пульсирующее свечение
- `slide-up` - Появление снизу
- `scale-in` - Масштабирование

## Темы

### Темная (по умолчанию)
- Фон: #0f0f1a
- Карточки: rgba(26, 26, 46, 0.6)
- Текст: #ffffff

### Светлая
- Фон: #fafafa
- Карточки: rgba(255, 255, 255, 0.8)
- Текст: #18181b

## Адаптивность

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Карточки агентов в 2 колонки
- Комната отдыха под рабочей зоной
- Компактный хедер

## Доступность (a11y)

- `prefers-reduced-motion` поддержка
- Focus-visible стили
- ARIA-атрибуты для интерактивных элементов
- Цветовой контраст WCAG 2.1 AA

## Использование компонентов

```javascript
// Web Components
import './components/ai-components.js';

// В HTML
<ai-button variant="primary" size="lg">Click me</ai-button>
<ai-badge variant="success">Working</ai-badge>
<ai-avatar emoji="🎨" status="working" size="lg"></ai-avatar>
```
