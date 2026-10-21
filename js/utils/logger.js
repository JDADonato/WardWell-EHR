// Centralized Logger for WardWell EHR
import { CONFIG } from '../config.js';

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

function shouldLog(level) {
  const currentThreshold = LEVELS[CONFIG.LOG_LEVEL] ?? 0;
  return (LEVELS[level] ?? 0) >= currentThreshold;
}

function formatPrefix(level, moduleName, action) {
  const ts = new Date().toISOString().substring(11, 23);
  return `[${ts}] [${level.toUpperCase()}] [${moduleName}${action ? `::${action}` : ''}]`;
}

export const Logger = {
  debug(moduleName, action, message, data = null) {
    if (!shouldLog('debug')) return;
    const prefix = formatPrefix('debug', moduleName, action);
    if (data !== null) console.debug(prefix, message, data);
    else console.debug(prefix, message);
  },

  info(moduleName, action, message, data = null) {
    if (!shouldLog('info')) return;
    const prefix = formatPrefix('info', moduleName, action);
    if (data !== null) console.info(prefix, message, data);
    else console.info(prefix, message);
  },

  warn(moduleName, action, message, data = null) {
    if (!shouldLog('warn')) return;
    const prefix = formatPrefix('warn', moduleName, action);
    if (data !== null) console.warn(prefix, message, data);
    else console.warn(prefix, message);
  },

  error(moduleName, action, message, error = null) {
    if (!shouldLog('error')) return;
    const prefix = formatPrefix('error', moduleName, action);
    if (error !== null) console.error(prefix, message, error);
    else console.error(prefix, message);
  }
};
