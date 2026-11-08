'use client';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { AnnouncementList } from '@/modules/hrm/components/announcements/AnnouncementList';
import { AnnouncementForm } from '@/modules/hrm/components/announcements/AnnouncementForm';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/Select';
import { mockAnnouncements } from '@/lib/mock-data';
import { toast } from '@/hooks/use-toast';
import { faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = React.useState(mockAnnouncements);
    const [search, setSearch] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('all');
    const [formOpen, setFormOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState(null);
    const [deleteConfirm, setDeleteConfirm] = React.useState({
        open: false,
        item: null,
    });
    const filtered = React.useMemo(() => {
        return announcements.filter((ann) => {
            const matchSearch = ann.title.toLowerCase().includes(search.toLowerCase()) ||
                ann.content.toLowerCase().includes(search.toLowerCase());
            const matchCat = selectedCategory === 'all' || ann.category === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [announcements, search, selectedCategory]);
    const handleSave = (data) => {
        if (editingItem) {
            setAnnouncements((prev) => prev.map((a) => (a.id === editingItem.id ? { ...a, ...data } : a)));
            toast.success('Announcement Updated Successfully');
        }
        else {
            const newAnn = {
                id: `ANN-${300 + announcements.length + 1}`,
                title: data.title || 'Untitled Update',
                content: data.content || '',
                category: data.category || 'General',
                priority: data.priority || 'normal',
                targetAudience: data.targetAudience || 'All Employees',
                isImportant: !!data.isImportant,
                isPublished: data.isPublished !== undefined ? data.isPublished : true,
                author: {
                    name: 'Alexander Vance',
                    role: 'Super Admin',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                },
                createdAt: 'Just now',
            };
            setAnnouncements((prev) => [newAnn, ...prev]);
            toast.success('Announcement Published', {
                description: `Broadcasted to ${newAnn.targetAudience}.`,
            });
        }
        setEditingItem(null);
    };
    const handleDelete = () => {
        if (!deleteConfirm.item)
            return;
        setAnnouncements((prev) => prev.filter((a) => a.id !== deleteConfirm.item.id));
        setDeleteConfirm({ open: false, item: null });
        toast.error('Announcement Deleted');
    };
    const handleTogglePublish = (ann) => {
        setAnnouncements((prev) => prev.map((a) => a.id === ann.id ? { ...a, isPublished: !a.isPublished } : a));
        toast.info(ann.isPublished ? 'Unpublished announcement' : 'Published announcement');
    };
    return (<div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Company Announcements & Communications" description="Broadcast enterprise updates, holiday notifications, benefits policy changes, and urgent alerts." actions={<Button size="sm" onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
            }} className="bg-brand hover:bg-primary-hover text-primary-foreground font-medium text-xs h-9">
            <FontAwesomeIcon icon={faPlus} className="size-4 mr-1.5"/>
            New Announcement
          </Button>}/>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"/>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcement keywords..." className="h-9 pl-8 pr-3 text-xs border-slate-200 bg-slate-50/50 focus-visible:bg-white"/>
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-9 text-xs border-slate-200 w-44 bg-slate-50/50">
            <SelectValue placeholder="Category"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Categories
            </SelectItem>
            <SelectItem value="General" className="text-xs">
              General
            </SelectItem>
            <SelectItem value="Policy" className="text-xs">
              Policy
            </SelectItem>
            <SelectItem value="Event" className="text-xs">
              Event
            </SelectItem>
            <SelectItem value="Holiday" className="text-xs">
              Holiday
            </SelectItem>
            <SelectItem value="Urgent" className="text-xs">
              Urgent
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Announcement List */}
      <AnnouncementList announcements={filtered} onEdit={(item) => {
            setEditingItem(item);
            setFormOpen(true);
        }} onDelete={(item) => setDeleteConfirm({ open: true, item })} onTogglePublish={handleTogglePublish}/>

      {/* Create / Edit Form Dialog */}
      <AnnouncementForm open={formOpen} onOpenChange={setFormOpen} announcement={editingItem} onSave={handleSave}/>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))} title="Delete Announcement" description={`Are you sure you want to delete "${deleteConfirm.item?.title}"? This cannot be undone.`} variant="destructive" confirmLabel="Yes, Delete" onConfirm={handleDelete}/>
    </div>);
}
