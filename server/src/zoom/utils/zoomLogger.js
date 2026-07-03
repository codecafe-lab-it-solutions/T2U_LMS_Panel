const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT = LEVELS[process.env.LOG_LEVEL || 'info'] ?? 1;

function log(level, event, meta = {}) {
  if (LEVELS[level] < CURRENT) return;

  const entry = {
    ts: new Date().toISOString(),
    level: level.toUpperCase(),
    svc: 'Zoom',
    event,
    ...meta,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

const logger = {
  debug: (event, meta) => log('debug', event, meta),
  info:  (event, meta) => log('info',  event, meta),
  warn:  (event, meta) => log('warn',  event, meta),
  error: (event, meta) => log('error', event, meta),
};

module.exports = logger;
