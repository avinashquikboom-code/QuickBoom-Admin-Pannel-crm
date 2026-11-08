'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/notifications');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-xs font-bold animate-pulse">
      Redirecting to Notification Center...
    </div>
  );
}
