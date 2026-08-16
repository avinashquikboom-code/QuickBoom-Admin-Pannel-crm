'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Calendar, Clock, User, AlertCircle, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  AdminFormPage,
  AdminFormSection,
  AdminFormField,
  AdminFormActions,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from '@/components/admin';

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '17:00',
    assignedTo: 'Rahul Sharma',
    relatedTo: 'DEAL',
    relatedName: 'TechCorp Enterprise Deal',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Task created and assigned successfully!');
      router.push('/tasks');
    }, 600);
  };

  return (
    <AdminFormPage
      title="Create New Task"
      description="Assign an action item, client follow-up, or deadline to a team member."
      backHref="/tasks"
      backLabel="Back to Tasks"
      badge="Action Item"
      maxWidthClass="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Task Overview" description="Task title, details, and priority" icon={CheckSquare} columns={2}>
          <AdminFormField label="Task Title / Objective" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. Schedule product demo with TechCorp procurement team"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Priority Level" required>
            <AdminSelect
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'HIGH', label: 'High Priority (Urgent)' },
                { value: 'MEDIUM', label: 'Medium Priority (Normal)' },
                { value: 'LOW', label: 'Low Priority (Standard)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Assigned Team Member" required>
            <AdminSelect
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              options={[
                { value: 'Rahul Sharma', label: 'Rahul Sharma (Sales Executive)' },
                { value: 'Sneha Gupta', label: 'Sneha Gupta (Field Supervisor)' },
                { value: 'Amit Verma', label: 'Amit Verma (Digital Marketing)' },
                { value: 'Priya Singh', label: 'Priya Singh (Engineering)' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Due Date" required>
            <AdminInput
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Due Time" required>
            <AdminInput
              type="time"
              required
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Task Instructions & Scope" fullWidth>
            <AdminTextarea
              rows={3}
              placeholder="Detailed instructions or context for the assignee..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/tasks"
          cancelLabel="Cancel"
          submitLabel="Create Task"
          loading={loading}
          sticky
        />
      </form>
    </AdminFormPage>
  );
}
