// WardWell EHR - Authentication & Access Gate (Visual Gate Only)
import { CONFIG } from './config.js';
import { Logger } from './utils/logger.js';

const SESSION_KEY = 'wardwell:session_auth';
const FAILED_COUNT_KEY = 'wardwell:failed_attempts';
const COOLDOWN_UNTIL_KEY = 'wardwell:cooldown_until';

let inactivityTimer = null;
let inactivityWarnTimer = null;
let cooldownInterval = null;

// SHA-256 helper via Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const Auth = {
  isAuthenticated() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  },

  async login(password) {
    // Check cooldown
    const cooldownUntil = parseInt(sessionStorage.getItem(COOLDOWN_UNTIL_KEY) || '0', 10);
    const now = Date.now();
    if (cooldownUntil > now) {
      const remaining = Math.ceil((cooldownUntil - now) / 1000);
      return { success: false, reason: 'cooldown', remainingSeconds: remaining };
    }

    const hashedInput = await sha256(password);
    if (hashedInput === CONFIG.PASSWORD_HASH) {
      // Success
      sessionStorage.setItem(SESSION_KEY, '1');
      sessionStorage.removeItem(FAILED_COUNT_KEY);
      sessionStorage.removeItem(COOLDOWN_UNTIL_KEY);
      Logger.info('Auth', 'login', 'User logged in successfully.');
      this.startInactivityTracker();
      window.dispatchEvent(new CustomEvent('ww:auth-change', { detail: { authenticated: true } }));
      return { success: true };
    } else {
      // Wrong password
      const currentFails = parseInt(sessionStorage.getItem(FAILED_COUNT_KEY) || '0', 10) + 1;
      sessionStorage.setItem(FAILED_COUNT_KEY, currentFails.toString());
      Logger.warn('Auth', 'login', `Invalid password attempt (#${currentFails})`);

      if (currentFails >= CONFIG.MAX_FAILED_ATTEMPTS) {
        const cooldownTime = Date.now() + CONFIG.COOLDOWN_SECONDS * 1000;
        sessionStorage.setItem(COOLDOWN_UNTIL_KEY, cooldownTime.toString());
        sessionStorage.setItem(FAILED_COUNT_KEY, '0');
        return { success: false, reason: 'cooldown', remainingSeconds: CONFIG.COOLDOWN_SECONDS };
      }

      return {
        success: false,
        reason: 'invalid',
        attemptsLeft: CONFIG.MAX_FAILED_ATTEMPTS - currentFails
      };
    }
  },

  getCooldownRemaining() {
    const cooldownUntil = parseInt(sessionStorage.getItem(COOLDOWN_UNTIL_KEY) || '0', 10);
    const now = Date.now();
    if (cooldownUntil > now) {
      return Math.ceil((cooldownUntil - now) / 1000);
    }
    return 0;
  },

  logout(reason = 'manual') {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      Logger.warn('Auth', 'logout', 'Failed clearing session', e);
    }
    this.stopInactivityTracker();
    Logger.info('Auth', 'logout', `User logged out (reason: ${reason}).`);
    window.dispatchEvent(new CustomEvent('ww:auth-change', { detail: { authenticated: false, reason } }));
  },

  startInactivityTracker() {
    this.stopInactivityTracker();
    this.resetInactivityTimers();

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    const onActivity = () => {
      if (this.isAuthenticated()) {
        this.resetInactivityTimers();
      }
    };

    activityEvents.forEach(evt => {
      window.addEventListener(evt, onActivity, { passive: true });
    });
  },

  resetInactivityTimers() {
    clearTimeout(inactivityTimer);
    clearTimeout(inactivityWarnTimer);

    // Warning 1 minute before lock
    inactivityWarnTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ww:inactivity-warning', {
        detail: { message: 'Session will lock in 1 minute due to inactivity.' }
      }));
    }, CONFIG.INACTIVITY_WARN_MS);

    // Auto-lock
    inactivityTimer = setTimeout(() => {
      this.logout('inactivity');
    }, CONFIG.INACTIVITY_TIMEOUT_MS);
  },

  stopInactivityTracker() {
    clearTimeout(inactivityTimer);
    clearTimeout(inactivityWarnTimer);
  }
};
