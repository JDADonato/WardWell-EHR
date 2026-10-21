// WardWell EHR - Storage Service Layer with Schema Versioning & Fallbacks
import { CONFIG } from './config.js';
import { Logger } from './utils/logger.js';

let isMemoryFallback = false;
const memoryStore = new Map();

function isLocalStorageAvailable() {
  try {
    const testKey = '__ww_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    Logger.warn('Storage', 'check', 'localStorage unavailable (private mode or disabled)', e);
    return false;
  }
}

if (!isLocalStorageAvailable()) {
  isMemoryFallback = true;
  Logger.warn('Storage', 'init', 'Using in-memory fallback storage.');
}

export const StorageService = {
  isFallback() {
    return isMemoryFallback;
  },

  get(key, defaultValue = null) {
    try {
      if (isMemoryFallback) {
        return memoryStore.has(key) ? memoryStore.get(key) : defaultValue;
      }
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (err) {
      Logger.error('Storage', 'get', `Failed to parse JSON for key "${key}"`, err);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      if (isMemoryFallback) {
        memoryStore.set(key, value);
        return true;
      }
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (err) {
      // QuotaExceededError check
      if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
        Logger.error('Storage', 'set', 'Storage quota exceeded!', err);
        window.dispatchEvent(new CustomEvent('ww:storage-quota-exceeded'));
      } else {
        Logger.error('Storage', 'set', `Failed to set key "${key}"`, err);
      }
      return false;
    }
  },

  remove(key) {
    try {
      if (isMemoryFallback) {
        memoryStore.delete(key);
        return true;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      Logger.error('Storage', 'remove', `Failed to remove key "${key}"`, err);
      return false;
    }
  },

  getUsage() {
    try {
      if (isMemoryFallback) {
        return { usedKb: 0, count: memoryStore.size, isFallback: true };
      }
      let totalBytes = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        const val = window.localStorage.getItem(key);
        if (key && val) {
          totalBytes += (key.length + val.length) * 2; // UTF-16
        }
      }
      return {
        usedKb: (totalBytes / 1024).toFixed(2),
        count: window.localStorage.length,
        isFallback: false
      };
    } catch (err) {
      Logger.warn('Storage', 'getUsage', 'Failed to calculate storage usage', err);
      return { usedKb: 0, count: 0, isFallback: isMemoryFallback };
    }
  },

  migrate() {
    const currentVersion = this.get(CONFIG.STORAGE_KEYS.SCHEMA, 0);
    if (currentVersion < CONFIG.SCHEMA_VERSION) {
      Logger.info('Storage', 'migrate', `Migrating schema from ${currentVersion} to ${CONFIG.SCHEMA_VERSION}`);
      // Migration hooks can go here if schema evolves
      this.set(CONFIG.STORAGE_KEYS.SCHEMA, CONFIG.SCHEMA_VERSION);
    }
  }
};
