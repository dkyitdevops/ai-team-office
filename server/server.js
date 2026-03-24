const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// XSS защита - санитизация HTML
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// CORS - ограниченные origin'ы
const io = new Server(server, {
  cors: {
    origin: ["https://46-149-68-9.nip.io", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
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

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial data
  socket.emit('agents', agents);
  socket.emit('tasks', tasks);
  socket.emit('messages', messages);
  
  // Handle chat
  socket.on('message', (data) => {
    // Rate limiting check
    const rateCheck = checkRateLimit(socket.id);
    if (!rateCheck.allowed) {
      socket.emit('error', { message: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` });
      return;
    }
    
    // XSS защита - санитизация входящих данных
    const msg = {
      id: Date.now(),
      agent: data.agent ? escapeHtml(String(data.agent)) : '',
      text: data.text ? escapeHtml(String(data.text)) : '',
      time: new Date().toLocaleTimeString()
    };
    
    messages.push(msg);
    
    // Ограничение памяти - хранить только последние 500 сообщений
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
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    messageLimits.delete(socket.id);
  });
});

// API routes
app.get('/api/agents', (req, res) => res.json(agents));
app.get('/api/tasks', (req, res) => res.json(tasks));
app.get('/api/messages', (req, res) => res.json(messages));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`AI Team Office server running on port ${PORT}`);
});
