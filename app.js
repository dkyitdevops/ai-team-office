/**
 * AI Team Office - Interactive Application
 * Features: Animated avatars, real-time chat, drag-and-drop tasks, interactive map
 */

// ========================================
// Data Models
// ========================================

const agents = [
    { id: 1, name: 'Virtual BG', avatar: '🎨', role: 'Дизайнер', status: 'working', desk: 1, tasks: 5, messages: 23, efficiency: 94 },
    { id: 2, name: 'Recording', avatar: '🎥', role: 'Видео-редактор', status: 'working', desk: 2, tasks: 3, messages: 18, efficiency: 91 },
    { id: 3, name: 'Tester', avatar: '🧪', role: 'QA Инженер', status: 'working', desk: 3, tasks: 7, messages: 31, efficiency: 96 },
    { id: 4, name: 'DevOps', avatar: '🚀', role: 'DevOps', status: 'working', desk: 4, tasks: 4, messages: 15, efficiency: 93 },
    { id: 5, name: 'Analyst', avatar: '📚', role: 'Аналитик', status: 'working', desk: 5, tasks: 6, messages: 27, efficiency: 89 },
    { id: 6, name: 'Security', avatar: '🔒', role: 'Безопасность', status: 'working', desk: 6, tasks: 2, messages: 12, efficiency: 97 },
    { id: 7, name: 'Calendar', avatar: '📅', role: 'Планировщик', status: 'resting', desk: null, tasks: 1, messages: 8, efficiency: 88 },
    { id: 8, name: 'КЭП ТСО', avatar: '📋', role: 'Консультант', status: 'resting', desk: null, tasks: 0, messages: 22, efficiency: 92 }
];

const tasks = [
    { id: 1, title: 'Обновить дизайн главной', status: 'in-progress', priority: 'high', assignee: 1, tag: 'UI/UX' },
    { id: 2, title: 'Протестировать API', status: 'todo', priority: 'high', assignee: 3, tag: 'Testing' },
    { id: 3, title: 'Настроить CI/CD', status: 'done', priority: 'medium', assignee: 4, tag: 'DevOps' },
    { id: 4, title: 'Анализ конкурентов', status: 'in-progress', priority: 'medium', assignee: 5, tag: 'Research' },
    { id: 5, title: 'Исправить баг #234', status: 'todo', priority: 'high', assignee: 3, tag: 'Bug' },
    { id: 6, title: 'Обновить документацию', status: 'todo', priority: 'low', assignee: 2, tag: 'Docs' },
    { id: 7, title: 'Проверка безопасности', status: 'in-progress', priority: 'high', assignee: 6, tag: 'Security' },
    { id: 8, title: 'Оптимизация видео', status: 'done', priority: 'medium', assignee: 2, tag: 'Video' },
    { id: 9, title: 'Планирование спринта', status: 'done', priority: 'low', assignee: 7, tag: 'Planning' },
    { id: 10, title: 'Ревизия доступов', status: 'in-progress', priority: 'high', assignee: 6, tag: 'Security' },
    { id: 11, title: 'Новые иконки', status: 'todo', priority: 'low', assignee: 1, tag: 'Design' },
    { id: 12, title: 'Отчёт по метрикам', status: 'todo', priority: 'medium', assignee: 5, tag: 'Analytics' }
];

const chatMessages = [
    { id: 1, agentId: 1, text: 'Привет всем! Закончил новые баннеры для главной.', time: '10:30' },
    { id: 2, agentId: 3, text: 'Отлично! Я начал тестирование API.', time: '10:32' },
    { id: 3, agentId: 4, text: 'CI/CD pipeline обновлён. Все деплои работают.', time: '10:35' },
    { id: 4, agentId: 5, text: 'Подготовил анализ конкурентов. Кто-нибудь может посмотреть?', time: '10:40' },
    { id: 5, agentId: 6, text: 'Проверил безопасность. Всё в порядке.', time: '10:42' },
    { id: 6, agentId: 2, text: 'Видео для релиза готово!', time: '10:45' }
];

const chatPhrases = [
    'Работаю над этим...',
    'Почти готово!',
    'Нужно ещё немного времени',
    'Отличная идея!',
    'Согласен с тобой',
    'Проверяю сейчас',
    'Всё работает как надо',
    'Нашёл интересное решение',
    'Давай обсудим в созвоне',
    'Обновил документацию'
];

// ========================================
// State Management
// ========================================

let currentUser = { id: 0, name: 'Вы', avatar: '👤' };
let draggedTask = null;
let selectedAgent = null;
let messageCount = 156;

// ========================================
// DOM Elements
// ========================================

const desksContainer = document.getElementById('desks-container');
const restingSpots = document.getElementById('resting-spots');
const meetingSeats = document.getElementById('meeting-seats');
const chatMessagesContainer = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');
const typingIndicator = document.getElementById('typing-indicator');
const particlesContainer = document.getElementById('particles');
const currentTimeDisplay = document.getElementById('current-time');

// Modals
const agentModal = document.getElementById('agent-modal');
const taskModal = document.getElementById('task-modal');

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initOfficeMap();
    initChat();
    initTasks();
    initParticles();
    initTime();
    initModals();
    startSimulation();
});

// ========================================
// Office Map
// ========================================

function initOfficeMap() {
    renderDesks();
    renderRestingAgents();
    renderMeetingSeats();
}

function renderDesks() {
    desksContainer.innerHTML = '';
    
    for (let i = 1; i <= 6; i++) {
        const agent = agents.find(a => a.desk === i);
        const desk = document.createElement('div');
        desk.className = `desk ${agent ? 'occupied' : ''}`;
        desk.dataset.deskId = i;
        
        if (agent) {
            desk.innerHTML = `
                <div class="desk-setup">
                    🖥️
                    <div class="desk-avatar ${agent.status}">${agent.avatar}</div>
                </div>
                <div class="desk-name">Место #${i}</div>
                <div class="desk-agent-name">${agent.name}</div>
                <div class="desk-status ${agent.status}">${agent.status === 'working' ? '● Работает' : '○ Отдыхает'}</div>
            `;
            desk.addEventListener('click', () => openAgentModal(agent));
        } else {
            desk.innerHTML = `
                <div class="desk-setup">🖥️</div>
                <div class="desk-name">Место #${i}</div>
                <div class="desk-agent-name">Свободно</div>
            `;
        }
        
        desksContainer.appendChild(desk);
    }
}

function renderRestingAgents() {
    restingSpots.innerHTML = '';
    const restingAgents = agents.filter(a => a.status === 'resting');
    
    restingAgents.forEach(agent => {
        const restingCard = document.createElement('div');
        restingCard.className = 'resting-agent';
        restingCard.innerHTML = `
            <span class="resting-agent-avatar">${agent.avatar}</span>
            <span class="resting-agent-name">${agent.name}</span>
            <span class="resting-agent-activity">${getRandomActivity()}</span>
        `;
        restingCard.addEventListener('click', () => openAgentModal(agent));
        restingSpots.appendChild(restingCard);
    });
}

function renderMeetingSeats() {
    meetingSeats.innerHTML = '';
    const meetingAgents = agents.filter(a => a.status === 'working').slice(0, 4);
    
    meetingAgents.forEach(agent => {
        const seat = document.createElement('div');
        seat.className = 'meeting-seat';
        seat.textContent = agent.avatar;
        seat.title = agent.name;
        meetingSeats.appendChild(seat);
    });
}

function getRandomActivity() {
    const activities = ['Пьёт кофе', 'Отдыхает', 'Читает', 'Думает', 'На перерыве'];
    return activities[Math.floor(Math.random() * activities.length)];
}

// ========================================
// Chat
// ========================================

function initChat() {
    renderChatMessages();
    
    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function renderChatMessages() {
    chatMessagesContainer.innerHTML = '';
    
    chatMessages.forEach(msg => {
        const agent = agents.find(a => a.id === msg.agentId) || currentUser;
        const isOwn = msg.agentId === 0;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwn ? 'own' : ''}`;
        messageEl.innerHTML = `
            <div class="message-avatar">${agent.avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${agent.name}</span>
                    <span class="message-time">${msg.time}</span>
                </div>
                <div class="message-text">${msg.text}</div>
            </div>
        `;
        
        chatMessagesContainer.appendChild(messageEl);
    });
    
    scrollToBottom();
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const message = {
        id: chatMessages.length + 1,
        agentId: 0,
        text: text,
        time: time
    };
    
    chatMessages.push(message);
    chatInput.value = '';
    
    renderChatMessages();
    updateMessageCount();
    
    // Simulate agent response
    setTimeout(() => simulateAgentResponse(), 1000 + Math.random() * 2000);
}

function simulateAgentResponse() {
    const workingAgents = agents.filter(a => a.status === 'working');
    const randomAgent = workingAgents[Math.floor(Math.random() * workingAgents.length)];
    
    if (!randomAgent) return;
    
    // Show typing indicator
    typingIndicator.querySelector('.typing-agent').textContent = `${randomAgent.avatar} ${randomAgent.name}`;
    typingIndicator.classList.add('active');
    
    setTimeout(() => {
        typingIndicator.classList.remove('active');
        
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const message = {
            id: chatMessages.length + 1,
            agentId: randomAgent.id,
            text: chatPhrases[Math.floor(Math.random() * chatPhrases.length)],
            time: time
        };
        
        chatMessages.push(message);
        renderChatMessages();
        updateMessageCount();
        
        showToast('Новое сообщение', `${randomAgent.name}: ${message.text}`);
    }, 1500 + Math.random() * 1500);
}

function scrollToBottom() {
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function updateMessageCount() {
    messageCount++;
    document.getElementById('msg-count').textContent = messageCount;
}

// ========================================
// Tasks (Drag & Drop)
// ========================================

function initTasks() {
    renderTasks();
    initDragAndDrop();
    initTaskModal();
}

function renderTasks() {
    const todoList = document.getElementById('todo-list');
    const inProgressList = document.getElementById('in-progress-list');
    const doneList = document.getElementById('done-list');
    
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';
    
    const counts = { todo: 0, 'in-progress': 0, done: 0 };
    
    tasks.forEach(task => {
        counts[task.status]++;
        const taskCard = createTaskCard(task);
        
        if (task.status === 'todo') todoList.appendChild(taskCard);
        else if (task.status === 'in-progress') inProgressList.appendChild(taskCard);
        else if (task.status === 'done') doneList.appendChild(taskCard);
    });
    
    // Update counts
    document.getElementById('count-todo').textContent = counts.todo;
    document.getElementById('count-in-progress').textContent = counts['in-progress'];
    document.getElementById('count-done').textContent = counts.done;
    document.getElementById('task-count').textContent = tasks.length;
}

function createTaskCard(task) {
    const agent = agents.find(a => a.id === task.assignee);
    const card = document.createElement('div');
    card.className = `task-card priority-${task.priority}`;
    card.draggable = true;
    card.dataset.taskId = task.id;
    
    card.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-meta">
            <div class="task-assignee" title="${agent ? agent.name : 'Не назначен'}">${agent ? agent.avatar : '?'}</div>
            <span class="task-tag">${task.tag}</span>
            <span class="task-priority ${task.priority}">${task.priority}</span>
        </div>
    `;
    
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    return card;
}

function initDragAndDrop() {
    const dropZones = document.querySelectorAll('[data-drop-zone]');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedTask = tasks.find(t => t.id === parseInt(e.target.dataset.taskId));
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedTask = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedTask) return;
    
    const newStatus = e.currentTarget.dataset.dropZone;
    if (draggedTask.status !== newStatus) {
        draggedTask.status = newStatus;
        renderTasks();
        
        const statusLabels = { todo: 'К выполнению', 'in-progress': 'В работе', done: 'Готово' };
        showToast('Задача перемещена', `"${draggedTask.title}" → ${statusLabels[newStatus]}`, 'success');
    }
}

function initTaskModal() {
    const addButtons = document.querySelectorAll('.add-task-btn');
    const taskAssigneeSelect = document.getElementById('task-assignee');
    
    // Populate assignee dropdown
    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = `${agent.avatar} ${agent.name}`;
        taskAssigneeSelect.appendChild(option);
    });
    
    addButtons.forEach(btn => {
        btn.addEventListener('click', () => openTaskModal(btn.dataset.column));
    });
    
    document.getElementById('task-cancel').addEventListener('click', closeTaskModal);
    document.getElementById('task-modal-close').addEventListener('click', closeTaskModal);
    document.getElementById('task-save').addEventListener('click', saveTask);
}

function openTaskModal(column) {
    taskModal.classList.add('active');
    taskModal.dataset.column = column;
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-assignee').value = '';
    document.getElementById('task-title').focus();
}

function closeTaskModal() {
    taskModal.classList.remove('active');
}

function saveTask() {
    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const assignee = parseInt(document.getElementById('task-assignee').value) || null;
    const column = taskModal.dataset.column;
    
    if (!title) {
        showToast('Ошибка', 'Введите название задачи', 'error');
        return;
    }
    
    const newTask = {
        id: tasks.length + 1,
        title: title,
        status: column,
        priority: 'medium',
        assignee: assignee || Math.floor(Math.random() * agents.length) + 1,
        tag: 'New'
    };
    
    tasks.push(newTask);
    renderTasks();
    closeTaskModal();
    
    showToast('Задача создана', `"${title}" добавлена в ${column === 'todo' ? 'К выполнению' : column === 'in-progress' ? 'В работе' : 'Готово'}`, 'success');
}

// ========================================
// Particles Animation
// ========================================

function initParticles() {
    for (let i = 0; i < 20; i++) {
        createParticle();
    }
}

function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.animationDuration = (8 + Math.random() * 6) + 's';
    particlesContainer.appendChild(particle);
}

// ========================================
// Time Display
// ========================================

function initTime() {
    updateTime();
    setInterval(updateTime, 1000);
}

function updateTime() {
    const now = new Date();
    currentTimeDisplay.textContent = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ========================================
// Modals
// ========================================

function initModals() {
    document.getElementById('modal-close').addEventListener('click', closeAgentModal);
    
    agentModal.addEventListener('click', (e) => {
        if (e.target === agentModal) closeAgentModal();
    });
    
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
    });
}

function openAgentModal(agent) {
    selectedAgent = agent;
    
    document.getElementById('modal-avatar').textContent = agent.avatar;
    document.getElementById('modal-name').textContent = agent.name;
    document.getElementById('modal-role').textContent = agent.role;
    
    const statusBadge = document.getElementById('modal-status');
    statusBadge.textContent = agent.status === 'working' ? 'Работает' : 'Отдыхает';
    statusBadge.className = `agent-status-badge-large ${agent.status}`;
    
    document.getElementById('modal-tasks').textContent = agent.tasks;
    document.getElementById('modal-messages').textContent = agent.messages;
    document.getElementById('modal-efficiency').textContent = agent.efficiency + '%';
    
    agentModal.classList.add('active');
}

function closeAgentModal() {
    agentModal.classList.remove('active');
    selectedAgent = null;
}

// ========================================
// Simulation
// ========================================

function startSimulation() {
    // Random agent status changes
    setInterval(() => {
        if (Math.random() > 0.7) {
            const randomAgent = agents[Math.floor(Math.random() * agents.length)];
            const oldStatus = randomAgent.status;
            randomAgent.status = randomAgent.status === 'working' ? 'resting' : 'working';
            
            if (oldStatus !== randomAgent.status) {
                renderDesks();
                renderRestingAgents();
                renderMeetingSeats();
                
                const onlineCount = agents.filter(a => a.status === 'working').length;
                document.getElementById('online-count').textContent = onlineCount;
            }
        }
    }, 10000);
    
    // Random chat messages
    setInterval(() => {
        if (Math.random() > 0.6) {
            simulateAgentResponse();
        }
    }, 15000);
    
    // Random task updates
    setInterval(() => {
        if (Math.random() > 0.8 && tasks.length > 0) {
            const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
            const statuses = ['todo', 'in-progress', 'done'];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            if (randomTask.status !== newStatus) {
                randomTask.status = newStatus;
                renderTasks();
            }
        }
    }, 20000);
}

// ========================================
// Toast Notifications
// ========================================

function showToast(title, message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ========================================
// Utility Functions
// ========================================

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// Make functions available globally for debugging
window.AITeamOffice = {
    agents,
    tasks,
    chatMessages,
    showToast,
    openAgentModal,
    renderTasks,
    renderChatMessages
};
