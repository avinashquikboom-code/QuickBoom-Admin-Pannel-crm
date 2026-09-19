import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import api from '../api';

export interface FcmNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  route?: string;
}

class FcmWebService {
  private messaging: Messaging | null = null;
  private isInitialized = false;
  private currentToken: string | null = null;
  private unsubscribeOnMessage: (() => void) | null = null;

  private firebaseConfig = {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      'AIzaSyD4PdZi3Q8KAML8NojpsnzdHFuP_VEkA54',
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      'quikboom-crm-925d5.firebaseapp.com',
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'quikboom-crm-925d5',
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      'quikboom-crm-925d5.firebasestorage.app',
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      '325119319653',
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      '1:325119319653:web:9375042c4ead48710b708c',
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
      'G-S0BTYB3NB9',
  };

  /**
   * Check if the browser environment supports Notifications & ServiceWorkers
   */
  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Returns current Notification permission status ('granted', 'denied', or 'default')
   */
  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Initialize Firebase Web App & Firebase Messaging
   */
  public async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('[FCM] Push notifications are not supported in this browser environment.');
      return false;
    }

    if (this.isInitialized && this.messaging) {
      return true;
    }

    try {
      const app =
        getApps().length === 0
          ? initializeApp(this.firebaseConfig)
          : getApp();

      this.messaging = getMessaging(app);
      this.isInitialized = true;
      console.log('[FCM] Firebase initialized');
      return true;
    } catch (error: any) {
      console.error('[FCM] Firebase initialization error:', error?.message);
      return false;
    }
  }

  /**
   * Request browser notification permission explicitly
   */
  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const current = Notification.permission;
      if (current === 'granted') {
        console.log('[FCM] Notification permission: granted');
        return true;
      }

      if (current === 'denied') {
        console.warn(
          '[FCM] Notification permission: denied. Browser notifications are blocked. Please enable notifications for this site in your browser settings.',
        );
        return false;
      }

      const permission = await Notification.requestPermission();
      console.log(`[FCM] Notification permission result: ${permission}`);
      if (permission === 'denied') {
        console.warn(
          '[FCM] Notification permission was denied by the user. Please enable notifications in your browser address bar/settings.',
        );
      }
      return permission === 'granted';
    } catch (err: any) {
      console.error('[FCM] Error requesting notification permission:', err?.message || err);
      return false;
    }
  }

  /**
   * Generate/Retrieve FCM Web registration token
   */
  public async getOrGenerateToken(): Promise<string | null> {
    if (!this.isInitialized) {
      const ok = await this.initialize();
      if (!ok) return null;
    }

    if (!this.messaging) {
      console.warn('[FCM] Firebase Messaging instance not initialized');
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.warn(`[FCM] Cannot obtain FCM token: Notification.permission is "${Notification.permission}"`);
      return null;
    }

    try {
      // Ensure Service Worker is registered with scope '/'
      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;
        console.log('[FCM] Service Worker ready with scope:', registration.scope);
      } catch (swErr: any) {
        console.warn('[FCM] Failed to register /firebase-messaging-sw.js:', swErr?.message || swErr);
        return null;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || undefined;
      if (!vapidKey) {
        console.warn(
          '[FCM] Notice: NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. Web Push requires a public VAPID key pair from Firebase Console (Project Settings -> Cloud Messaging -> Web Push certificates).',
        );
      }

      let token: string | null = null;
      try {
        token = await getToken(this.messaging, {
          serviceWorkerRegistration: registration,
          ...(vapidKey ? { vapidKey } : {}),
        });
      } catch (initialErr: any) {
        console.warn('[FCM] Initial getToken attempt failed:', initialErr?.code || initialErr?.name, initialErr?.message);

        // If push service error, clean up any existing stale/corrupted subscription and retry
        if (
          initialErr?.message?.includes('push service error') ||
          initialErr?.message?.includes('Registration failed') ||
          initialErr?.code === 'messaging/token-unsubscribe-failed'
        ) {
          try {
            console.log('[FCM] Inspecting existing push subscriptions for reset...');
            const existingSub = await registration.pushManager?.getSubscription();
            if (existingSub) {
              await existingSub.unsubscribe();
              console.log('[FCM] Stale push subscription successfully unsubscribed. Retrying getToken...');
              token = await getToken(this.messaging, {
                serviceWorkerRegistration: registration,
                ...(vapidKey ? { vapidKey } : {}),
              });
            }
          } catch (retryErr: any) {
            console.error('[FCM] Push subscription reset retry failed:', retryErr?.message || retryErr);
          }
        } else {
          throw initialErr;
        }
      }

      if (token) {
        this.currentToken = token;
        console.log('[FCM] Token generated successfully (length: ' + token.length + ')');
        return token;
      } else {
        console.warn('[FCM] No registration token returned by Firebase.');
        return null;
      }
    } catch (error: any) {
      console.error('[FCM] Failed to obtain FCM token:', {
        name: error?.name,
        code: error?.code,
        message: error?.message,
        permission: typeof window !== 'undefined' ? Notification.permission : 'unknown',
        hasVapidKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()),
      });
      return null;
    }
  }

  /**
   * Register the device token with the backend API
   */
  public async registerTokenWithBackend(token: string): Promise<boolean> {
    const cleanToken = token?.trim();
    if (!cleanToken) return false;

    try {
      // Check if already registered in current session to prevent redundant network calls
      const lastRegistered = sessionStorage.getItem('fcm_admin_device_token');
      if (lastRegistered === cleanToken) {
        return true;
      }

      await api.post('/notifications/device-token', {
        token: cleanToken,
        platform: 'WEB',
        deviceType: 'ADMIN_PANEL',
      });

      sessionStorage.setItem('fcm_admin_device_token', cleanToken);
      this.currentToken = cleanToken;
      console.log('[FCM] Token registered');
      return true;
    } catch (error: any) {
      console.error('[FCM] Failed to register token with backend:', error?.response?.data || error?.message);
      return false;
    }
  }

  /**
   * Unregister token on Admin logout
   */
  public async unregisterTokenFromBackend(): Promise<void> {
    const token = this.currentToken || sessionStorage.getItem('fcm_admin_device_token');
    if (!token) return;

    try {
      await api.delete('/notifications/device-token', {
        data: { token },
      });
      console.log('[FCM] Token unregistered on logout');
    } catch (e: any) {
      console.warn('[FCM] Non-fatal: Failed to unregister device token on logout:', e?.message);
    } finally {
      sessionStorage.removeItem('fcm_admin_device_token');
      this.currentToken = null;
    }
  }

  /**
   * Full authentication setup flow:
   * 1. Initialize FCM
   * 2. If permission granted, obtain token and register with backend
   * 3. Set up foreground push listener
   */
  public async setupAfterAuth(onNotificationReceived?: (payload: FcmNotificationPayload) => void): Promise<void> {
    if (!this.isSupported()) return;

    const ok = await this.initialize();
    if (!ok) return;

    // Set up foreground message listener
    this.setupForegroundListener(onNotificationReceived);

    // If permission is already granted, proceed silently to get and sync token
    if (Notification.permission === 'granted') {
      const token = await this.getOrGenerateToken();
      if (token) {
        await this.registerTokenWithBackend(token);
      }
    }
  }

  /**
   * Set up foreground notification listener using Firebase onMessage
   */
  public setupForegroundListener(onNotificationReceived?: (payload: FcmNotificationPayload) => void): void {
    if (!this.messaging) return;

    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
      this.unsubscribeOnMessage = null;
    }

    this.unsubscribeOnMessage = onMessage(this.messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);

      const title = payload.notification?.title || payload.data?.title || 'System Alert';
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        payload.data?.message ||
        'New update received.';
      const route = payload.data?.route || payload.data?.click_action || '/notifications';

      const parsedNotification: FcmNotificationPayload = {
        title,
        body,
        data: payload.data,
        route,
      };

      if (onNotificationReceived) {
        onNotificationReceived(parsedNotification);
      }
    });
  }

  public cleanup(): void {
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
      this.unsubscribeOnMessage = null;
    }
  }
}

export const fcmWebService = new FcmWebService();
