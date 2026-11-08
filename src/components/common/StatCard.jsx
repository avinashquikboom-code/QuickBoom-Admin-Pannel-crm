import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor = 'text-brand', iconBg = 'bg-brand-light', description, badge, className, onClick, }) {
    return (<Card onClick={onClick} className={cn('relative overflow-hidden border border-slate-200/90 bg-white transition-all duration-200 hover:shadow-md hover:border-slate-300', onClick ? 'cursor-pointer hover:-translate-y-0.5' : '', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {value}
              </span>
              {badge && (<Badge variant="outline" className="bg-brand-light text-brand-dark border-brand-light text-[10px] font-semibold py-0">
                  {badge}
                </Badge>)}
            </div>
          </div>
          <div className={cn('flex size-11 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105', iconBg, iconColor)}>
            {Icon && <FontAwesomeIcon icon={Icon} className="size-5.5"/>}
          </div>
        </div>

        {(change || description) && (<div className="mt-3 flex items-center gap-1.5 text-xs">
            {change && (<span className={cn('font-semibold', changeType === 'positive'
                    ? 'text-brand'
                    : changeType === 'negative'
                        ? 'text-rose-600'
                        : 'text-slate-600')}>
                {change}
              </span>)}
            {description && (<span className="text-slate-400 truncate">{description}</span>)}
          </div>)}
      </CardContent>
    </Card>);
}
