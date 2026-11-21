'use client';

import * as React from 'react';
import {
  CalendarClock,
  PhoneCall,
  Users,
  Megaphone,
  CheckCircle2,
  MoreVertical,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/Dropdown';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DEFAULT_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Lead Follow-up: Apex Technologies',
    desc: 'Review revised enterprise SaaS proposal with VP of Engineering.',
    time: 'Today, 03:30 PM',
    type: 'followup',
    icon: PhoneCall,
    iconColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    priority: 'High',
    priorityColor: 'bg-rose-50 text-rose-700 border-rose-200/80',
  },
  {
    id: 'act-2',
    title: 'Weekly Sales Pipeline Sync',
    desc: 'Review converted accounts and deal velocity with regional managers.',
    time: 'Tomorrow, 11:00 AM',
    type: 'meeting',
    icon: Users,
    iconColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
    priority: 'Medium',
    priorityColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
  {
    id: 'act-3',
    title: 'WhatsApp Campaign Review',
    desc: 'Verify broadcast delivery metrics and response rates for festive sale.',
    time: '24 Nov, 02:00 PM',
    type: 'campaign',
    icon: Megaphone,
    iconColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
    priority: 'Normal',
    priorityColor: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    id: 'act-4',
    title: 'Onboarding Check: Global Logistics',
    desc: 'Confirm tenant user creation and API credentials verification.',
    time: '25 Nov, 04:30 PM',
    type: 'onboarding',
    icon: CheckCircle2,
    iconColor: 'bg-teal-50 text-teal-700 border-teal-200/80',
    priority: 'Medium',
    priorityColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
];

export function UpcomingActivitiesCard({ tasks, loading }) {
  const [activities, setActivities] = React.useState(DEFAULT_ACTIVITIES);

  // If live pending tasks exist from API, map them nicely
  React.useEffect(() => {
    if (Array.isArray(tasks) && tasks.length > 0) {
      const mapped = tasks.slice(0, 4).map((t, idx) => ({
        id: `task-${t.id || idx}`,
        title: t.title || 'Scheduled Activity',
        desc: t.description || 'Assigned workflow task',
        time: t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Upcoming',
        type: 'task',
        icon: t.type === 'CALL' ? PhoneCall : t.type === 'MEETING' ? Users : CalendarClock,
        iconColor: 'bg-emerald-50 text-[#173D30] border-emerald-200/80',
        priority: t.priority || 'Normal',
        priorityColor: t.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200/80' : 'bg-slate-100 text-slate-700 border-slate-200',
      }));
      setActivities(mapped);
    }
  }, [tasks]);

  const handleAction = (act, actionName) => {
    if (actionName === 'complete') {
      setActivities((prev) => prev.filter((a) => a.id !== act.id));
      toast.success(`Completed "${act.title}"`);
    } else if (actionName === 'reschedule') {
      toast.info(`Rescheduling "${act.title}"`);
    } else {
      toast.info(`Viewing details for "${act.title}"`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs h-[420px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <div className="space-y-3.5 my-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-8 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition-all duration-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-[#173D30] border border-emerald-200/80">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Upcoming Activities
            </h2>
            <p className="text-xs text-slate-500">Scheduled follow-ups & events</p>
          </div>
        </div>
        <Link
          href="/admin/crm/tasks"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#173D30] hover:text-[#20C466] hover:underline transition-colors"
        >
          View all <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {/* Activity List */}
      <div className="my-2 flex-1 flex flex-col justify-center divide-y divide-slate-100">
        {activities.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              className="py-2.5 flex items-start justify-between gap-3 group hover:bg-slate-50/50 rounded-xl px-1.5 -mx-1.5 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 shadow-2xs',
                    act.iconColor
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {act.title}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[9px] font-bold border',
                        act.priorityColor
                      )}
                    >
                      {act.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                    {act.desc}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="size-3" />
                    {act.time}
                  </p>
                </div>
              </div>

              {/* Three-dot row menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Actions for ${act.title}`}
                  className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                >
                  <MoreVertical className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 bg-white border border-slate-200 shadow-xl rounded-xl p-1 text-xs">
                  <DropdownMenuItem
                    onClick={() => handleAction(act, 'view')}
                    className="p-1.5 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-700"
                  >
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAction(act, 'complete')}
                    className="p-1.5 rounded-lg cursor-pointer hover:bg-emerald-50 text-emerald-700 font-medium"
                  >
                    Mark Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAction(act, 'reschedule')}
                    className="p-1.5 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-700"
                  >
                    Reschedule
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
