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
const TEST_MODE = process.env.TEST_MODE === 'true';

// Тестовые данные для E2E тестов
const TEST_AGENTS_DATA = [
  {
    id: '3',
    name: 'Иван',
    role: 'QA инженер',
    emoji: '👨‍🔬',
    deskId: '3',
    status: 'working',
    location: 'work-zone',
    task: 'Тестирование Issue #15',
    project: 'Meetify',
    progress: 50,
    issues: [
      { number: 15, title: 'Bug: Login page error', state: 'open', repo: 'dkyitdevops/meetify' }
    ],
    openIssuesCount: 1,
    closedIssuesCount: 0
  },
  {
    id: 'elena',
    name: 'Елена',
    role: 'КЭП ТСО',
    emoji: '👩‍💼',
    deskId: null,
    status: 'resting',
    location: 'rest-room',
    task: 'Ожидание вопросов',
    project: null,
    progress: 0,
    issues: [],
    openIssuesCount: 0,
    closedIssuesCount: 0
  },
  {
    id: 'sergey',
    name: 'Сергей',
    role: 'Backend разработчик',
    emoji: '👨‍💻',
    deskId: null,
    status: 'resting',
    location: 'rest-room',
    task: 'Перерыв',
    project: null,
    progress: 0,
    issues: [],
    openIssuesCount: 0,
    closedIssuesCount: 0
  }
];

// Репозитории для получения issues
const REPOS = [
  'dkyitdevops/meetify',
  'dkyitdevops/ai-team-office'
];

// Список агентов с их GitHub usernames и ролями
// Обновлено: 2026-03-25 — соответствие SESSION_STATE.md
const AGENTS_CONFIG = {
  'agent-001': { 
    githubUsername: null,
    name: 'UI Designer',
    role: 'UI Designer', 
    emoji: '🎨',
    deskId: '1',
    currentTask: 'Meetify #47, #44; AI Office #24, #11, #3',
    project: 'Meetify / AI Office',
    status: 'working'
  },
  'agent-002': { 
    githubUsername: null,
    name: 'Frontend Developer',
    role: 'Frontend Developer', 
    emoji: '⚡',
    deskId: '2',
    currentTask: 'Meetify #47, #44, #43, #41, #40; AI Office #24, #3',
    project: 'Meetify / AI Office',
    status: 'working'
  },
  'agent-003': { 
    githubUsername: null,
    name: 'Backend Developer',
    role: 'Backend Developer', 
    emoji: '🔧',
    deskId: '3',
    currentTask: 'Meetify #44, #43',
    project: 'Meetify',
    status: 'working'
  },
  'agent-004': { 
    githubUsername: null,
    name: 'QA Engineer',
    role: 'QA Engineer', 
    emoji: '🧪',
    deskId: '4',
    currentTask: 'Meetify #40; AI Office #5',
    project: 'Meetify / AI Office',
    status: 'working'
  },
  'agent-005': { 
    githubUsername: null,
    name: 'DevOps Engineer',
    role: 'DevOps Engineer', 
    emoji: '🚀',
    deskId: '5',
    currentTask: 'Деплой',
    project: 'Meetify',
    status: 'working'
  },
  'agent-006': { 
    githubUsername: null,
    name: 'Security Engineer',
    role: 'Security Engineer', 
    emoji: '🛡️',
    deskId: '6',
    currentTask: 'Свободен',
    project: null,
    status: 'resting'
  },
  'agent-007': {
    githubUsername: null,
    name: 'Unix Engineer',
    role: 'Unix Engineer',
    emoji: '🐧',
    deskId: null,
    currentTask: 'Свободен',
    project: null,
    status: 'resting'
  },
  'agent-008': {
    githubUsername: null,
    name: 'Аналитик',
    role: 'Аналитик (КЭП ТСО)',
    emoji: '📊',
    deskId: null,
    currentTask: 'ТЗ написано',
    project: null,
    status: 'resting'
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
 * Определить статус агента на основе конфигурации
 * Issue #24: Статус берётся напрямую из AGENTS_CONFIG
 */
function determineAgentStatus(agentId, issues) {
  const config = AGENTS_CONFIG[agentId];
  if (!config) {
    return { status: 'resting', issues: [], project: null, task: null, progress: 0 };
  }

  // Issue #19: Используем унифицированную фильтрацию
  const assignedIssues = filterIssuesForAgent(issues, agentId);

  // Открытые и закрытые issues
  const openIssues = assignedIssues.filter(i => i.state === 'open');
  const closedIssues = assignedIssues.filter(i => i.state === 'closed');
  
  // Вычисляем прогресс: closed / (open + closed) * 100
  const totalIssues = openIssues.length + closedIssues.length;
  const progress = totalIssues > 0 
    ? Math.round((closedIssues.length / totalIssues) * 100)
    : 0;
  
  // Статус берём из конфига, а не из issues
  const status = config.status || (openIssues.length > 0 ? 'working' : 'resting');
  
  return {
    status: status,
    issues: assignedIssues.map(i => ({ 
      number: i.number, 
      title: i.title,
      state: i.state,
      repo: i.repository 
    })),
    openIssuesCount: openIssues.length,
    closedIssuesCount: closedIssues.length,
    project: config.project,
    task: config.currentTask,
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
 * Issue #24: Исправлено — статус берётся из конфига агента
 */
function buildAgentObject(agentId) {
  const config = AGENTS_CONFIG[agentId];
  if (!config) return null;

  return {
    id: agentId,
    name: config.name,
    role: config.role,
    emoji: config.emoji,
    deskId: config.deskId,
    status: config.status,
    currentTask: config.currentTask,
    project: config.project
  };
}

/**
 * Получить статусы всех агентов
 * Issue #24: Исправлено — статус берётся из конфига
 */
async function getAllAgentsStatus() {
  // В тестовом режиме возвращаем тестовые данные
  if (TEST_MODE) {
    console.log('[Agents API] Returning test data');
    return TEST_AGENTS_DATA;
  }
  
  const issues = await getGitHubIssues();
  const filteredIssues = issues.filter(issue => !issue.pull_request);
  
  const agents = Object.keys(AGENTS_CONFIG).map(agentId => {
    const baseAgent = buildAgentObject(agentId);
    const statusInfo = determineAgentStatus(agentId, filteredIssues);
    const locationInfo = determineAgentLocation(statusInfo.status);
    
    return {
      ...baseAgent,
      ...statusInfo,
      ...locationInfo
    };
  });
  
  // Сортируем: сначала working (по deskId), потом resting
  agents.sort((a, b) => {
    if (a.status === 'working' && b.status !== 'working') return -1;
    if (a.status !== 'working' && b.status === 'working') return 1;
    // Сортируем по deskId внутри группы
    const deskA = parseInt(a.deskId) || 99;
    const deskB = parseInt(b.deskId) || 99;
    return deskA - deskB;
  });
  
  return agents;
}

/**
 * Получить статус конкретного агента
 * Использует прямой запрос по label agent:{agentId}
 * Issue #24: Исправлено — статус берётся из конфига
 */
async function getAgentStatus(agentId) {
  if (!AGENTS_CONFIG[agentId]) {
    return null;
  }
  
  // В тестовом режиме возвращаем тестовые данные
  if (TEST_MODE) {
    const testAgent = TEST_AGENTS_DATA.find(a => a.id === agentId);
    if (testAgent) {
      return {
        agent: testAgent.name,
        role: testAgent.role,
        project: testAgent.project,
        task: testAgent.task,
        progress: testAgent.progress,
        status: testAgent.status,
        location: testAgent.location,
        issues: testAgent.issues
      };
    }
  }
  
  // Получаем issues по label agent:{agentId} напрямую из API
  const issues = await getGitHubIssuesForAgent(agentId);
  const filteredIssues = issues.filter(issue => !issue.pull_request);
  
  const baseAgent = buildAgentObject(agentId);
  const statusInfo = determineAgentStatus(agentId, filteredIssues);
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
 * GET /api/agents/status/:agentId
 * Получить статус конкретного агента
 */
router.get('/status/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    if (!AGENTS_CONFIG[agentId]) {
      return res.status(404).json({
        error: 'Agent not found',
        availableAgents: Object.keys(AGENTS_CONFIG)
      });
    }
    
    const agent = await getAgentStatus(agentId);
    
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
