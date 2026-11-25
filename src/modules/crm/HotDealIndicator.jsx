'use client';

export function HotDealIndicator({ lead }) {
  if (String(lead?.stage?.key || '').toUpperCase() !== 'HOT_DEAL') return null;
  return <span className="hot-deal-indicator"><span className="hot-deal-flame" aria-hidden="true">🔥</span> Hot Deal
    <style jsx>{`
      .hot-deal-indicator { display: inline-flex; align-items: center; white-space: nowrap; color: #c2410c; font-size: 10px; font-weight: 700; }
      .hot-deal-flame { display: inline-block; filter: drop-shadow(0 0 3px #fb923c); animation: flicker 1.1s ease-in-out infinite alternate; }
      @keyframes flicker { from { transform: scale(.94); } to { transform: scale(1.06); } }
      @media (prefers-reduced-motion: reduce) { .hot-deal-flame { animation: none; } }
    `}</style>
  </span>;
}
