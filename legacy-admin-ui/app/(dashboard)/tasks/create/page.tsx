'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Calendar, Clock, User, AlertCircle, Building, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import {
  AdminFormPage,
  AdminFormSection,
  AdminFormField,
  AdminFormActions,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from '@/components/admin';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    departmentId: '',
    employeeId: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '06:30 PM',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    category: 'OPERATIONS',
    notes: '',
  });

  // Fetch Departments
  const { data: departmentsData } = useQuery({
    queryKey: ['admin-departments-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/departments');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  // Fetch Employees
  const { data: employeesData } = useQuery({
    queryKey: ['admin-employees-dropdown'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees');
        return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  const departments: any[] = Array.isArray(departmentsData) ? departmentsData : [];
  const employees: any[] = Array.isArray(employeesData) ? employeesData : [];

  const availableEmployees = formData.departmentId
    ? employees.filter((e) => String(e.departmentId) === formData.departmentId)
    : employees;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim() || 'New Employee Task',
        description: formData.description.trim() || 'Task scope & checklist',
        priority: formData.priority,
        departmentId: formData.departmentId || undefined,
        employeeId: formData.employeeId || undefined,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        startDate: formData.startDate || undefined,
        startTime: formData.startTime || undefined,
        category: formData.category || 'OPERATIONS',
        notes: formData.notes.trim() || undefined,
      };

      await api.post('/tasks', payload);
      toast.success('Task created and allocated successfully!');
      router.push('/tasks');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminFormPage
      title="Create & Allocate Task"
      description="Create a task assignment for an employee, set deadlines, and configure photo proof requirements."
      backHref="/tasks"
      backLabel="Back to Tasks"
      badge="Task Management"
      maxWidthClass="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminFormSection title="Task Overview" description="Title, priority, and description" icon={CheckSquare} columns={2}>
          <AdminFormField label="Task Title / Objective" required fullWidth>
            <AdminInput
              type="text"
              required
              placeholder="e.g. On-site Biometric Device Setup & Client Training"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Priority Level" required>
            <AdminSelect
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'URGENT', label: 'Urgent Priority' },
                { value: 'HIGH', label: 'High Priority' },
                { value: 'MEDIUM', label: 'Medium Priority' },
                { value: 'LOW', label: 'Low Priority' },
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Task Category">
            <AdminInput
              type="text"
              placeholder="e.g. OPERATIONS, AUDIT, CLIENT_SUPPORT"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Detailed Description & Work Scope" required fullWidth>
            <AdminTextarea
              rows={3}
              required
              placeholder="Provide exact deliverables, checklist items, and photo proof requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Employee Allocation" description="Filter by department and select employee" icon={Users} columns={2}>
          <AdminFormField label="Filter by Department">
            <AdminSelect
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, employeeId: '' })}
              options={[
                { value: '', label: '-- All Departments --' },
                ...departments.map((d) => ({ value: String(d.id), label: d.name })),
              ]}
            />
          </AdminFormField>

          <AdminFormField label="Allocate to Employee" required>
            <AdminSelect
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              options={[
                { value: '', label: '-- Select Active Employee --' },
                ...availableEmployees.map((emp) => ({
                  value: String(emp.id),
                  label: `${emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`} (${emp.employeeCode}) - ${emp.designation?.name || 'Staff'}`,
                })),
              ]}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="Deadline & Timings" description="Due date, due time, and schedule" icon={Calendar} columns={2}>
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
              type="text"
              required
              placeholder="e.g. 06:30 PM"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
            />
          </AdminFormField>

          <AdminFormField label="Photo Proof & Special Instructions" fullWidth>
            <AdminTextarea
              rows={2}
              placeholder="Note: Photo proof of completed checklist and signed document is mandatory."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormActions
          backHref="/tasks"
          submitLabel={loading ? 'Allocating...' : 'Create & Allocate Task'}
          onCancel={() => router.push('/tasks')}
          loading={loading}
        />
      </form>
    </AdminFormPage>
  );
}
