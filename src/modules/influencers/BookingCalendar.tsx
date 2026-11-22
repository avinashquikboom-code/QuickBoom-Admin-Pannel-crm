// @ts-nocheck
'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type InfluencerBookingItem } from '../../../lib/services/influencer.service';
import { cn } from '@/lib/utils';

interface BookingCalendarProps {
  bookings: InfluencerBookingItem[];
  onSelectBooking: (booking: InfluencerBookingItem) => void;
}

export function BookingCalendar({ bookings = [], onSelectBooking }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month & total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now.toISOString().split('T')[0]);
  };

  // Group bookings by YYYY-MM-DD
  const bookingsByDate = React.useMemo(() => {
    const map = new Map<string, InfluencerBookingItem[]>();
    for (const b of bookings) {
      if (!b.campaignDate) continue;
      const dateKey = new Date(b.campaignDate).toISOString().split('T')[0];
      const list = map.get(dateKey) || [];
      list.push(b);
      map.set(dateKey, list);
    }
    return map;
  }, [bookings]);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const isToday = (dayNum: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === dayNum;
  };

  const dayKeys: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Cells in calendar grid
  const cells = [];
  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateKey: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
    });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      day: d,
      isCurrentMonth: true,
      dateKey,
    });
  }
  // Next month leading days to fill grid to 35 or 42
  const totalSlots = cells.length > 35 ? 42 : 35;
  const remaining = totalSlots - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      day: d,
      isCurrentMonth: false,
      dateKey: `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  // Selected day bookings for mobile view
  const selectedDayBookings = selectedDay ? bookingsByDate.get(selectedDay) || [] : [];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-[#F7F9F8]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#163A2E] border border-emerald-100 shadow-2xs">
            <CalendarIcon className="size-4.5" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {monthName} {year}
            </h3>
            <p className="text-xs text-slate-500">
              Campaign bookings scheduled for this month ({bookings.length} total)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 text-xs font-semibold bg-white border-slate-200 rounded-lg"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              className="size-8 p-0 rounded-lg bg-white border-slate-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="size-8 p-0 rounded-lg bg-white border-slate-200"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 border-b border-slate-100 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/50 py-2">
        {dayKeys.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {cells.map((cell, idx) => {
          const dayBookings = bookingsByDate.get(cell.dateKey) || [];
          const isSelected = selectedDay === cell.dateKey;
          const today = cell.isCurrentMonth && isToday(cell.day);

          return (
            <div
              key={idx}
              onClick={() => {
                if (cell.isCurrentMonth) setSelectedDay(cell.dateKey);
              }}
              className={cn(
                'min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 transition-colors cursor-pointer flex flex-col',
                !cell.isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white hover:bg-slate-50/70',
                isSelected && 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/20'
              )}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-xs font-bold size-6 flex items-center justify-center rounded-full',
                    today
                      ? 'bg-[#163A2E] text-white shadow-2xs font-extrabold'
                      : cell.isCurrentMonth
                      ? 'text-slate-800'
                      : 'text-slate-300'
                  )}
                >
                  {cell.day}
                </span>

                {dayBookings.length > 0 && (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded-full sm:hidden">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* Booking Chips */}
              <div className="space-y-1 overflow-y-auto max-h-20 no-scrollbar flex-1">
                {dayBookings.slice(0, 3).map((b) => {
                  const isApproved = b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'COMPLETED';
                  const isRejected = b.bookingStatus === 'REJECTED' || b.bookingStatus === 'CANCELLED';

                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBooking(b);
                      }}
                      className={cn(
                        'w-full text-left p-1 rounded-md text-[10px] font-semibold truncate block transition-all border shadow-2xs',
                        isApproved
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                          : isRejected
                          ? 'bg-rose-50 border-rose-200 text-rose-900 hover:bg-rose-100'
                          : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                      )}
                      title={`${b.influencer?.name || 'Creator'} - ${b.brandName || 'Brand'} (₹${b.totalAmount})`}
                    >
                      <span className="font-extrabold mr-1">#{b.bookingId}</span>
                      <span className="truncate">{b.brandName || b.influencer?.name}</span>
                    </button>
                  );
                })}

                {dayBookings.length > 3 && (
                  <span className="text-[9px] font-bold text-slate-500 pl-1 block">
                    +{dayBookings.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Bookings Detail (especially convenient on mobile/tablet) */}
      {selectedDay && (
        <div className="border-t border-slate-200 p-4 sm:p-5 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Bookings on {selectedDay} ({selectedDayBookings.length})
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDay(null)}
              className="h-6 text-[11px] text-slate-400 hover:text-slate-700"
            >
              Close
            </Button>
          </div>

          {selectedDayBookings.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              No campaigns scheduled for this date.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {selectedDayBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectBooking(b)}
                  className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#163A2E]">
                      #{b.bookingId}
                    </span>
                    <Badge className="text-[10px] font-bold border-0 bg-slate-100 text-slate-700">
                      {b.bookingStatus}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {b.brandName || b.businessName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Creator: {b.influencer?.name || '—'}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400">{b.paymentStatus}</span>
                    <span className="font-extrabold text-slate-900">
                      ₹{Number(b.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
