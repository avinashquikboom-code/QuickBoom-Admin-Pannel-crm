'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalarySlipsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/payroll?tab=slips');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs font-bold text-slate-500">
      Redirecting to Consolidated Payroll Slips Submodule...
    </div>
  );
}
