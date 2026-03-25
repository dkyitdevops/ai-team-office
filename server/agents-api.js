/**
 * AI Team Office - Agents Status API
 * GitHub Issue #14: Динамическое обновление статусов агентов
 * 
 * Получает Issues из GitHub, определяет статус агентов (working/resting)
 * и возвращает location: 'work-zone' или 'rest-room'
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Конфигурация
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';

// Репозитории для получения issues
const REPOS = [
  'dkyitdevops/meetify',
  'dkyitdevops/ai-team-office'
];

// Список агентов с их GitHub usernames и ролями
const AGENTS_CONFIG = {
  'Алексей': { 
    githubUsername: null,
    role: 'UI Designer', 
    emoji: '👨‍🎨',
    deskId: '1'
  },
  'Мария': { 
    githubUsername: null,
    role: 'Fullstack разработчик', 
    emoji: '👨‍💼',
    deskId: '2'
  },
  'Иван': { 
    githubUsername: null,
    role: 'QA инженер', 
    emoji: '👩‍🔬',
    deskId: '3'
  },
  'Дмитрий': { 
    githubUsername: null,
    role: 'DevOps инженер', 
    emoji: '👨‍🚀',
    deskId: '4'
  },
  'Ольга': { 
    githubUsername: null,
    role: 'Аналитик', 
    emoji: '👨‍💻',
    deskId: '5'
  },
  'Андрей': { 
    githubUsername: null,
    role: 'Security инженер', 
    emoji: '👩‍✈️',
    deskId: '6'
  },
  'Сергей': {
    githubUsername: null,
    role: 'Backend разработчик',
    emoji: '😴',
    deskId: null
  },
  'Елена': {
    githubUsername: null,
    role: 'КЭП ТСО',
    emoji: '🧑‍🎮',
    deskId: null
  }
};

// Зоны офиса
const OFFICE_ZONES = {
  'work-zone': { label: 'Рабочая зона', color: 'green' },
  'rest-room': { label: 'Комната отдыха', color: 'yellow' }
};

// Кэш для issues
let issuesCache = [];
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 30000; // 30 секунд

/**
 * Получить issues для конкретного агента по label
 * Используется для endpoint /api/agents/status/:name
 */
async function getGitHubIssuesForAgent(agentName) {
  if (!GITHUB_TOKEN) {
    console.warn('[Agents API] GITHUB_TOKEN не установлен');
    return [];
  }

  const agentLabel = `agent:${agentName}`;
  const allIssues = [];

  for (const repo of REPOS) {
    try {
      // Кодируем label для URL (поддержка кириллицы)
      const encodedLabel = encodeURIComponent(agentLabel);
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${repo}/issues?state=all&labels=${encodedLabel}&per_page=100`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Team-Office-Agents-API'
          },
          timeout: 10000
        }
      );
      
      // Добавляем репозиторий к каждому issue
      const issuesWithRepo = response.data.map(issue => ({
        ...issue,
        repository: repo
      }));
      
      allIssues.push(...issuesWithRepo);
    } catch (error) {
      console.error(`[Agents API] Ошибка получения issues для агента ${agentName} из ${repo}:`, error.message);
    }
  }

  return allIssues;
}

/**
 * Получить все issues из всех репозиториев
 */
async function getGitHubIssues() {
  const now = Date.now();
  
  // Используем кэш если он актуален
  if (issuesCache.length > 0 && (now - lastCacheUpdate) < CACHE_TTL_MS) {
    return issuesCache;
  }
  
  const allIssues = [];
  
  if (!GITHUB_TOKEN) {
    console.warn('[Agents API] GITHUB_TOKEN не установлен, используем fallback данные');
    return [];
  }
  
  for (const repo of REPOS) {
    try {
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${repo}/issues?state=all&per_page=100`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Team-Office-Agents-API'
          },
          timeout: 10000
        }
      );
      
      // Добавляем репозиторий к каждому issue
      const issuesWithRepo = response.data.map(issue => ({
        ...issue,
        repository: repo
      }));
      
      allIssues.push(...issuesWithRepo);
    } catch (error) {
      console.error(`[Agents API] Ошибка получения issues из ${repo}:`, error.message);
    }
  }
  
  // Обновляем кэш
  issuesCache = allIssues;
  lastCacheUpdate = now;
  
  return allIssues;
}

/**
 * Определить проект из репозитория issue
 */
function getProjectFromRepo(repo) {
  if (!repo) return null;
  if (repo.includes('meetify')) return 'Meetify';
  if (repo.includes('ai-team-office')) return 'AI Team Office';
  return 'Unknown';
}

/**
 * Issue #19: Унифицированная фильтрация issues для агента
 * Только по label, без fallback на assignee/title/body
 */
function filterIssuesForAgent(issues, agentName) {
  const agentLabel = `agent:${agentName}`;
  
  return issues.filter(issue => {
    // Проверка по label только
    const hasLabel = issue.labels && issue.labels.some(l => l.name === agentLabel);
    return hasLabel;
  });
}

/**
 * Определить статус агента на основе assigned issues
 * - working: есть открытые issues с label agent:{имя_агента}
 * - resting: нет открытых issues
 */
function determineAgentStatus(agentName, issues) {
  const config = AGENTS_CONFIG[agentName];
  if (!config) {
    return { status: 'resting', issues: [], project: null, task: null, progress: 0 };
  }

  // Issue #19: Используем унифицированную фильтрацию
  const assignedIssues = filterIssuesForAgent(issues, agentName);

  // Открытые и закрытые issues
  const openIssues = assignedIssues.filter(i => i.state === 'open');
  const closedIssues = assignedIssues.filter(i => i.state === 'closed');
  
  // Вычисляем прогресс: closed / (open + closed) * 100
  const totalIssues = openIssues.length + closedIssues.length;
  const progress = totalIssues > 0 
    ? Math.round((closedIssues.length / totalIssues) * 100)
    : 0;
  
  // Определяем статус
  const isWorking = openIssues.length > 0;
  
  // Берём данные из первого открытого issue или первого issue
  const primaryIssue = openIssues[0] || assignedIssues[0];
  
  return {
    status: isWorking ? 'working' : 'resting',
    issues: assignedIssues.map(i => ({ 
      number: i.number, 
      title: i.title,
      state: i.state,
      repo: i.repository 
    })),
    openIssuesCount: openIssues.length,
    closedIssuesCount: closedIssues.length,
    project: primaryIssue ? getProjectFromRepo(primaryIssue.repository) : null,
    task: primaryIssue ? primaryIssue.title : null,
    progress: progress
  };
}

/**
 * Определить локацию агента на основе статуса
 * - working → 'work-zone' (рабочая зона), 🟢 зелёное кольцо
 * - resting → 'rest-room' (комната отдыха), 🟡 жёлтое кольцо
 */
function determineAgentLocation(status) {
  if (status === 'working') {
    return {
      location: 'work-zone',
      statusRing: 'green',
      statusRingColor: '#22c55e'
    };
  } else {
    return {
      location: 'rest-room',
      statusRing: 'yellow',
      statusRingColor: '#f59e0b'
    };
  }
}

/**
 * Сформировать полный объект агента
 */
function buildAgentObject(agentName) {
  const config = AGENTS_CONFIG[agentName];
  if (!config) return null;

  return {
    id: config.deskId || agentName.toLowerCase().replace(/\s/g, '-'),
    name: agentName,
    role: config.role,
    emoji: config.emoji,
    deskId: config.deskId
  };
}

/**
 * Получить статусы всех агентов
 */
async function getAllAgentsStatus() {
  const issues = await getGitHubIssues();
  const filteredIssues = issues.filter(issue => !issue.pull_request);
  
  const agents = Object.keys(AGENTS_CONFIG).map(agentName => {
    const baseAgent = buildAgentObject(agentName);
    const statusInfo = determineAgentStatus(agentName, filteredIssues);
    const locationInfo = determineAgentLocation(statusInfo.status);
    
    return {
      ...baseAgent,
      ...statusInfo,
      ...locationInfo
    };
  });
  
  // Сортируем: сначала working (по алфавиту), потом resting
  agents.sort((a, b) => {
    if (a.status === 'working' && b.status !== 'working') return -1;
    if (a.status !== 'working' && b.status === 'working') return 1;
    return a.name.localeCompare(b.name);
  });
  
  return agents;
}

/**
 * Получить статус конкретного агента
 * Использует прямой запрос по label agent:{имя_агента}
 */
async function getAgentStatus(agentName) {
  if (!AGENTS_CONFIG[agentName]) {
    return null;
  }
  
  // Получаем issues по label agent:{имя_агента} напрямую из API
  const issues = await getGitHubIssuesForAgent(agentName);
  const filteredIssues = issues.filter(issue => !issue.pull_request);
  
  const baseAgent = buildAgentObject(agentName);
  const statusInfo = determineAgentStatus(agentName, filteredIssues);
  const locationInfo = determineAgentLocation(statusInfo.status);
  
  return {
    ...baseAgent,
    ...statusInfo,
    ...locationInfo
  };
}

/**
 * GET /api/agents/status
 * Получить статусы всех агентов с позициями
 */
router.get('/status', async (req, res) => {
  try {
    const startTime = Date.now();
    const agents = await getAllAgentsStatus();
    const responseTime = Date.now() - startTime;
    
    res.json({ 
      agents,
      zones: OFFICE_ZONES,
      meta: {
        timestamp: new Date().toISOString(),
        responseTimeMs: responseTime,
        issuesFetched: issuesCache.length,
        source: GITHUB_TOKEN ? 'github' : 'fallback'
      }
    });

  } catch (error) {
    console.error('[Agents API] Ошибка получения статусов:', error);
    res.status(500).json({
      error: 'Failed to fetch agent statuses',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/agents/status/:name
 * Получить статус конкретного агента
 */
router.get('/status/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!AGENTS_CONFIG[name]) {
      return res.status(404).json({
        error: 'Agent not found',
        availableAgents: Object.keys(AGENTS_CONFIG)
      });
    }
    
    const agent = await getAgentStatus(name);
    
    res.json({
      agent: agent.name,
      role: agent.role,
      project: agent.project,
      task: agent.task,
      progress: agent.progress,
      status: agent.status,
      location: agent.location,
      issues: agent.issues,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Agents API] Ошибка получения статуса агента:', error);
    res.status(500).json({
      error: 'Failed to fetch agent status',
      message: error.message
    });
  }
});

/**
 * GET /api/agents/zones
 * Получить зоны офиса
 */
router.get('/zones', (req, res) => {
  res.json({ 
    zones: OFFICE_ZONES,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/agents/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    githubTokenConfigured: !!GITHUB_TOKEN,
    timestamp: new Date().toISOString()
  });
});

// Экспортируем функции для WebSocket
module.exports = {
  router,
  getAllAgentsStatus,
  getAgentStatus,
  AGENTS_CONFIG
};

// Для standalone запуска (тестирование)
if (require.main === module) {
  const app = express();
  app.use(express.json());
  app.use('/api/agents', router);
  
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`Agents API server running on port ${PORT}`);
    console.log(`GitHub Token: ${GITHUB_TOKEN ? '✓ Настроен' : '✗ Не настроен (используем fallback)'}`);
  });
}
