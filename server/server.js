const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

// Security middleware
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

// CORS middleware для HTTP API
app.use(cors({
  origin: ['https://46-149-68-9.nip.io', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Apply security middleware
app.use(helmet());
app.use(cookieParser());
app.use(csrf({ cookie: true }));

// Middleware для передачи CSRF токена в ответы
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Подключаем Agents API (GitHub Issue #14)
const { router: agentsApiRouter, getAllAgentsStatus } = require('./agents-api');
app.use('/api/agents', agentsApiRouter);

// XSS защита - санитизация HTML
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ========== PROJECT NAME VALIDATION (GitHub Issue #7) ==========
const validateProjectName = (projectName) => {
  const maxLength = 50;
  
  if (typeof projectName !== 'string') {
    return { valid: false, sanitized: 'Unknown', error: 'Must be string' };
  }
  
  let sanitized = projectName.substring(0, maxLength).trim();
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-_\.]/g, '');
  
  if (sanitized.length === 0) {
    sanitized = 'Unknown';
  }
  
  const valid = projectName.length <= maxLength && 
                /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_\.]+$/.test(projectName);
  
  return { valid, sanitized, error: valid ? null : 'Invalid characters or too long' };
};

const validateTaskName = (taskName) => {
  const maxLength = 100;
  
  if (typeof taskName !== 'string') {
    return { valid: false, sanitized: 'No task', error: 'Must be string' };
  }
  
  let sanitized = taskName.substring(0, maxLength).trim();
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  if (sanitized.length === 0) {
    sanitized = 'No task';
  }
  
  return {
    valid: taskName.length <= maxLength,
    sanitized,
    error: taskName.length > maxLength ? 'Too long (max 100)' : null
  };
};

// CORS - ограниченные origin'ы
const io = new Server(server, {
  cors: {
    origin: ["https://46-149-68-9.nip.io", "http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

// WebSocket origin validation middleware
io.use((socket, next) => {
  const origin = socket.handshake.headers.origin;
  const allowedOrigins = ['https://46-149-68-9.nip.io', 'http://localhost:3000', 'http://localhost:3001'];
  if (allowedOrigins.includes(origin)) {
    return next();
  }
  return next(new Error('Origin not allowed'));
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Agents data
const agents = [
  { id: 'virtual-bg', name: 'Virtual BG', role: 'Frontend', emoji: '🎨', status: 'working', task: 'MediaPipe интеграция' },
  { id: 'recording', name: 'Recording', role: 'Fullstack', emoji: '🎥', status: 'working', task: 'Серверное сохранение видео' },
  { id: 'tester', name: 'Tester', role: 'QA', emoji: '🧪', status: 'working', task: 'Автотесты' },
  { id: 'devops', name: 'DevOps', role: 'Infrastructure', emoji: '🚀', status: 'working', task: 'CI/CD' },
  { id: 'analyst', name: 'Analyst', role: 'Tech Writer', emoji: '📚', status: 'working', task: 'Документация' },
  { id: 'security', name: 'Security', role: 'Security Eng', emoji: '🔒', status: 'working', task: 'Security audit' },
  { id: 'calendar', name: 'Calendar', role: 'Integration', emoji: '📅', status: 'resting', task: 'Отдыхает' },
  { id: 'kep-tso', name: 'КЭП ТСО', role: 'Domain Expert', emoji: '📋', status: 'resting', task: 'Готов к вопросам' }
];

// Tasks
let tasks = [
  { id: 1, title: 'Интеграция MediaPipe', agent: 'virtual-bg', status: 'in-progress', priority: 'high' },
  { id: 2, title: 'Запись видео', agent: 'recording', status: 'done', priority: 'high' },
  { id: 3, title: 'Автотесты', agent: 'tester', status: 'in-progress', priority: 'medium' }
];

// Chat messages
let messages = [];

// Rate limiting - 10 сообщений/минута
const messageLimits = new Map();
const MAX_MESSAGES_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkRateLimit(socketId) {
  const now = Date.now();
  const userLimit = messageLimits.get(socketId);
  
  if (!userLimit) {
    messageLimits.set(socketId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (now > userLimit.resetTime) {
    messageLimits.set(socketId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  
  if (userLimit.count >= MAX_MESSAGES_PER_MINUTE) {
    return { allowed: false, retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) };
  }
  
  userLimit.count++;
  return { allowed: true };
}

// Cleanup rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [socketId, limit] of messageLimits.entries()) {
    if (now > limit.resetTime) {
      messageLimits.delete(socketId);
    }
  }
}, 60000);

// ========== AGENT STATUS BROADCAST (GitHub Issue #14) ==========
let lastAgentStatuses = {};

// Функция для проверки изменений статусов и отправки обновлений
async function broadcastAgentStatusUpdate() {
  try {
    const agents = await getAllAgentsStatus();
    let hasChanges = false;
    const changes = [];
    
    for (const agent of agents) {
      const lastStatus = lastAgentStatuses[agent.name];
      
      // Проверяем изменения статуса, локации, задачи или прогресса
      if (!lastStatus || 
          lastStatus.status !== agent.status ||
          lastStatus.location !== agent.location ||
          lastStatus.task !== agent.task ||
          lastStatus.progress !== agent.progress) {
        hasChanges = true;
        changes.push({
          name: agent.name,
          from: lastStatus || null,
          to: {
            status: agent.status,
            location: agent.location,
            task: agent.task,
            progress: agent.progress,
            project: agent.project
          }
        });
        
        // Обновляем кэш
        lastAgentStatuses[agent.name] = {
          status: agent.status,
          location: agent.location,
          task: agent.task,
          progress: agent.progress,
          project: agent.project,
          issues: agent.issues
        };
      }
    }
    
    // Отправляем обновления только если есть изменения
    if (hasChanges) {
      console.log('[WebSocket] Отправка обновлений статусов:', changes.map(c => c.name).join(', '));
      
      io.emit('agents-status-update', {
        agents: agents,
        changes: changes,
        timestamp: new Date().toISOString()
      });
    }
    
    return agents;
  } catch (error) {
    console.error('[WebSocket] Ошибка при получении статусов:', error);
    return null;
  }
}

// Запускаем периодическую проверку статусов (каждые 30 секунд)
const STATUS_CHECK_INTERVAL = 30000;
setInterval(broadcastAgentStatusUpdate, STATUS_CHECK_INTERVAL);

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial data
  socket.emit('agents', agents);
  socket.emit('tasks', tasks);
  socket.emit('messages', messages);
  
  // Отправляем текущие статусы агентов при подключении
  getAllAgentsStatus().then(agents => {
    socket.emit('agents-status-update', {
      agents: agents,
      changes: [],
      timestamp: new Date().toISOString(),
      initial: true
    });
  }).catch(err => {
    console.error('[WebSocket] Ошибка отправки начальных статусов:', err);
  });
  
  // Handle chat
  socket.on('message', (data) => {
    const rateCheck = checkRateLimit(socket.id);
    if (!rateCheck.allowed) {
      socket.emit('error', { message: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` });
      return;
    }
    
    const msg = {
      id: Date.now(),
      agent: data.agent ? escapeHtml(String(data.agent)) : '',
      text: data.text ? escapeHtml(String(data.text)) : '',
      time: new Date().toLocaleTimeString()
    };
    
    messages.push(msg);
    
    if (messages.length > 500) {
      messages = messages.slice(-500);
    }
    
    io.emit('message', msg);
  });
  
  // Handle task update
  socket.on('task-update', (data) => {
    const task = tasks.find(t => t.id === data.id);
    if (task) {
      task.status = data.status;
      io.emit('task-updated', task);
    }
  });
  
  // Handle project display update (GitHub Issue #7)
  socket.on('project-update', (data) => {
    const projectValidation = validateProjectName(data.project);
    const taskValidation = validateTaskName(data.task);
    
    if (!projectValidation.valid || !taskValidation.valid) {
      socket.emit('error', { 
        message: 'Validation failed', 
        details: [
          ...(projectValidation.error ? [`Project: ${projectValidation.error}`] : []),
          ...(taskValidation.error ? [`Task: ${taskValidation.error}`] : [])
        ]
      });
      return;
    }
    
    const updateData = {
      agentId: data.agentId,
      project: projectValidation.sanitized,
      task: taskValidation.sanitized,
      timestamp: Date.now()
    };
    
    io.emit('project-updated', updateData);
  });
  
  // Handle request for agent status update
  socket.on('request-agents-status', async () => {
    try {
      const agents = await getAllAgentsStatus();
      socket.emit('agents-status-update', {
        agents: agents,
        changes: [],
        timestamp: new Date().toISOString(),
        requested: true
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch agent statuses' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    messageLimits.delete(socket.id);
  });
});

// Health check endpoint (GitHub Issue #6)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/agents', (req, res) => res.json(agents));
app.get('/api/tasks', (req, res) => res.json(tasks));
app.get('/api/messages', (req, res) => res.json(messages));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`AI Team Office server running on port ${PORT}`);
  console.log(`WebSocket enabled for real-time agent status updates`);
});
