'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { AdminButton } from '../buttons/AdminButton';

interface RowAction {
  label: string;
  danger?: boolean;
  onSelect: () => void | Promise<void>;
}

/** Portal keeps secondary actions visible inside horizontally scrolling tables. */
export function AdminRowActions({ label, items, disabled = false }: {
  label: string;
  items: RowAction[];
  disabled?: boolean;
}) {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const wrapper = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const close = () => setPosition(null);
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !wrapper.current?.contains(event.target as Node)) close();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keyboard);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [position]);
  if (!items.length) return null;
  return <span ref={wrapper}>
    <AdminButton variant="ghost" size="sm" type="button" icon={MoreVertical} className="!px-1.5"
      aria-label={label} aria-expanded={Boolean(position)} aria-haspopup="dialog" disabled={disabled}
      onClick={(event) => {
        trigger.current = event.currentTarget;
        if (position) { setPosition(null); return; }
        const rect = event.currentTarget.getBoundingClientRect();
        const height = items.length * 36 + 8;
        setPosition({ top: rect.bottom + height > window.innerHeight ? Math.max(8, rect.top - height) : rect.bottom + 4,
          left: Math.max(8, Math.min(rect.right - 176, window.innerWidth - 184)) });
      }} />
    {position && createPortal(<div ref={menu} role="dialog" aria-label={label}
      style={{ top: position.top, left: position.left }}
      className="fixed z-[60] w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPosition(null);
      }}>
      {items.map(item => <button type="button" key={item.label}
        className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}`}
        onClick={(event) => { event.stopPropagation(); setPosition(null); trigger.current?.focus(); void item.onSelect(); }}>{item.label}</button>)}
    </div>, document.body)}
  </span>;
}
