'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  readSession,
  readSessionMeta,
  touchSessionActivity,
  subscribeAuthMessages,
  broadcastAuthMessage,
} from '@/lib/auth/admin-session';
import { logoutAdmin } from '@/lib/auth/admin-login';
import { AUTH_EVENTS, logAuthEvent } from '@/lib/auth/auth-logger';
import { performTokenRefresh, getPersistedAuthSession, safeDecodeJwtPayload } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';

const WARNING_LEAD_SECONDS = 120;
const DEFAULT_INACTIVITY_SECONDS = 1800;

export function AuthSessionManager({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [initializing, setInitializing] = React.useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = React.useState(false);
  const [countdownSeconds, setCountdownSeconds] = React.useState(WARNING_LEAD_SECONDS);
  const [extendingSession, setExtendingSession] = React.useState(false);
  const [connectionBanner, setConnectionBanner] = React.useState(false);
  const lastActivityRef = React.useRef(Date.now());

  // 1. Initialize & restore session cleanly on mount / page refresh
  React.useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        if (!useAuthStore.persist.hasHydrated()) {
          await useAuthStore.persist.rehydrate();
        }
        const persisted = getPersistedAuthSession();
        const local = readSession();
        const token = persisted?.token || local?.token;
        const refreshToken = persisted?.refreshToken || local?.refreshToken;

        if (token && refreshToken) {
          const decoded = safeDecodeJwtPayload(token);
          if (decoded?.exp && decoded.exp * 1000 <= Date.now() + 15000) {
            await performTokenRefresh().catch(() => null);
          }
        }

        const finalSession = getPersistedAuthSession();
        logAuthEvent(AUTH_EVENTS.SESSION_INITIALIZED, {
          userId: finalSession?.user?.id || null,
          hasToken: Boolean(finalSession?.token),
          pathname,
        });
      } finally {
        if (active) setInitializing(false);
      }
    }

    initSession();
    return () => {
      active = false;
    };
  }, []);

  // 2. Cross-tab synchronization via BroadcastChannel & storage events
  React.useEffect(() => {
    const unsubscribe = subscribeAuthMessages((msg) => {
      if (!msg?.type) return;
      if (msg.type === 'LOGOUT') {
        logAuthEvent(AUTH_EVENTS.ROUTE_GUARD_REDIRECT, {
          reason: 'CROSS_TAB_LOGOUT',
          pathname,
        });
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          router.replace('/login');
        }
      } else if (msg.type === 'TOKEN_REFRESHED' || msg.type === 'LOGIN') {
        getPersistedAuthSession();
        setShowExpiryWarning(false);
      } else if (msg.type === 'SESSION_EXTENDED') {
        lastActivityRef.current = Date.now();
        setShowExpiryWarning(false);
      }
    });

    const onConnectionError = () => setConnectionBanner(true);
    window.addEventListener('qb-api-connection-error', onConnectionError);

    return () => {
      unsubscribe();
      window.removeEventListener('qb-api-connection-error', onConnectionError);
    };
  }, [pathname, router]);

  // 3. Activity tracking & inactivity warning modal
  React.useEffect(() => {
    if (initializing) return;

    let throttleTimer = null;
    const markActive = () => {
      if (showExpiryWarning) return;
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 5000);
      lastActivityRef.current = Date.now();
      touchSessionActivity();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, markActive, { passive: true }));

    const interval = setInterval(() => {
      const session = getPersistedAuthSession();
      if (!session?.token) return;

      const meta = readSessionMeta();
      const timeoutSeconds =
        Number(meta?.sessionPolicy?.inactivityTimeoutSeconds) || DEFAULT_INACTIVITY_SECONDS;
      if (timeoutSeconds <= 0) return;

      const lastActive = Math.max(lastActivityRef.current, Number(meta?.lastActivityAt || 0));
      const elapsedSeconds = Math.floor((Date.now() - lastActive) / 1000);
      const remainingSeconds = timeoutSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        setShowExpiryWarning(false);
        logAuthEvent(AUTH_EVENTS.SESSION_EXPIRED, {
          userId: session?.user?.id,
          logoutReason: 'INACTIVITY_TIMEOUT',
        });
        logoutAdmin().finally(() => {
          router.replace('/login?reason=session_expired');
        });
      } else if (remainingSeconds <= WARNING_LEAD_SECONDS) {
        setCountdownSeconds(remainingSeconds);
        setShowExpiryWarning(true);
      } else if (showExpiryWarning) {
        setShowExpiryWarning(false);
      }
    }, 1000);

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      events.forEach((evt) => window.removeEventListener(evt, markActive));
      clearInterval(interval);
    };
  }, [initializing, router, showExpiryWarning]);

  const handleStaySignedIn = async () => {
    setExtendingSession(true);
    try {
      await performTokenRefresh();
      lastActivityRef.current = Date.now();
      touchSessionActivity();
      broadcastAuthMessage('SESSION_EXTENDED');
      setShowExpiryWarning(false);
    } catch {
      // If transient error, keep user in app with connection banner
    } finally {
      setExtendingSession(false);
    }
  };

  const handleSignOut = async () => {
    setShowExpiryWarning(false);
    await logoutAdmin();
    router.replace('/login');
  };

  if (initializing) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#F3F8F5] px-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E2E8E5] bg-white px-8 py-6 shadow-sm">
          <div className="size-9 animate-spin rounded-full border-3 border-[#E8F1EC] border-t-[#123D32]" />
          <p className="text-sm font-semibold text-[#142D25]">Restoring your QB Suite session...</p>
          <p className="text-xs text-[#64748B]">Verifying workspace permissions</p>
        </div>
      </div>
    );
  }

  const mins = String(Math.floor(countdownSeconds / 60)).padStart(2, '0');
  const secs = String(countdownSeconds % 60).padStart(2, '0');

  return (
    <>
      {connectionBanner ? (
        <div
          role="status"
          className="fixed right-4 bottom-4 z-[90] flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 shadow-lg"
        >
          <span>Temporary server or network issue. Your session remains active.</span>
          <button
            type="button"
            onClick={() => {
              setConnectionBanner(false);
              window.location.reload();
            }}
            className="rounded-lg bg-[#123D32] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#176B50]"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setConnectionBanner(false)}
            className="text-amber-700 hover:text-amber-950"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ) : null}

      {showExpiryWarning ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-expiry-heading"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8E5] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Session Timeout Warning
              </span>
              <span className="font-mono text-sm font-bold text-[#123D32]">
                {mins}:{secs}
              </span>
            </div>
            <h3 id="session-expiry-heading" className="mt-3 text-lg font-bold text-[#142D25]">
              Your session is about to expire.
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">
              For security reasons, your session will expire soon. Continue your session to stay signed in.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-[#E2E8E5] px-4 py-2 text-sm font-semibold text-[#64748B] transition hover:bg-slate-50 hover:text-[#142D25]"
              >
                Sign Out
              </button>
              <button
                type="button"
                disabled={extendingSession}
                onClick={handleStaySignedIn}
                className="rounded-xl bg-[#123D32] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#176B50] disabled:opacity-60"
              >
                {extendingSession ? 'Extending...' : 'Stay Signed In'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {children}
    </>
  );
}
