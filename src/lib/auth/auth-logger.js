'use client';

const AUTH_LOG_STORAGE_KEY = 'qb_auth_debug_logs';
const MAX_AUTH_LOGS = 100;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  LOGIN_FAILED: 'AUTH_LOGIN_FAILED',
  SESSION_INITIALIZED: 'AUTH_SESSION_INITIALIZED',
  ACCESS_TOKEN_EXPIRED: 'AUTH_ACCESS_TOKEN_EXPIRED',
  REFRESH_STARTED: 'AUTH_REFRESH_STARTED',
  REFRESH_SUCCESS: 'AUTH_REFRESH_SUCCESS',
  REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  SESSION_REVOKED: 'AUTH_SESSION_REVOKED',
  LOGOUT_TRIGGERED: 'AUTH_LOGOUT_TRIGGERED',
  ROUTE_GUARD_REDIRECT: 'AUTH_ROUTE_GUARD_REDIRECT',
  PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
  NETWORK_ERROR: 'AUTH_NETWORK_ERROR',
};

const SENSITIVE_FIELD_RE = /password|token|secret|authorization|cookie|otp|apikey/i;

function sanitizeMeta(meta = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(meta || {})) {
    if (value === undefined) continue;
    if (SENSITIVE_FIELD_RE.test(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeMeta(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function createCorrelationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 12);
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const memoryBuffer = [];

export function logAuthEvent(event, meta = {}) {
  const entry = {
    event,
    timestamp: new Date().toISOString(),
    correlationId: meta.correlationId || createCorrelationId(),
    appVersion: APP_VERSION,
    environment: ENVIRONMENT,
    ...sanitizeMeta(meta),
  };

  memoryBuffer.push(entry);
  if (memoryBuffer.length > MAX_AUTH_LOGS) {
    memoryBuffer.shift();
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(AUTH_LOG_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? [...list, entry].slice(-MAX_AUTH_LOGS) : [entry];
      window.sessionStorage.setItem(AUTH_LOG_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('qb-auth-log', { detail: entry }));
    } catch {
      // Ignore storage quota / private mode errors
    }

    if (ENVIRONMENT !== 'production' || window.localStorage?.getItem('qb_auth_debug') === '1') {
      const level = /FAILED|EXPIRED|REVOKED|ERROR|DENIED/.test(event) ? 'warn' : 'info';
      console[level](`[QB_AUTH] ${event}`, entry);
    }
  }

  return entry;
}

export function getAuthDebugLogs() {
  if (typeof window === 'undefined') return [...memoryBuffer];
  try {
    const raw = window.sessionStorage.getItem(AUTH_LOG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) && parsed.length ? parsed : [...memoryBuffer];
  } catch {
    return [...memoryBuffer];
  }
}

export function clearAuthDebugLogs() {
  memoryBuffer.length = 0;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(AUTH_LOG_STORAGE_KEY);
    } catch {}
  }
}
