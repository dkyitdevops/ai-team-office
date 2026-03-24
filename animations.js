/**
 * AI Team Office - Animation Controller
 * Управляет анимациями агентов, пузырями речи и эмоциями
 */

class AgentAnimator {
    constructor() {
        this.agents = new Map();
        this.speechBubbles = new Map();
        this.emotions = ['happy', 'sad', 'surprised', 'angry', 'curious', 'sleepy', 'inspired'];
        this.messages = [
            'Отличная работа!',
            'Нужна помощь?',
            'Почти готово...',
            'Отличная идея!',
            'Сейчас проверю...',
            'Запушил изменения',
            'Баг исправлен!',
            'Код ревью пройден',
            'Нужен кофе ☕',
            'Всё работает!'
        ];
        this.init();
    }

    init() {
        this.findAgents();
        this.startRandomAnimations();
        this.startSpeechBubbles();
        this.startEmotionCycles();
    }

    /**
     * Находит всех агентов на странице
     */
    findAgents() {
        const agentElements = document.querySelectorAll('.agent-emoji');
        agentElements.forEach((el, index) => {
            const agentId = `agent-${index}`;
            el.dataset.agentId = agentId;
            this.agents.set(agentId, {
                element: el,
                state: 'idle',
                position: this.getElementPosition(el),
                desk: el.closest('.desk-station')
            });
        });
    }

    /**
     * Получает позицию элемента
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    /**
     * Запускает случайные анимации
     */
    startRandomAnimations() {
        // Случайная смена состояния печати
        setInterval(() => {
            const randomAgent = this.getRandomAgent();
            if (randomAgent && Math.random() > 0.5) {
                this.toggleTyping(randomAgent);
            }
        }, 2000);

        // Случайная ходьба агента
        setInterval(() => {
            const randomAgent = this.getRandomAgent();
            if (randomAgent && Math.random() > 0.7) {
                this.walkAgent(randomAgent);
            }
        }, 5000);
    }

    /**
     * Получает случайного агента
     */
    getRandomAgent() {
        const agents = Array.from(this.agents.values());
        return agents[Math.floor(Math.random() * agents.length)];
    }

    /**
     * Переключает анимацию печати
     */
    toggleTyping(agent) {
        const el = agent.element;
        const desk = agent.desk;
        
        if (el.classList.contains('agent-typing-intense')) {
            el.classList.remove('agent-typing-intense');
            if (desk) {
                const keyboard = desk.querySelector('.keyboard');
                const monitor = desk.querySelector('.monitor');
                if (keyboard) keyboard.classList.remove('keyboard-typing');
                if (monitor) monitor.classList.remove('monitor-typing');
            }
            agent.state = 'idle';
        } else {
            el.classList.add('agent-typing-intense');
            if (desk) {
                const keyboard = desk.querySelector('.keyboard');
                const monitor = desk.querySelector('.monitor');
                if (keyboard) keyboard.classList.add('keyboard-typing');
                if (monitor) monitor.classList.add('monitor-typing');
            }
            agent.state = 'typing';
            this.createTypingParticles(el);
        }
    }

    /**
     * Создаёт частицы при печати
     */
    createTypingParticles(element) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'typing-particle';
                const rect = element.getBoundingClientRect();
                particle.style.left = rect.left + rect.width / 2 + 'px';
                particle.style.top = rect.top + 'px';
                particle.style.setProperty('--tx', (Math.random() - 0.5) * 40 + 'px');
                particle.style.setProperty('--ty', -Math.random() * 30 + 'px');
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 800);
            }, i * 100);
        }
    }

    /**
     * Анимирует ходьбу агента
     */
    walkAgent(agent) {
        if (agent.state === 'walking') return;
        
        const el = agent.element;
        const directions = ['right', 'left', 'up', 'down'];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        agent.state = 'walking';
        el.classList.add(`agent-walking-${direction}`);
        
        // Создаём следы
        const footstepInterval = setInterval(() => {
            this.createFootstep(el, direction);
        }, 250);
        
        // Останавливаем ходьбу
        setTimeout(() => {
            el.classList.remove(`agent-walking-${direction}`);
            clearInterval(footstepInterval);
            agent.state = 'idle';
        }, 2000);
    }

    /**
     * Создаёт след от шага
     */
    createFootstep(element, direction) {
        const footstep = document.createElement('div');
        footstep.className = 'footstep';
        const rect = element.getBoundingClientRect();
        footstep.style.left = rect.left + rect.width / 2 + 'px';
        footstep.style.top = rect.top + rect.height + 'px';
        document.body.appendChild(footstep);
        setTimeout(() => footstep.remove(), 1500);
    }

    /**
     * Запускает пузыри речи
     */
    startSpeechBubbles() {
        setInterval(() => {
            const randomAgent = this.getRandomAgent();
            if (randomAgent && Math.random() > 0.6) {
                this.showSpeechBubble(randomAgent);
            }
        }, 4000);
    }

    /**
     * Показывает пузырь речи
     */
    showSpeechBubble(agent) {
        const el = agent.element;
        const container = el.closest('.agent-container');
        if (!container) return;
        
        // Удаляем старый пузырь если есть
        const oldBubble = container.querySelector('.speech-bubble');
        if (oldBubble) oldBubble.remove();
        
        // Создаём индикатор набора
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble typing';
        bubble.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        container.appendChild(bubble);
        
        // Показываем сообщение через секунду
        setTimeout(() => {
            const message = this.messages[Math.floor(Math.random() * this.messages.length)];
            bubble.classList.remove('typing');
            bubble.innerHTML = `<div class="speech-text">${message}</div>`;
            
            // Убираем пузырь через 3 секунды
            setTimeout(() => {
                bubble.classList.add('sending');
                setTimeout(() => bubble.remove(), 500);
            }, 3000);
        }, 1000);
    }

    /**
     * Показывает кастомный пузырь речи
     */
    showCustomSpeech(agentId, message, duration = 3000) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        const el = agent.element;
        const container = el.closest('.agent-container');
        if (!container) return;
        
        const oldBubble = container.querySelector('.speech-bubble');
        if (oldBubble) oldBubble.remove();
        
        const bubble = document.createElement('div');
        bubble.className = 'speech-bubble visible';
        bubble.innerHTML = `<div class="speech-text">${message}</div>`;
        container.appendChild(bubble);
        
        setTimeout(() => {
            bubble.classList.add('sending');
            setTimeout(() => bubble.remove(), 500);
        }, duration);
    }

    /**
     * Запускает циклы эмоций
     */
    startEmotionCycles() {
        setInterval(() => {
            const randomAgent = this.getRandomAgent();
            if (randomAgent && Math.random() > 0.7) {
                const emotion = this.emotions[Math.floor(Math.random() * this.emotions.length)];
                this.setEmotion(randomAgent, emotion);
            }
        }, 6000);
    }

    /**
     * Устанавливает эмоцию агента
     */
    setEmotion(agent, emotion) {
        const el = agent.element;
        
        // Убираем старые эмоции
        this.emotions.forEach(e => el.classList.remove(`emotion-${e}`));
        
        // Добавляем новую эмоцию
        el.classList.add(`emotion-${emotion}`);
        
        // Убираем через 3 секунды
        setTimeout(() => {
            el.classList.remove(`emotion-${emotion}`);
        }, 3000);
    }

    /**
     * Создаёт конфетти для празднования
     */
    createConfetti(element) {
        const rect = element.getBoundingClientRect();
        const colors = ['#00d4ff', '#a855f7', '#ec4899', '#22c55e', '#f59e0b'];
        
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = rect.left + rect.width / 2 + 'px';
            confetti.style.top = rect.top + 'px';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 2000);
        }
    }

    /**
     * Анимирует появление агента
     */
    spawnAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.element.classList.add('agent-spawn');
        setTimeout(() => {
            agent.element.classList.remove('agent-spawn');
        }, 600);
    }

    /**
     * Анимирует исчезновение агента
     */
    despawnAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.element.classList.add('agent-despawn');
        setTimeout(() => {
            agent.element.classList.remove('agent-despawn');
        }, 400);
    }

    /**
     * Добавляет уведомление к агенту
     */
    addNotification(agentId, count = 1) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        const container = agent.element.closest('.agent-container');
        if (!container) return;
        
        let badge = container.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'notification-badge';
            container.appendChild(badge);
        }
        
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + count;
        
        // Убираем через 5 секунд
        setTimeout(() => {
            if (badge.parentNode) badge.remove();
        }, 5000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.agentAnimator = new AgentAnimator();
});

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentAnimator;
}
