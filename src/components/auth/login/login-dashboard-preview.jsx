'use client';

import { Layers } from 'lucide-react';
import { LOGIN_BRAND } from './login-branding-panel';

const NAV = ['Dashboard', 'HRM', 'CRM', 'Finance', 'Reports'];

export function LoginDashboardPreview() {
  return (
    <div className="relative w-full max-w-[440px] pb-2">
      {/* Laptop bezel */}
      <div
        className="relative overflow-hidden rounded-t-[20px] rounded-b-[6px] border border-white/25 p-[10px] pb-2 shadow-[0_28px_70px_rgba(0,0,0,0.45)]"
        style={{
          background: 'linear-gradient(180deg, #4a5568 0%, #1a202c 100%)',
        }}
      >
        <div className="overflow-hidden rounded-[10px] bg-[#F4F7FA] shadow-inner">
          <div className="flex h-[228px]">
            <aside
              className="flex w-[78px] shrink-0 flex-col gap-0.5 p-2 text-white"
              style={{ backgroundColor: LOGIN_BRAND.darkEmerald }}
            >
              <div className="mb-1.5 flex items-center gap-1">
                <div
                  className="flex size-[14px] items-center justify-center rounded-[4px]"
                  style={{ backgroundColor: LOGIN_BRAND.primary }}
                >
                  <Layers className="size-2 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[6px] font-bold leading-none">QB Suite</span>
              </div>
              {NAV.map((item, i) => (
                <div
                  key={item}
                  className="truncate rounded px-1.5 py-[3px] text-[5.5px] font-medium"
                  style={
                    i === 0
                      ? { backgroundColor: 'rgba(94,193,105,0.35)', color: '#fff' }
                      : { color: 'rgba(255,255,255,0.88)' }
                  }
                >
                  {item}
                </div>
              ))}
            </aside>
            <div className="min-w-0 flex-1 p-2">
              <p className="text-[8px] font-bold" style={{ color: LOGIN_BRAND.navy }}>
                Welcome, Admin
              </p>
              <div className="mt-1.5 grid grid-cols-3 gap-1">
                {[
                  { label: 'Employees', value: '148' },
                  { label: 'Leads', value: '34' },
                  { label: 'Revenue', value: '₹1.18L' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-md border border-[#DCE4ED] bg-white px-1 py-1">
                    <div className="text-[5px] text-[#64748B]">{kpi.label}</div>
                    <div className="text-[7px] font-bold" style={{ color: LOGIN_BRAND.navy }}>
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                <div className="rounded-md border border-[#DCE4ED] bg-white p-1">
                  <div className="text-[5.5px] font-semibold" style={{ color: LOGIN_BRAND.navy }}>
                    Attendance
                  </div>
                  <div className="mt-1 flex h-9 items-end gap-0.5">
                    {[42, 58, 36, 72, 48, 64, 55].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i % 2 === 0 ? LOGIN_BRAND.primary : LOGIN_BRAND.bright,
                          opacity: 0.88,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-[#DCE4ED] bg-white p-1">
                  <div className="text-[5.5px] font-semibold" style={{ color: LOGIN_BRAND.navy }}>
                    Sales trend
                  </div>
                  <div
                    className="mt-1 h-9 rounded-sm"
                    style={{ background: `linear-gradient(to top, ${LOGIN_BRAND.light}, transparent)` }}
                  >
                    <svg viewBox="0 0 100 32" className="h-full w-full" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke={LOGIN_BRAND.primary}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points="0,26 14,22 28,24 42,14 56,16 70,10 84,8 100,4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Laptop base */}
      <div
        aria-hidden
        className="mx-4 h-[10px] rounded-b-lg"
        style={{ background: 'linear-gradient(180deg, #64748b 0%, #334155 100%)' }}
      />
      <div
        aria-hidden
        className="mx-auto mt-0.5 h-[4px] w-[72%] rounded-full bg-slate-600/90"
      />
    </div>
  );
}
