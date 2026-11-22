'use client';

import * as React from 'react';

export function ColorPickerField({ label, description, value, onChange, presets = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-900">{label}</p>
          {description && <p className="text-[11px] text-slate-500">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || '#163A2E'}
            onChange={(e) => onChange(e.target.value)}
            className="size-8 cursor-pointer rounded-md border border-slate-200 p-0.5 bg-white"
            title="Pick color"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="size-7 rounded-md border border-slate-200 shrink-0 shadow-2xs"
          style={{ backgroundColor: value || '#163A2E' }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#163A2E"
          className="w-full h-8 rounded-md border border-[#E2E8E5] px-2.5 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-[#163A2E]"
        />
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className="size-4.5 rounded-full border border-slate-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: preset.value }}
              title={`${preset.name}: ${preset.value}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
