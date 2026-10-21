// WardWell EHR - Hash-based Client-Side Router
import { Auth } from './auth.js';
import { Logger } from './utils/logger.js';

let routes = [];
let notFoundHandler = null;

export const Router = {
  add(pattern, handler) {
    routes.push({ pattern, handler });
  },

  setNotFound(handler) {
    notFoundHandler = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  getHash() {
    return window.location.hash.slice(1) || '/patients';
  },

  resolve() {
    let hash = this.getHash();
    if (!hash.startsWith('/')) hash = '/' + hash;

    Logger.debug('Router', 'resolve', `Resolving route: ${hash}`);

    // Auth gate check
    if (!Auth.isAuthenticated()) {
      if (hash !== '/login') {
        Logger.info('Router', 'resolve', 'Unauthenticated user redirected to /login');
        this.navigate('/login');
        return;
      }
    } else {
      if (hash === '/login') {
        Logger.info('Router', 'resolve', 'Authenticated user redirected from /login to /patients');
        this.navigate('/patients');
        return;
      }
    }

    // Match routes
    for (const route of routes) {
      const match = this.matchRoute(route.pattern, hash);
      if (match) {
        route.handler(match.params);
        return;
      }
    }

    if (notFoundHandler) {
      notFoundHandler(hash);
    } else {
      Logger.warn('Router', 'resolve', `No route found for ${hash}`);
    }
  },

  matchRoute(pattern, path) {
    const patternSegments = pattern.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);

    if (patternSegments.length !== pathSegments.length) {
      return null;
    }

    const params = {};
    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i].startsWith(':')) {
        const paramName = patternSegments[i].slice(1);
        params[paramName] = decodeURIComponent(pathSegments[i]);
      } else if (patternSegments[i] !== pathSegments[i]) {
        return null;
      }
    }

    return { params };
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    if (document.readyState === 'complete') {
      this.resolve();
    } else {
      window.addEventListener('load', () => this.resolve());
      // Also resolve on DOMContentLoaded as fallback
      window.addEventListener('DOMContentLoaded', () => this.resolve());
    }
  }
};
