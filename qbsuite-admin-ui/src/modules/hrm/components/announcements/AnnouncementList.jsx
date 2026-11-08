'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/Avatar';
import { faCheckCircle, faPaperclip, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faEyeSlash } from '@fortawesome/free-regular-svg-icons';
export function AnnouncementList({ announcements, onEdit, onDelete, onTogglePublish, }) {
    return (<div className="space-y-3.5">
      {announcements.map((ann) => (<Card key={ann.id} className={`border bg-white transition-all duration-200 shadow-2xs hover:shadow-xs ${ann.isImportant ? 'border-rose-200/80 bg-rose-50/20' : 'border-slate-200/90'}`}>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-semibold text-xs py-0.5">
                    {ann.category}
                  </Badge>

                  <StatusBadge status={ann.priority}/>

                  {ann.isImportant && (<Badge className="bg-rose-500 text-white font-bold text-[10px] uppercase tracking-wider py-0 px-1.5 shadow-none">
                      Important
                    </Badge>)}

                  {!ann.isPublished ? (<Badge variant="outline" className="border-dashed border-amber-300 text-amber-700 bg-amber-50 text-[10px] font-semibold">
                      <FontAwesomeIcon icon={faEyeSlash} className="size-3 mr-1"/>
                      Draft / Unannounced
                    </Badge>) : (<span className="text-[11px] text-brand font-semibold flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="size-3.5"/>
                      Published
                    </span>)}
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug pt-1">
                  {ann.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  {ann.content}
                </p>

                {/* Attachments */}
                {ann.attachments && ann.attachments.length > 0 && (<div className="pt-2 flex flex-wrap gap-2">
                    {ann.attachments.map((att) => (<span key={att.id} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-dark bg-brand-light border border-brand-light/80 px-2 py-1 rounded-md">
                        <FontAwesomeIcon icon={faPaperclip} className="size-3 text-brand"/>
                        <span className="font-semibold">{att.name}</span>
                        <span className="text-slate-400">({att.size})</span>
                      </span>))}
                  </div>)}

                {/* Author & Audience Meta */}
                <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="size-5 border">
                      <AvatarImage src={ann.author.avatar} alt={ann.author.name}/>
                      <AvatarFallback className="text-[9px]">
                        {ann.author.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-slate-700">
                      {ann.author.name}
                    </span>
                    <span>({ann.author.role})</span>
                  </div>
                  <span>•</span>
                  <span>Target: <strong className="text-slate-700">{ann.targetAudience}</strong></span>
                  <span>•</span>
                  <span>{ann.createdAt}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-1">
                <Button size="sm" variant="outline" onClick={() => onTogglePublish(ann)} className="h-7.5 px-2 text-xs border-slate-200 text-slate-600 hover:text-slate-900">
                  {ann.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(ann)} className="h-7.5 px-2 text-xs border-slate-200 text-slate-600 hover:text-brand-dark">
                  <FontAwesomeIcon icon={faPen} className="size-3.5"/>
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(ann)} className="h-7.5 px-2 text-xs border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50">
                  <FontAwesomeIcon icon={faTrash} className="size-3.5"/>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>))}

      {announcements.length === 0 && (<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
          No announcements found matching the filter.
        </div>)}
    </div>);
}
