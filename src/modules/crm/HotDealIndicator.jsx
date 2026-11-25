'use client';

export function HotDealIndicator({ lead }) {
  const key = String(lead?.stage?.key || '').toUpperCase();
  if (key !== 'HOT_LEAD' && key !== 'HOT_DEAL') return null;
  return <span className="hot-lead-indicator"><span className="hot-lead-flame" aria-hidden="true">🔥</span> Hot Lead
    <style jsx>{`
      .hot-lead-indicator { display: inline-flex; align-items: center; white-space: nowrap; color: #c2410c; font-size: 10px; font-weight: 700; }
      .hot-lead-flame { display: inline-block; filter: drop-shadow(0 0 3px #fb923c); animation: flicker 1.1s ease-in-out infinite alternate; }
      @keyframes flicker { from { transform: scale(.94); } to { transform: scale(1.06); } }
      @media (prefers-reduced-motion: reduce) { .hot-lead-flame { animation: none; } }
    `}</style>
  </span>;
}
