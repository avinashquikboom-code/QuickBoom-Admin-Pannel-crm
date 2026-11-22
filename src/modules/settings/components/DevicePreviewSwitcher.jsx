'use client';

import * as React from 'react';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faDesktop, faTabletScreenButton, faMobileScreenButton } from '@fortawesome/free-solid-svg-icons';

export function DevicePreviewSwitcher({
  activeDevice,
  onChange,
  appName,
  appLogoUrl,
  loginSubtitle,
  primaryColor = '#163A2E',
  secondaryColor = '#204C3D',
  paleColor = '#E8F1EC',
}) {
  const devices = [
    { id: 'desktop', label: 'Desktop', icon: faDesktop, widthClass: 'w-full max-w-full' },
    { id: 'tablet', label: 'Tablet', icon: faTabletScreenButton, widthClass: 'w-full max-w-[640px] mx-auto' },
    { id: 'mobile', label: 'Mobile', icon: faMobileScreenButton, widthClass: 'w-full max-w-[360px] mx-auto' },
  ];

  const currentDevice = devices.find((d) => d.id === activeDevice) || devices[0];

  return (
    <div className="space-y-3">
      {/* Device Viewport Toggle Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Live Responsive Branding Mockup
        </span>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {devices.map((device) => {
            const isActive = activeDevice === device.id;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => onChange(device.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FontAwesomeIcon icon={device.icon} className="size-3" />
                <span className="hidden sm:inline">{device.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulated Device Frame */}
      <div className="rounded-xl border border-[#E2E8E5] bg-[#F7F9F8] p-3 sm:p-5 transition-all">
        <div className={`${currentDevice.widthClass} transition-all duration-300`}>
          {/* Top simulated frame bar */}
          <div className="bg-slate-200 rounded-t-xl px-3 py-1.5 flex items-center justify-between border-b border-slate-300/80 text-[10px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-400 inline-block" />
              <span className="size-2 rounded-full bg-amber-400 inline-block" />
              <span className="size-2 rounded-full bg-emerald-400 inline-block" />
            </div>
            <span className="font-mono text-slate-500 truncate max-w-[150px]">
              {activeDevice === 'mobile' ? 'qbapp.online/m' : 'admin.qbapp.online'}
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400">{activeDevice}</span>
          </div>

          {/* Simulated App Header */}
          <div
            className="p-3.5 sm:p-4 text-white flex items-center justify-between transition-colors shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {appLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={appLogoUrl}
                  alt="App Logo"
                  className="size-7 sm:size-8 object-contain rounded bg-white/10 p-0.5 shrink-0"
                />
              ) : (
                <div
                  className="size-7 sm:size-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 border border-white/20"
                  style={{ backgroundColor: secondaryColor }}
                >
                  QB
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm sm:text-base tracking-tight truncate">
                    {appName || 'QB Suite'}
                  </span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-semibold uppercase">
                    Admin
                  </span>
                </div>
                {activeDevice !== 'mobile' && loginSubtitle && (
                  <p className="text-[11px] text-white/80 truncate">{loginSubtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: paleColor, color: primaryColor }}
              >
                Enterprise
              </span>
            </div>
          </div>

          {/* Simulated Page Body */}
          <div className="bg-white p-4 rounded-b-xl border-x border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
              <div
                className="h-6 w-16 rounded text-[10px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Action
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div
                className="p-2.5 rounded-lg border text-left"
                style={{ backgroundColor: `${paleColor}40`, borderColor: `${primaryColor}20` }}
              >
                <div className="text-[10px] font-bold text-slate-500 uppercase">Status</div>
                <div className="text-xs font-bold" style={{ color: primaryColor }}>Active & Live</div>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-left">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Theme</div>
                <div className="text-xs font-mono font-bold text-slate-800">{primaryColor}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
