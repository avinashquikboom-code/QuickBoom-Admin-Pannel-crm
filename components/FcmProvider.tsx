'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { fcmWebService, FcmNotificationPayload } from '@/lib/services/fcm.service';
import { useQueryClient } from '@tanstack/react-query';
import { BellRing, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function FcmProvider() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [showPromptBanner, setShowPromptBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleNotificationReceived = useCallback((payload?: FcmNotificationPayload) => {
    // Invalidate react-query cache for admin notifications so in-app feed updates immediately
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });

    if (!payload) return;

    const title = payload.title || 'System Alert';
    const body = payload.body || 'New update received.';
    const route = payload.route || '/notifications';

    toast(
      (t) => (
        <div
          className="flex items-start gap-3 cursor-pointer select-none"
          onClick={() => {
            toast.dismiss(t.id);
            if (typeof window !== 'undefined' && route) {
              window.location.href = route;
            }
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 flex items-center justify-center font-bold text-xs shrink-0">
            🔔
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 leading-tight">{title}</p>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{body}</p>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-right',
        style: {
          borderRadius: '16px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '12px 14px',
        },
      }
    );
  }, [queryClient]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      fcmWebService.cleanup();
      return;
    }

    if (!fcmWebService.isSupported()) {
      return;
    }

    // Initialize FCM and setup foreground listener
    fcmWebService.setupAfterAuth(handleNotificationReceived);

    // If permission has not been decided yet, show opt-in banner
    const currentPermission = fcmWebService.getPermissionStatus();
    if (currentPermission === 'default') {
      const dismissed = sessionStorage.getItem('fcm_prompt_dismissed');
      if (!dismissed) {
        // Delay slightly for smooth page load
        const timer = setTimeout(() => {
          setShowPromptBanner(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user, handleNotificationReceived]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const granted = await fcmWebService.requestPermission();
      if (granted) {
        toast.success('Push notifications enabled for Admin Panel!', { icon: '🔔' });
        const token = await fcmWebService.getOrGenerateToken();
        if (token) {
          await fcmWebService.registerTokenWithBackend(token);
        }
        setShowPromptBanner(false);
      } else {
        toast('Notifications are disabled in browser settings.', { icon: 'ℹ️' });
        setShowPromptBanner(false);
      }
    } catch (e) {
      console.error('[FCM] Error requesting permission:', e);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPromptBanner(false);
    sessionStorage.setItem('fcm_prompt_dismissed', 'true');
  };

  if (!showPromptBanner) {
    return null;
  }

  return (
    <aside
      aria-label="Notification Permission"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white border border-emerald-200 rounded-3xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#E8F9EE] text-[#1AA14D] border border-[#23C45E]/30 flex items-center justify-center shrink-0">
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-slate-900 leading-tight">
            Enable Push Notifications
          </h4>
          <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
            Receive real-time alerts for new customers, plan purchases, and critical events.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              className="px-3.5 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isRequesting ? 'Enabling...' : 'Allow Alerts'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
