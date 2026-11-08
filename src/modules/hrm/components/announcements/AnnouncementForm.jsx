'use client';
import { Switch } from '@/components/ui/switch';
import { Form } from '@/components/ui/form';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { FormDrawer, DrawerFormField } from '@/components/common/drawers/FormDrawer';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Textarea } from '@/components/common/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
function AnnouncementFormFields({ open, onOpenChange, announcement, onSave, }) {
    const [title, setTitle] = React.useState(announcement?.title ?? '');
    const [content, setContent] = React.useState(announcement?.content ?? '');
    const [category, setCategory] = React.useState(announcement?.category ?? 'General');
    const [priority, setPriority] = React.useState(announcement?.priority ?? 'normal');
    const [targetAudience, setTargetAudience] = React.useState(announcement?.targetAudience ?? 'All Employees');
    const [isImportant, setIsImportant] = React.useState(announcement?.isImportant ?? false);
    const [isPublished, setIsPublished] = React.useState(announcement?.isPublished ?? true);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            title,
            content,
            category,
            priority,
            targetAudience,
            isImportant,
            isPublished,
        });
        onOpenChange(false);
    };
    return (
      <FormDrawer
        open={open}
        onOpenChange={onOpenChange}
        title={announcement ? 'Edit Announcement' : 'Create Company Announcement'}
        description="Publish communications, company policies, holidays, or executive updates."
        onSubmit={handleSubmit}
        submitLabel={announcement ? 'Save Changes' : 'Publish Announcement'}
        size="complex"
      >
        <DrawerFormField label="Title" required>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q2 Corporate Summit & Roadmap All-Hands" className="h-9 text-xs"/>
        </DrawerFormField>

        <div className="grid grid-cols-2 gap-3">
          <DrawerFormField label="Category">
            <Select value={category} onValueChange={(val) => setCategory(val)}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General" className="text-xs">
                  General
                </SelectItem>
                <SelectItem value="Policy" className="text-xs">
                  Policy
                </SelectItem>
                <SelectItem value="Holiday" className="text-xs">
                  Holiday
                </SelectItem>
                <SelectItem value="Event" className="text-xs">
                  Event
                </SelectItem>
                <SelectItem value="Urgent" className="text-xs">
                  Urgent
                </SelectItem>
              </SelectContent>
            </Select>
          </DrawerFormField>

          <DrawerFormField label="Target Audience">
            <Select value={targetAudience} onValueChange={(val) => setTargetAudience(val)}>
              <SelectTrigger className="h-9 text-xs w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Employees" className="text-xs">
                  All Employees
                </SelectItem>
                <SelectItem value="Engineering" className="text-xs">
                  Engineering
                </SelectItem>
                <SelectItem value="Sales" className="text-xs">
                  Sales
                </SelectItem>
                <SelectItem value="Managers" className="text-xs">
                  Managers
                </SelectItem>
              </SelectContent>
            </Select>
          </DrawerFormField>
        </div>

        <DrawerFormField label="Message Body" required>
          <Textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the full announcement text..." rows={4} className="text-xs resize-none"/>
        </DrawerFormField>

        {/* Upload Mockup */}
        <DrawerFormField label="Attachments (Optional)">
          <div className="rounded-lg border border-dashed border-slate-200 p-3 bg-slate-50/60 text-center hover:bg-slate-50 cursor-pointer">
            <FontAwesomeIcon icon={faCloudArrowUp} className="size-6 text-slate-400 mx-auto"/>
            <p className="text-[11px] text-slate-600 mt-1">
              Drag & drop PDF, guidelines, or matrix here, or{' '}
              <span className="text-brand font-semibold">browse files</span>
            </p>
            <p className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
          </div>
        </DrawerFormField>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} className="rounded border-slate-300 text-brand focus:ring-brand"/>
            <span className="text-xs font-semibold text-slate-800">
              Mark as High Priority
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded border-slate-300 text-brand focus:ring-brand"/>
            <span className="text-xs font-semibold text-slate-800">
              Publish Immediately
            </span>
          </label>
        </div>
      </FormDrawer>
    );
}

export function AnnouncementForm(props) { return <AnnouncementFormFields key={(props.announcement?.id || "new") + String(props.open)} {...props} />; }
