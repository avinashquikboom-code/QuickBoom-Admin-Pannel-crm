'use client';

import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { icons } from '@/theme/icons';

const NAV = ['Dashboard', 'HRM', 'CRM', 'Finance', 'Reports'];

/**
 * Illustrative-only dashboard preview for the public login page.
 * Does not fetch or expose any real customer, employee, or financial data.
 */
export function LoginDashboardPreview() {
  return (
    <div
      className="relative w-full max-w-[430px] select-none"
      style={{
        transform: 'perspective(1100px) rotateX(4deg)',
        transformOrigin: 'bottom center',
      }}
    >
      {/* Subtle outer glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-[24px] opacity-30 blur-xl"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.45) 0%, transparent 70%)' }}
      />

      {/* Preview frame */}
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-[#0B2B22] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.42)]">
        <div className="overflow-hidden rounded-xl bg-[#F3F8F5]">
          {/* Mini window bar */}
          <div className="flex items-center justify-between border-b border-[#E2E8E5] bg-white px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-rose-400" />
              <span className="size-1.5 rounded-full bg-amber-400" />
              <span className="size-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[7px] font-medium text-[#64748B]">admin.qbapp.online</span>
            <span className="rounded bg-[#E8F1EC] px-1.5 py-0.5 text-[6px] font-semibold text-[#123D32]">
              Live Workspace
            </span>
          </div>

          <div className="flex h-[178px]">
            {/* Mini sidebar */}
            <aside className="flex w-[74px] shrink-0 flex-col gap-0.5 bg-[#073D30] p-2 text-white">
              <div className="mb-1.5 flex items-center gap-1">
                <div className="flex size-3.5 items-center justify-center rounded bg-[#22C55E]">
                  <FontAwesomeIcon icon={icons.layers} className="size-2 text-white" />
                </div>
                <span className="text-[6.5px] font-bold leading-none">QB Suite</span>
              </div>
              {NAV.map((item, i) => (
                <div
                  key={item}
                  className="truncate rounded px-1.5 py-[3px] text-[6px] font-medium"
                  style={
                    i === 0
                      ? { backgroundColor: 'rgba(34,197,94,0.24)', color: '#FFFFFF' }
                      : { color: 'rgba(255,255,255,0.75)' }
                  }
                >
                  {item}
                </div>
              ))}
            </aside>

            {/* Mini main content */}
            <div className="min-w-0 flex-1 p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-bold text-[#142D25]">Executive Overview</p>
                <span className="text-[6px] font-medium text-[#176B50]">All Systems Operational</span>
              </div>

              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Active Staff', value: '98.4%', tag: 'HRM' },
                  { label: 'Pipeline', value: 'Active', tag: 'CRM' },
                  { label: 'Billing', value: 'Synced', tag: 'Finance' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-[#E2E8E5] bg-white px-1.5 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[5px] text-[#64748B]">{kpi.label}</span>
                      <span className="text-[4.5px] font-semibold text-[#176B50]">{kpi.tag}</span>
                    </div>
                    <div className="mt-0.5 text-[7.5px] font-bold text-[#142D25]">{kpi.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <div className="rounded-lg border border-[#E2E8E5] bg-white p-1.5">
                  <div className="text-[5.5px] font-semibold text-[#142D25]">Team Attendance</div>
                  <div className="mt-1.5 flex h-10 items-end gap-1">
                    {[48, 66, 52, 84, 62, 78, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          backgroundColor: i % 2 === 0 ? '#123D32' : '#22C55E',
                          opacity: 0.9,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[#E2E8E5] bg-white p-1.5">
                  <div className="text-[5.5px] font-semibold text-[#142D25]">Revenue Growth</div>
                  <div
                    className="mt-1.5 h-10 rounded-sm"
                    style={{ background: 'linear-gradient(to top, #E8F1EC, transparent)' }}
                  >
                    <svg viewBox="0 0 100 32" className="h-full w-full" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#176B50"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        points="0,26 16,21 32,23 48,14 64,15 82,8 100,4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
