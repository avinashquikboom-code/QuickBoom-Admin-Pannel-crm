'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacyCrmEmailTemplatesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/templates/email');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
      <p className="text-sm font-semibold">Redirecting to Templates / Email Templates...</p>
    </div>
  );
}
