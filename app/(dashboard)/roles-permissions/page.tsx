'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Minus,
  Save,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  User,
  Users,
  Search,
  Filter,
  Sliders,
  CheckCheck,
  Ban,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Calendar,
  Briefcase,
  Layers,
  Phone,
  Video,
  Camera,
  Share2,
  Clock3,
  DollarSign,
  FileText,
  Package,
  CreditCard,
  Building2,
  FolderLock,
  ChevronUp,
} from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminFormDrawer } from '@/components/admin';

// ---------------------------------------------------------------------------
// PERMISSION TREE DEFINITIONS (Normalized Granular Model)
// ---------------------------------------------------------------------------

interface PermissionNode {
  key: string;
  module: string;
  action: string;
  label: string;
  description: string;
}

interface ModuleGroup {
  id: string;
  name: string;
  icon: any;
  category: 'CRM' | 'WORKSPACE' | 'CALENDAR' | 'CREATIVE' | 'HRM' | 'SYSTEM';
  description: string;
  permissions: PermissionNode[];
}

const PERMISSION_MODULE_GROUPS: ModuleGroup[] = [
  // 1. CRM WORKFLOW
  {
    id: 'LEADS',
    name: 'Leads & Inquiries',
    icon: Users,
    category: 'CRM',
    description: 'CRM lead acquisition pipeline, calling, and status changes',
    permissions: [
      { key: 'employee.leads.view', module: 'LEADS', action: 'VIEW', label: 'View Leads', description: 'Display Leads screen and view pipeline records' },
      { key: 'employee.leads.create', module: 'LEADS', action: 'CREATE', label: 'Create Lead', description: 'Show Add Lead button and capture inquiries' },
      { key: 'employee.leads.edit', module: 'LEADS', action: 'EDIT', label: 'Edit Lead', description: 'Modify lead contact details and notes' },
      { key: 'employee.leads.delete', module: 'LEADS', action: 'DELETE', label: 'Delete Lead', description: 'Remove lead records from pipeline' },
      { key: 'employee.leads.change_stage', module: 'LEADS', action: 'CHANGE_STAGE', label: 'Change Stage / Status', description: 'Transition leads between pipeline stages' },
      { key: 'employee.leads.call', module: 'LEADS', action: 'CALL', label: 'Call Lead', description: 'Trigger phone dialer and log telecall outcomes' },
      { key: 'employee.leads.whatsapp', module: 'LEADS', action: 'WHATSAPP', label: 'WhatsApp Lead', description: 'Send direct WhatsApp messages with pitch templates' },
      { key: 'employee.leads.email', module: 'LEADS', action: 'EMAIL', label: 'Email Lead', description: 'Send email pitches directly from lead card' },
      { key: 'employee.leads.send_details', module: 'LEADS', action: 'SEND_DETAILS', label: 'Send Details', description: 'Dispatch service packages or brochures' },
      { key: 'employee.leads.follow_up', module: 'LEADS', action: 'FOLLOW_UP', label: 'Create Follow-up', description: 'Schedule follow-up reminder from lead details' },
      { key: 'employee.leads.schedule_visit', module: 'LEADS', action: 'SCHEDULE_VISIT', label: 'Schedule Visit', description: 'Book client demo or on-site meeting' },
      { key: 'employee.leads.export', module: 'LEADS', action: 'EXPORT', label: 'Export Leads', description: 'Export filtered lead lists to CSV/Excel' },
    ],
  },
  {
    id: 'FOLLOW_UP',
    name: 'Follow-ups',
    icon: Phone,
    category: 'CRM',
    description: 'Daily follow-up reminders, callback queue, and disposition',
    permissions: [
      { key: 'employee.followups.view', module: 'FOLLOW_UP', action: 'VIEW', label: 'View Follow-ups', description: 'View scheduled follow-ups list in drawer and menu' },
      { key: 'employee.followups.create', module: 'FOLLOW_UP', action: 'CREATE', label: 'Create Follow-up', description: 'Schedule new callback reminder' },
      { key: 'employee.followups.edit', module: 'FOLLOW_UP', action: 'EDIT', label: 'Edit Follow-up', description: 'Update callback schedule and agenda' },
      { key: 'employee.followups.delete', module: 'FOLLOW_UP', action: 'DELETE', label: 'Delete Follow-up', description: 'Remove scheduled follow-up' },
      { key: 'employee.followups.call', module: 'FOLLOW_UP', action: 'CALL', label: 'Call from Follow-up', description: 'Initiate call directly from follow-up queue' },
      { key: 'employee.followups.complete', module: 'FOLLOW_UP', action: 'COMPLETE', label: 'Complete Follow-up', description: 'Mark follow-up done with call notes' },
    ],
  },
  {
    id: 'VISITS',
    name: 'Field Visits',
    icon: Briefcase,
    category: 'CRM',
    description: 'On-ground client meetings, location check-in, and completion',
    permissions: [
      { key: 'employee.visits.view', module: 'VISITS', action: 'VIEW', label: 'View Visits', description: 'Display Field Visits in menu and list visits' },
      { key: 'employee.visits.create', module: 'VISITS', action: 'CREATE', label: 'Schedule Visit', description: 'Create new field visit record' },
      { key: 'employee.visits.edit', module: 'VISITS', action: 'EDIT', label: 'Edit Visit', description: 'Update client meeting agenda and time' },
      { key: 'employee.visits.delete', module: 'VISITS', action: 'DELETE', label: 'Delete Visit', description: 'Cancel and delete visit record' },
      { key: 'employee.visits.start', module: 'VISITS', action: 'START', label: 'Start / Check-in Visit', description: 'Record GPS check-in at client premises' },
      { key: 'employee.visits.complete', module: 'VISITS', action: 'COMPLETE', label: 'Complete Visit', description: 'Record outcome notes and photo proof' },
      { key: 'employee.visits.cancel', module: 'VISITS', action: 'CANCEL', label: 'Cancel Visit', description: 'Mark visit cancelled with reason' },
    ],
  },
  {
    id: 'PROPOSALS',
    name: 'Proposals & Quotes',
    icon: FileText,
    category: 'CRM',
    description: 'Commercial quotes, proposal PDFs, and client dispatches',
    permissions: [
      { key: 'employee.proposals.view', module: 'PROPOSALS', action: 'VIEW', label: 'View Proposals', description: 'Display Proposals in navigation' },
      { key: 'employee.proposals.create', module: 'PROPOSALS', action: 'CREATE', label: 'Create Proposal', description: 'Draft new commercial price quotation' },
      { key: 'employee.proposals.edit', module: 'PROPOSALS', action: 'EDIT', label: 'Edit Proposal', description: 'Update pricing items and discount terms' },
      { key: 'employee.proposals.delete', module: 'PROPOSALS', action: 'DELETE', label: 'Delete Proposal', description: 'Void or remove proposal' },
      { key: 'employee.proposals.send', module: 'PROPOSALS', action: 'SEND', label: 'Send Proposal', description: 'Send proposal via Email or WhatsApp' },
      { key: 'employee.proposals.download', module: 'PROPOSALS', action: 'DOWNLOAD', label: 'Download PDF', description: 'Download branded proposal PDF' },
    ],
  },
  {
    id: 'PACKAGES',
    name: 'Packages & Services',
    icon: Package,
    category: 'CRM',
    description: 'Independent service bundle catalog, pricing, and toggling',
    permissions: [
      { key: 'employee.packages.view', module: 'PACKAGES', action: 'VIEW', label: 'View Packages', description: 'Display Packages in drawer menu' },
      { key: 'employee.packages.create', module: 'PACKAGES', action: 'CREATE', label: 'Create Package', description: 'Define new commercial bundle' },
      { key: 'employee.packages.edit', module: 'PACKAGES', action: 'EDIT', label: 'Edit Package', description: 'Update package deliverables and pricing' },
      { key: 'employee.packages.delete', module: 'PACKAGES', action: 'DELETE', label: 'Delete Package', description: 'Remove service bundle' },
      { key: 'employee.packages.toggle_status', module: 'PACKAGES', action: 'TOGGLE_STATUS', label: 'Toggle Status', description: 'Activate or pause package availability' },
    ],
  },
  {
    id: 'PAYMENTS',
    name: 'Payments & Revenue',
    icon: CreditCard,
    category: 'CRM',
    description: 'Client invoices, payment logs, and financial records',
    permissions: [
      { key: 'employee.payments.view', module: 'PAYMENTS', action: 'VIEW', label: 'View Payments', description: 'Display Payments in navigation' },
      { key: 'employee.payments.create', module: 'PAYMENTS', action: 'CREATE', label: 'Record Payment', description: 'Log incoming client payment transaction' },
      { key: 'employee.payments.edit', module: 'PAYMENTS', action: 'EDIT', label: 'Edit Payment', description: 'Update payment record details' },
      { key: 'employee.payments.delete', module: 'PAYMENTS', action: 'DELETE', label: 'Delete Payment', description: 'Remove payment transaction' },
      { key: 'employee.payments.export', module: 'PAYMENTS', action: 'EXPORT', label: 'Export Payments', description: 'Export payment statements' },
    ],
  },
  {
    id: 'WORK_EXECUTION',
    name: 'Work Execution (Projects)',
    icon: Layers,
    category: 'CRM',
    description: 'Post-sales project delivery, milestone progress, and sign-offs',
    permissions: [
      { key: 'employee.work_execution.view', module: 'WORK_EXECUTION', action: 'VIEW', label: 'View Work Execution', description: 'Display Work Execution delivery view' },
      { key: 'employee.work_execution.create', module: 'WORK_EXECUTION', action: 'CREATE', label: 'Create Project Job', description: 'Initiate new project deliverable' },
      { key: 'employee.work_execution.edit', module: 'WORK_EXECUTION', action: 'EDIT', label: 'Edit Project', description: 'Update project timeline and team assignments' },
      { key: 'employee.work_execution.delete', module: 'WORK_EXECUTION', action: 'DELETE', label: 'Delete Project', description: 'Delete or cancel project' },
      { key: 'employee.work_execution.milestone_update', module: 'WORK_EXECUTION', action: 'MILESTONE_UPDATE', label: 'Update Milestones', description: 'Advance milestone phases' },
      { key: 'employee.work_execution.reopen', module: 'WORK_EXECUTION', action: 'REOPEN', label: 'Reopen Job', description: 'Reopen completed job for revisions' },
    ],
  },
  {
    id: 'CUSTOMERS',
    name: 'Customer Directory',
    icon: Building2,
    category: 'CRM',
    description: 'Client master accounts, plan quotas, and profiles',
    permissions: [
      { key: 'employee.customers.view', module: 'CUSTOMERS', action: 'VIEW', label: 'View Customers', description: 'Display Customers directory in drawer' },
      { key: 'employee.customers.create', module: 'CUSTOMERS', action: 'CREATE', label: 'Add Customer', description: 'Create new company client account' },
      { key: 'employee.customers.edit', module: 'CUSTOMERS', action: 'EDIT', label: 'Edit Customer', description: 'Update client profile details' },
      { key: 'employee.customers.delete', module: 'CUSTOMERS', action: 'DELETE', label: 'Delete Customer', description: 'Remove or archive customer' },
      { key: 'employee.customers.export', module: 'CUSTOMERS', action: 'EXPORT', label: 'Export Customers', description: 'Export customer list' },
    ],
  },

  // 2. CALENDAR
  {
    id: 'CALENDAR',
    name: 'Calendar & Schedules',
    icon: Calendar,
    category: 'CALENDAR',
    description: 'Personal, team, and assigned shoot/visit calendar scheduling',
    permissions: [
      { key: 'employee.calendar.view', module: 'CALENDAR', action: 'VIEW', label: 'View Calendar', description: 'Display Calendar in bottom navigation bar and drawer' },
      { key: 'employee.calendar.view_assigned', module: 'CALENDAR', action: 'VIEW_ASSIGNED', label: 'View Assigned Events', description: 'View personal bookings, shoots, and visits' },
      { key: 'employee.calendar.view_team', module: 'CALENDAR', action: 'VIEW_TEAM', label: 'View Team Calendar', description: 'View entire company schedule and colleagues' },
      { key: 'employee.calendar.create', module: 'CALENDAR', action: 'CREATE', label: 'Create Event', description: 'Book new calendar appointment' },
      { key: 'employee.calendar.edit', module: 'CALENDAR', action: 'EDIT', label: 'Edit Event', description: 'Modify booking time or details' },
      { key: 'employee.calendar.delete', module: 'CALENDAR', action: 'DELETE', label: 'Delete Event', description: 'Cancel calendar booking' },
      { key: 'employee.calendar.reschedule', module: 'CALENDAR', action: 'RESCHEDULE', label: 'Reschedule Event', description: 'Move booking date/slot' },
    ],
  },

  // 3. WORKSPACE (MY WORK & TASKS)
  {
    id: 'MY_WORK',
    name: 'My Work (Creative Execution)',
    icon: Briefcase,
    category: 'WORKSPACE',
    description: 'Core creative workspace for Designers, Editors, Photographers, SMM',
    permissions: [
      { key: 'employee.my_work.view', module: 'MY_WORK', action: 'VIEW', label: 'View My Work', description: 'Display My Work in bottom navigation and drawer' },
      { key: 'employee.my_work.open', module: 'MY_WORK', action: 'OPEN', label: 'Open Deliverable', description: 'Open detailed deliverable bottom sheet' },
      { key: 'employee.my_work.start', module: 'MY_WORK', action: 'START', label: 'Start Work', description: 'Transition deliverable to In Progress' },
      { key: 'employee.my_work.update_progress', module: 'MY_WORK', action: 'UPDATE_PROGRESS', label: 'Update Progress', description: 'Log percentage and work notes' },
      { key: 'employee.my_work.upload', module: 'MY_WORK', action: 'UPLOAD', label: 'Upload Asset', description: 'Upload media files, photos, or draft links' },
      { key: 'employee.my_work.submit', module: 'MY_WORK', action: 'SUBMIT', label: 'Submit for Review', description: 'Submit creative for approval' },
      { key: 'employee.my_work.complete', module: 'MY_WORK', action: 'COMPLETE', label: 'Mark Complete', description: 'Mark work deliverable finished' },
    ],
  },
  {
    id: 'TASKS',
    name: 'Assigned Tasks',
    icon: CheckCheck,
    category: 'WORKSPACE',
    description: 'Operational tasks, photo proofs, and checklists',
    permissions: [
      { key: 'employee.tasks.view', module: 'TASKS', action: 'VIEW', label: 'View Tasks', description: 'Display Tasks in drawer and view board' },
      { key: 'employee.tasks.create', module: 'TASKS', action: 'CREATE', label: 'Create Task', description: 'Assign new task to team or self' },
      { key: 'employee.tasks.start', module: 'TASKS', action: 'START', label: 'Start Task', description: 'Clock in on assigned task' },
      { key: 'employee.tasks.update', module: 'TASKS', action: 'UPDATE', label: 'Update Task', description: 'Update task checklist and notes' },
      { key: 'employee.tasks.submit_proof', module: 'TASKS', action: 'SUBMIT_PROOF', label: 'Submit Photo Proof', description: 'Upload camera proof of completion' },
      { key: 'employee.tasks.complete', module: 'TASKS', action: 'COMPLETE', label: 'Complete Task', description: 'Mark task done' },
      { key: 'employee.tasks.approve', module: 'TASKS', action: 'APPROVE', label: 'Approve Task', description: 'Manager sign-off on completed task' },
      { key: 'employee.tasks.edit', module: 'TASKS', action: 'EDIT', label: 'Edit Task', description: 'Modify task deadlines and priority' },
      { key: 'employee.tasks.delete', module: 'TASKS', action: 'DELETE', label: 'Delete Task', description: 'Remove task' },
    ],
  },

  // 4. CREATIVE / SSM WORK
  {
    id: 'CREATIVE_WORK',
    name: 'Social Media & Creative Work',
    icon: Share2,
    category: 'CREATIVE',
    description: 'SSM post publishing, reel scheduling, approvals, and review',
    permissions: [
      { key: 'employee.creative_work.view', module: 'CREATIVE_WORK', action: 'VIEW', label: 'View Creative Work', description: 'Display Social Media Work section in drawer' },
      { key: 'employee.creative_work.open', module: 'CREATIVE_WORK', action: 'OPEN', label: 'Open Creative Asset', description: 'Open post brief and captions' },
      { key: 'employee.creative_work.assign', module: 'CREATIVE_WORK', action: 'ASSIGN', label: 'Assign Work', description: 'Allocate posts to designers or editors' },
      { key: 'employee.creative_work.start', module: 'CREATIVE_WORK', action: 'START', label: 'Start Creative', description: 'Clock in on creative post creation' },
      { key: 'employee.creative_work.update', module: 'CREATIVE_WORK', action: 'UPDATE', label: 'Update Creative Asset', description: 'Edit post draft, copy, or hashtags' },
      { key: 'employee.creative_work.upload', module: 'CREATIVE_WORK', action: 'UPLOAD', label: 'Upload Render / Asset', description: 'Upload final media files' },
      { key: 'employee.creative_work.review', module: 'CREATIVE_WORK', action: 'REVIEW', label: 'Review Creative', description: 'Submit supervisory revision feedback' },
      { key: 'employee.creative_work.approve', module: 'CREATIVE_WORK', action: 'APPROVE', label: 'Approve Creative', description: 'Manager sign-off on final deliverable' },
      { key: 'employee.creative_work.submit', module: 'CREATIVE_WORK', action: 'SUBMIT', label: 'Submit to Client', description: 'Send creative to client preview' },
      { key: 'employee.creative_work.complete', module: 'CREATIVE_WORK', action: 'COMPLETE', label: 'Complete Asset', description: 'Mark creative deliverable finished' },
      { key: 'employee.creative_work.publish', module: 'CREATIVE_WORK', action: 'PUBLISH', label: 'Publish / Schedule', description: 'Schedule or live-publish to social feeds' },
    ],
  },

  // 5. HRM & WORKPLACE
  {
    id: 'ATTENDANCE',
    name: 'Attendance & Time Tracking',
    icon: Clock3,
    category: 'HRM',
    description: 'Biometric/GPS punch in/out, break management, and logs',
    permissions: [
      { key: 'employee.attendance.view', module: 'ATTENDANCE', action: 'VIEW', label: 'View Attendance', description: 'Display Attendance in bottom nav and drawer' },
      { key: 'employee.attendance.punch_in', module: 'ATTENDANCE', action: 'PUNCH_IN', label: 'Punch In', description: 'Allow biometric / GPS check-in' },
      { key: 'employee.attendance.punch_out', module: 'ATTENDANCE', action: 'PUNCH_OUT', label: 'Punch Out', description: 'Allow biometric / GPS check-out' },
      { key: 'employee.attendance.start_break', module: 'ATTENDANCE', action: 'START_BREAK', label: 'Start Break', description: 'Log lunch or tea break start' },
      { key: 'employee.attendance.end_break', module: 'ATTENDANCE', action: 'END_BREAK', label: 'End Break', description: 'Resume work from break' },
      { key: 'employee.attendance.edit', module: 'ATTENDANCE', action: 'EDIT', label: 'Regularize Attendance', description: 'Submit attendance regularization' },
      { key: 'employee.attendance.delete', module: 'ATTENDANCE', action: 'DELETE', label: 'Delete Punch Log', description: 'Remove erroneous punch' },
    ],
  },
  {
    id: 'LEAVE',
    name: 'Requests & Leaves',
    icon: FileText,
    category: 'HRM',
    description: 'Leave applications, approvals, and request history',
    permissions: [
      { key: 'employee.leave.view', module: 'LEAVE', action: 'VIEW', label: 'View Requests & Leaves', description: 'Display Requests in drawer menu' },
      { key: 'employee.leave.create', module: 'LEAVE', action: 'CREATE', label: 'Apply for Leave', description: 'Submit leave request application' },
      { key: 'employee.leave.edit', module: 'LEAVE', action: 'EDIT', label: 'Edit Leave', description: 'Update pending leave request' },
      { key: 'employee.leave.cancel', module: 'LEAVE', action: 'CANCEL', label: 'Cancel Leave', description: 'Withdraw submitted leave request' },
      { key: 'employee.leave.approve', module: 'LEAVE', action: 'APPROVE', label: 'Approve Leave', description: 'Manager approval on leave request' },
      { key: 'employee.leave.reject', module: 'LEAVE', action: 'REJECT', label: 'Reject Leave', description: 'Manager rejection on leave request' },
    ],
  },
  {
    id: 'EXPENSES',
    name: 'Expenses & Reimbursements',
    icon: DollarSign,
    category: 'HRM',
    description: 'Travel, fuel, and gear reimbursement claims',
    permissions: [
      { key: 'employee.expenses.view', module: 'EXPENSES', action: 'VIEW', label: 'View Expenses Tab', description: 'Show Expenses tab in Requests screen' },
      { key: 'employee.expenses.create', module: 'EXPENSES', action: 'CREATE', label: 'Submit Expense', description: 'Submit new reimbursement claim' },
      { key: 'employee.expenses.edit', module: 'EXPENSES', action: 'EDIT', label: 'Edit Expense', description: 'Modify pending expense claim' },
      { key: 'employee.expenses.cancel', module: 'EXPENSES', action: 'CANCEL', label: 'Cancel Expense', description: 'Withdraw submitted claim' },
    ],
  },
  {
    id: 'LOAN',
    name: 'Loans & Advances',
    icon: DollarSign,
    category: 'HRM',
    description: 'Salary advance requests and management authorization',
    permissions: [
      { key: 'employee.loans.view', module: 'LOAN', action: 'VIEW', label: 'View Loan Tab', description: 'Show Loan advance tab in Requests screen' },
      { key: 'employee.loans.create', module: 'LOAN', action: 'CREATE', label: 'Request Loan Advance', description: 'Submit advance salary request' },
      { key: 'employee.loans.approve', module: 'LOAN', action: 'APPROVE', label: 'Approve Loan', description: 'Authorize employee advance' },
      { key: 'employee.loans.reject', module: 'LOAN', action: 'REJECT', label: 'Reject Loan', description: 'Decline advance request' },
    ],
  },
  {
    id: 'REMOTE_WORK',
    name: 'Remote Work (WFH)',
    icon: Smartphone,
    category: 'HRM',
    description: 'Work-from-home applications and management',
    permissions: [
      { key: 'employee.remote_work.view', module: 'REMOTE_WORK', action: 'VIEW', label: 'View Remote Work', description: 'Display Remote Work in drawer and tab' },
      { key: 'employee.remote_work.create', module: 'REMOTE_WORK', action: 'CREATE', label: 'Apply Remote Work', description: 'Submit work-from-home application' },
      { key: 'employee.remote_work.edit', module: 'REMOTE_WORK', action: 'EDIT', label: 'Edit Remote Request', description: 'Modify pending remote application' },
      { key: 'employee.remote_work.cancel', module: 'REMOTE_WORK', action: 'CANCEL', label: 'Cancel Remote Request', description: 'Withdraw remote application' },
    ],
  },
  {
    id: 'SALARY',
    name: 'Salary & Slips',
    icon: DollarSign,
    category: 'HRM',
    description: 'Monthly salary slips and payroll summaries',
    permissions: [
      { key: 'employee.salary.view', module: 'SALARY', action: 'VIEW', label: 'View Salary & Slips', description: 'Display Salary in drawer and view slips' },
      { key: 'employee.salary.download', module: 'SALARY', action: 'DOWNLOAD', label: 'Download Payslip PDF', description: 'Download monthly payslip document' },
    ],
  },

  // 6. SYSTEM & UTILITIES
  {
    id: 'DASHBOARD',
    name: 'Dashboard Cards & Widgets',
    icon: Sparkles,
    category: 'SYSTEM',
    description: 'Home screen metrics, performance widgets, and quick action cards',
    permissions: [
      { key: 'employee.dashboard.view', module: 'DASHBOARD', action: 'VIEW', label: 'View Dashboard', description: 'Display Dashboard home screen' },
      { key: 'employee.dashboard.card_stats', module: 'DASHBOARD', action: 'CARD_STATS', label: 'Stats Overview Card', description: 'Show summary KPI stats' },
      { key: 'employee.dashboard.card_leads', module: 'DASHBOARD', action: 'CARD_LEADS', label: 'Open Leads Widget', description: 'Show open leads card' },
      { key: 'employee.dashboard.card_visits', module: 'DASHBOARD', action: 'CARD_VISITS', label: 'Visits Widget', description: 'Show today field visits card' },
      { key: 'employee.dashboard.card_work', module: 'DASHBOARD', action: 'CARD_WORK', label: 'Work Deliverables Card', description: 'Show active SSM deliverables card' },
      { key: 'employee.dashboard.card_proposals', module: 'DASHBOARD', action: 'CARD_PROPOSALS', label: 'Proposals Card', description: 'Show pending quotes card' },
      { key: 'employee.dashboard.card_employees', module: 'DASHBOARD', action: 'CARD_EMPLOYEES', label: 'Team Widget', description: 'Show active team card' },
    ],
  },
  {
    id: 'NOTIFICATIONS',
    name: 'Notifications Center',
    icon: AlertCircle,
    category: 'SYSTEM',
    description: 'In-app notifications feed, mark read, and broadcasts',
    permissions: [
      { key: 'employee.notifications.view', module: 'NOTIFICATIONS', action: 'VIEW', label: 'View Notifications', description: 'Display notification bell and alert feed' },
      { key: 'employee.notifications.read', module: 'NOTIFICATIONS', action: 'READ', label: 'Mark Read', description: 'Mark alerts as read' },
      { key: 'employee.notifications.mark_all_read', module: 'NOTIFICATIONS', action: 'MARK_ALL_READ', label: 'Mark All Read', description: 'Clear unread notification badge' },
      { key: 'employee.notifications.send', module: 'NOTIFICATIONS', action: 'SEND', label: 'Send Alerts', description: 'Broadcast push notifications' },
    ],
  },
  {
    id: 'PROFILE',
    name: 'Profile & Account',
    icon: User,
    category: 'SYSTEM',
    description: 'User profile tab, contact editing, and avatar',
    permissions: [
      { key: 'employee.profile.view', module: 'PROFILE', action: 'VIEW', label: 'View Profile', description: 'Display Profile tab in bottom navigation' },
      { key: 'employee.profile.edit', module: 'PROFILE', action: 'EDIT', label: 'Edit Profile', description: 'Update profile information and avatar' },
    ],
  },
  {
    id: 'SETTINGS',
    name: 'Settings Screen',
    icon: Sliders,
    category: 'SYSTEM',
    description: 'Application preferences, notification tiles, and security',
    permissions: [
      { key: 'employee.settings.view', module: 'SETTINGS', action: 'VIEW', label: 'View Settings', description: 'Display Settings menu in drawer' },
      { key: 'employee.settings.profile', module: 'SETTINGS', action: 'SETTING_PROFILE', label: 'Profile Settings Section', description: 'Access profile tile in Settings' },
      { key: 'employee.settings.notifications', module: 'SETTINGS', action: 'SETTING_NOTIFICATIONS', label: 'Notification Settings', description: 'Configure push alerts preferences' },
      { key: 'employee.settings.integrations', module: 'SETTINGS', action: 'SETTING_INTEGRATIONS', label: 'Integrations Section', description: 'Third-party integrations' },
      { key: 'employee.settings.users', module: 'SETTINGS', action: 'SETTING_USERS', label: 'User Management Section', description: 'Role and permission management tile' },
    ],
  },
];

// Helper to normalize keys to dot format
function toKey(mod: string, act: string): string {
  return `employee.${mod.toLowerCase()}.${act.toLowerCase()}`;
}

interface RoleItem {
  id: string;
  name: string;
  type: string;
  description: string;
  permissionsCount: number;
  usersCount: number;
  isSystem: boolean;
  permissions?: { module: string; action: string; key?: string; description?: string }[];
}

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();

  // Top-level Navigation: Main RBAC Tree vs. Work Modules Matrix vs. Overrides vs. Requests
  const [mainViewTab, setMainViewTab] = useState<'rbac-tree' | 'work-matrix' | 'overrides' | 'requests'>('rbac-tree');

  // Selected Role & Search
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Permission Search & Category Filter
  const [permSearch, setPermSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Active role permissions (Set of keys: e.g. "employee.leads.view")
  const [localPerms, setLocalPerms] = useState<Set<string>>(new Set());
  const [serverPerms, setServerPerms] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Role Drawer (Create / Edit metadata)
  const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '', templateRole: 'TELECALLER' });

  // Mobile Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 1. Fetch Roles from Backend API
  const { data: rolesData, isLoading: isRolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['admin-rbac-roles'],
    queryFn: async () => {
      const res: any = await api.get('/auth/roles');
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
  });

  const roles: RoleItem[] = useMemo(() => {
    return (rolesData || []).map((r: any) => ({
      id: String(r.id),
      name: r.name,
      type: r.type || 'CUSTOM',
      description: r.description || '',
      permissionsCount: r.permissionsCount || r.permissions?.length || 0,
      usersCount: r.usersCount || 0,
      isSystem: Boolean(r.isSystem),
      permissions: r.permissions || [],
    }));
  }, [rolesData]);

  // Filtered Roles for Sidebar
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  // Selected Role Item
  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null;
  }, [roles, selectedRoleId]);

  // Auto-select first role on load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  // 2. Fetch Permissions for the selected role
  const { data: rolePermsData, isLoading: isPermsLoading, refetch: refetchRolePerms } = useQuery({
    queryKey: ['admin-role-perms', selectedRole?.id],
    enabled: Boolean(selectedRole?.id),
    queryFn: async () => {
      const res: any = await api.get(`/auth/roles/${selectedRole!.id}/permissions`);
      const payload = res?.data || res;
      const keys: string[] = [];
      if (Array.isArray(payload?.permissions)) {
        payload.permissions.forEach((p: any) => {
          if (p.key) keys.push(p.key);
          else if (p.module && p.action) keys.push(toKey(p.module, p.action));
        });
      }
      return keys;
    },
  });

  // Sync server permissions to local state when fetched or role changes
  useEffect(() => {
    if (rolePermsData) {
      const newSet = new Set(rolePermsData);
      setServerPerms(newSet);
      setLocalPerms(new Set(newSet));
    }
  }, [rolePermsData, selectedRole?.id]);

  // Expand all by default initially
  useEffect(() => {
    const allExp: Record<string, boolean> = {};
    PERMISSION_MODULE_GROUPS.forEach((g) => {
      allExp[g.id] = true;
    });
    setExpandedModules(allExp);
  }, []);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (localPerms.size !== serverPerms.size) return true;
    for (const k of localPerms) {
      if (!serverPerms.has(k)) return true;
    }
    return false;
  }, [localPerms, serverPerms]);

  // Handle switching role safely
  const handleSelectRole = (roleId: string) => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved permission changes. Discard and switch role?')) {
        setSelectedRoleId(roleId);
      }
    } else {
      setSelectedRoleId(roleId);
    }
  };

  // Toggle single permission key
  const handleToggleKey = (key: string) => {
    setLocalPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Toggle entire module (Parent Checkbox with Select/Deselect All)
  const handleToggleModule = (module: ModuleGroup) => {
    const allKeys = module.permissions.map((p) => p.key);
    const allChecked = allKeys.every((k) => localPerms.has(k));

    setLocalPerms((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        // Deselect all
        allKeys.forEach((k) => next.delete(k));
      } else {
        // Select all
        allKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  // Determine module checkbox state: "checked" | "indeterminate" | "unchecked"
  const getModuleCheckState = (module: ModuleGroup): 'checked' | 'indeterminate' | 'unchecked' => {
    const total = module.permissions.length;
    if (total === 0) return 'unchecked';
    const checkedCount = module.permissions.filter((p) => localPerms.has(p.key)).length;
    if (checkedCount === total) return 'checked';
    if (checkedCount > 0) return 'indeterminate';
    return 'unchecked';
  };

  // Expand / Collapse all
  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    PERMISSION_MODULE_GROUPS.forEach((g) => (next[g.id] = true));
    setExpandedModules(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    PERMISSION_MODULE_GROUPS.forEach((g) => (next[g.id] = false));
    setExpandedModules(next);
  };

  // Select all / Clear all permissions for this role
  const handleSelectAll = () => {
    const next = new Set<string>();
    PERMISSION_MODULE_GROUPS.forEach((g) => {
      g.permissions.forEach((p) => next.add(p.key));
    });
    setLocalPerms(next);
  };

  const handleClearAll = () => {
    setLocalPerms(new Set());
  };

  // Reset to default template based on role name
  const handleResetToTemplate = () => {
    if (!selectedRole) return;
    const upper = selectedRole.name.toUpperCase().replace(/\s+/g, '_');
    const templateName = upper.includes('TELECALL')
      ? 'TELECALLER'
      : upper.includes('DESIGN')
      ? 'DESIGNER'
      : upper.includes('EDIT')
      ? 'EDITOR'
      : upper.includes('SOCIAL') || upper.includes('SSM')
      ? 'SOCIAL_MEDIA_MANAGER'
      : upper.includes('PHOTO') || upper.includes('SHOOT')
      ? 'PHOTOGRAPHER'
      : 'TELECALLER';

    const templateKeys = new Set<string>();
    PERMISSION_MODULE_GROUPS.forEach((g) => {
      g.permissions.forEach((p) => {
        if (templateName === 'TELECALLER') {
          // Calendar & My Work & Creative OFF
          if (['CALENDAR', 'MY_WORK', 'CREATIVE_WORK'].includes(p.module)) return;
          if (['LEADS', 'FOLLOW_UP', 'VISITS', 'ATTENDANCE', 'LEAVE', 'PROFILE', 'DASHBOARD'].includes(p.module)) {
            templateKeys.add(p.key);
          }
        } else if (['DESIGNER', 'EDITOR', 'PHOTOGRAPHER'].includes(templateName)) {
          // Calendar & My Work & Creative ON, CRM OFF
          if (['LEADS', 'FOLLOW_UP', 'VISITS', 'PROPOSALS', 'PACKAGES', 'PAYMENTS', 'WORK_EXECUTION'].includes(p.module)) return;
          if (['CALENDAR', 'MY_WORK', 'CREATIVE_WORK', 'ATTENDANCE', 'TASKS', 'SALARY', 'PROFILE', 'DASHBOARD'].includes(p.module)) {
            templateKeys.add(p.key);
          }
        } else if (templateName === 'SOCIAL_MEDIA_MANAGER') {
          if (['LEADS', 'FOLLOW_UP', 'VISITS', 'PROPOSALS', 'PACKAGES', 'PAYMENTS'].includes(p.module)) return;
          templateKeys.add(p.key);
        }
      });
    });

    setLocalPerms(templateKeys);
    toast.success(`Reset to ${templateName} template presets!`);
  };

  // Save Permissions to Backend
  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const keysList = Array.from(localPerms);
      await api.put(`/auth/roles/${selectedRole.id}/permissions`, {
        permissions: keysList,
      });
      setServerPerms(new Set(localPerms));
      toast.success(`Permissions saved successfully for ${selectedRole.name}!`);
      await queryClient.invalidateQueries({ queryKey: ['admin-rbac-roles'] });
      await refetchRoles();
      await refetchRolePerms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  // Create or Edit Role Form
  const handleOpenCreateRole = () => {
    setDrawerMode('create');
    setRoleFormData({ name: '', description: '', templateRole: 'TELECALLER' });
    setIsRoleDrawerOpen(true);
  };

  const handleOpenEditRole = (role: RoleItem) => {
    setDrawerMode('edit');
    setRoleFormData({ name: role.name, description: role.description, templateRole: 'TELECALLER' });
    setIsRoleDrawerOpen(true);
  };

  const handleSaveRoleForm = async () => {
    if (!roleFormData.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      if (drawerMode === 'create') {
        const res: any = await api.post('/auth/roles', {
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim(),
        });
        const created = res?.data || res;
        toast.success(`Role "${roleFormData.name}" created!`);
        setIsRoleDrawerOpen(false);
        await refetchRoles();
        if (created?.id) setSelectedRoleId(String(created.id));
      } else {
        await api.put(`/auth/roles/${selectedRole!.id}`, {
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim(),
        });
        toast.success('Role updated successfully!');
        setIsRoleDrawerOpen(false);
        await refetchRoles();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.isSystem) {
      toast.error('System roles cannot be deleted');
      return;
    }
    if (!confirm(`Are you sure you want to deactivate role "${selectedRole.name}"?`)) return;

    try {
      await api.delete(`/auth/roles/${selectedRole.id}`);
      toast.success(`Role "${selectedRole.name}" deactivated`);
      await refetchRoles();
      setSelectedRoleId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete role');
    }
  };

  // Filter modules by Category and Search
  const filteredModules = useMemo(() => {
    return PERMISSION_MODULE_GROUPS.filter((group) => {
      // Category filter
      if (selectedCategory !== 'ALL' && group.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!permSearch.trim()) return true;
      const q = permSearch.toLowerCase();
      const matchGroupName = group.name.toLowerCase().includes(q);
      const matchDesc = group.description.toLowerCase().includes(q);
      const matchPerms = group.permissions.some(
        (p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      );
      return matchGroupName || matchDesc || matchPerms;
    });
  }, [selectedCategory, permSearch]);

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#1AA14D] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Roles & UI Permissions</h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage Employee Mobile App navigation, screen visibility, and granular action-level authorization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCreateRole}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {/* 2. Unsaved Changes Sticky Notification Banner */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                You have unsaved permission changes for <span className="underline">{selectedRole?.name}</span>.
              </p>
              <p className="text-[11px] text-amber-700">
                Changes will not take effect on employee mobile devices until saved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocalPerms(new Set(serverPerms))}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save Permissions'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR: ROLES LIST (Cols: 4) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Employee Roles</span>
            <span className="text-[11px] font-bold text-slate-400">{filteredRoles.length} Roles</span>
          </div>

          {/* Search Role */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder="Search roles..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#23C45E]"
            />
          </div>

          {/* Role Cards List */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredRoles.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-50/60 border-[#23C45E] shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{role.name}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        role.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {role.isSystem ? 'System' : 'Custom'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                    {role.description || 'Employee role'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                    <span>{role.permissionsCount} Permissions</span>
                    <span>{role.usersCount} Staff</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: PERMISSION TREE & PREVIEW (Cols: 8) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRole ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
              {/* Role Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900">{selectedRole.name}</h2>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedRole.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedRole.isSystem ? 'System Role' : 'Custom Role'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedRole.description || 'Configured permissions govern mobile navigation, tabs, and actions.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#1AA14D]" />
                    <span>Preview Mobile UI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditRole(selectedRole)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Edit Role Info"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {!selectedRole.isSystem && (
                    <button
                      type="button"
                      onClick={handleDeleteRole}
                      className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Deactivate Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Toolbar: Category Filters & Search */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(
                      [
                        { id: 'ALL', label: 'All Modules' },
                        { id: 'CRM', label: 'CRM Workflow' },
                        { id: 'WORKSPACE', label: 'My Work & Tasks' },
                        { id: 'CALENDAR', label: 'Calendar' },
                        { id: 'CREATIVE', label: 'Creative / SSM' },
                        { id: 'HRM', label: 'HRM Suite' },
                        { id: 'SYSTEM', label: 'System' },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          selectedCategory === c.id
                            ? 'bg-[#23C45E] text-slate-950 shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Count */}
                  <div className="text-xs font-extrabold text-slate-700 shrink-0">
                    Active: <span className="text-[#1AA14D] font-black">{localPerms.size}</span> permissions
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      placeholder="Search permissions or module..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#23C45E]"
                    />
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleExpandAll}
                      className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                    >
                      Expand All
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAll}
                      className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                    >
                      Collapse All
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2 py-1 text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToTemplate}
                      className="px-2 py-1 text-[11px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg cursor-pointer"
                      title="Reset to recommended default template"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Grouped Permission Tree */}
              <div className="space-y-3 pt-2">
                {filteredModules.map((group) => {
                  const checkState = getModuleCheckState(group);
                  const isExpanded = expandedModules[group.id] ?? true;
                  const Icon = group.icon;

                  return (
                    <div
                      key={group.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white transition-all shadow-2xs"
                    >
                      {/* Module Header with Indeterminate / Tri-state Checkbox */}
                      <div className="p-3.5 bg-slate-50/80 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          {/* Tri-state Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleModule(group)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                              checkState === 'checked'
                                ? 'bg-[#23C45E] border-[#23C45E] text-slate-950'
                                : checkState === 'indeterminate'
                                ? 'bg-[#23C45E]/20 border-[#23C45E] text-[#1AA14D]'
                                : 'bg-white border-slate-300 hover:border-slate-400'
                            }`}
                            title={
                              checkState === 'checked'
                                ? 'Deselect all in module'
                                : checkState === 'indeterminate'
                                ? 'Select remaining in module'
                                : 'Select all in module'
                            }
                          >
                            {checkState === 'checked' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            {checkState === 'indeterminate' && <Minus className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-black text-slate-900">{group.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">
                              ({group.permissions.filter((p) => localPerms.has(p.key)).length}/{group.permissions.length})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                            {group.description}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModules((prev) => ({ ...prev, [group.id]: !isExpanded }))
                            }
                            className="p-1 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Child Actions Checkboxes */}
                      {isExpanded && (
                        <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-white">
                          {group.permissions.map((perm) => {
                            const isChecked = localPerms.has(perm.key);
                            return (
                              <div
                                key={perm.key}
                                onClick={() => handleToggleKey(perm.key)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                                  isChecked
                                    ? 'bg-[#E8F9EE] border-[#23C45E]/40 shadow-xs'
                                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-extrabold text-slate-900">{perm.label}</span>
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                      {perm.action}
                                    </span>
                                  </div>
                                  <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                                    {perm.description}
                                  </p>
                                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                                    {perm.key}
                                  </span>
                                </div>

                                <div
                                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-colors ${
                                    isChecked
                                      ? 'bg-[#23C45E] border-[#23C45E] text-slate-950'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  {hasUnsavedChanges ? (
                    <span className="text-amber-600 font-bold">Unsaved changes ready to apply</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">All permissions synchronized with server</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Preview Mobile UI
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`flex items-center gap-1.5 px-5 py-2 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer ${
                      hasUnsavedChanges
                        ? 'bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving...' : 'Save Permissions'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Select a role from the left sidebar to configure its permissions.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MOBILE UI PREVIEW SIMULATOR MODAL */}
      {/* ========================================================= */}
      {isPreviewOpen && selectedRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#23C45E]" />
                  <h3 className="text-sm font-black">Employee Mobile App Preview</h3>
                </div>
                <p className="text-[11px] text-slate-400">
                  Simulated navigation for role: <span className="text-[#23C45E] font-bold">{selectedRole.name}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Device Mockup */}
            <div className="p-6 bg-slate-100 flex justify-center">
              <div className="w-[320px] bg-white rounded-3xl shadow-xl border-4 border-slate-800 overflow-hidden flex flex-col h-[520px]">
                {/* Mobile Status Bar */}
                <div className="bg-slate-900 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <span>09:41</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2 rounded-xs border border-slate-300 relative">
                      <div className="h-full bg-emerald-400 w-3" />
                    </div>
                  </div>
                </div>

                {/* Mobile App Header */}
                <div className="bg-white p-3 border-b border-slate-100 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#23C45E]/10 text-[#1AA14D] flex items-center justify-center font-black text-xs">
                      QB
                    </div>
                    <span className="text-xs font-black text-slate-900">QuikBoom CRM</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {selectedRole.name}
                  </span>
                </div>

                {/* Mobile Body Content (Drawer & Active Modules Simulation) */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
                  {/* Authorized Drawer Modules */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      Visible in Menu / Drawer
                    </span>

                    <div className="space-y-1">
                      {localPerms.has('employee.leads.view') && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>Leads Pipeline</span>
                        </div>
                      )}
                      {localPerms.has('employee.followups.view') && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Follow-ups</span>
                        </div>
                      )}
                      {localPerms.has('employee.visits.view') && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Field Visits</span>
                        </div>
                      )}
                      {localPerms.has('employee.my_work.view') && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800 flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                          <span>My Work (Creative)</span>
                        </div>
                      )}
                      {localPerms.has('employee.creative_work.view') && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5 text-purple-500" />
                          <span>Social Media Work</span>
                        </div>
                      )}
                      {localPerms.has('employee.packages.view') && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-amber-500" />
                          <span>Packages</span>
                        </div>
                      )}
                      {localPerms.has('employee.attendance.view') && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Clock3 className="w-3.5 h-3.5 text-teal-500" />
                          <span>Attendance Punch</span>
                        </div>
                      )}
                      {localPerms.has('employee.tasks.view') && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Assigned Tasks</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unavailable / Hidden Modules Section */}
                  <div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-wider block mb-1.5">
                      Hidden / Restricted Modules
                    </span>

                    <div className="space-y-1">
                      {!localPerms.has('employee.calendar.view') && (
                        <div className="p-1.5 rounded-lg bg-red-50/60 border border-red-200/60 text-[11px] font-medium text-red-700 flex items-center justify-between">
                          <span>Calendar</span>
                          <span className="text-[9px] font-bold uppercase text-red-500">Restricted</span>
                        </div>
                      )}
                      {!localPerms.has('employee.my_work.view') && (
                        <div className="p-1.5 rounded-lg bg-red-50/60 border border-red-200/60 text-[11px] font-medium text-red-700 flex items-center justify-between">
                          <span>My Work</span>
                          <span className="text-[9px] font-bold uppercase text-red-500">Restricted</span>
                        </div>
                      )}
                      {!localPerms.has('employee.leads.view') && (
                        <div className="p-1.5 rounded-lg bg-red-50/60 border border-red-200/60 text-[11px] font-medium text-red-700 flex items-center justify-between">
                          <span>CRM Leads</span>
                          <span className="text-[9px] font-bold uppercase text-red-500">Restricted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Bottom Navigation Bar Simulation */}
                <div className="bg-white border-t border-slate-200 p-2 flex items-center justify-around">
                  {/* Home (Dashboard) */}
                  <div className="flex flex-col items-center gap-0.5 text-[#1AA14D]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Home</span>
                  </div>

                  {/* Calendar: Visible only if calendar.view is ON */}
                  {localPerms.has('employee.calendar.view') ? (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Calendar</span>
                    </div>
                  ) : null}

                  {/* My Work: Visible only if my_work.view is ON */}
                  {localPerms.has('employee.my_work.view') ? (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[9px] font-bold">My Work</span>
                    </div>
                  ) : null}

                  {/* Attendance: Visible if attendance.view is ON */}
                  {localPerms.has('employee.attendance.view') ? (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Clock3 className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Attendance</span>
                    </div>
                  ) : null}

                  {/* Profile: Always present */}
                  <div className="flex flex-col items-center gap-0.5 text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Profile</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CREATE / EDIT ROLE DRAWER */}
      {/* ========================================================= */}
      <AdminFormDrawer
        isOpen={isRoleDrawerOpen}
        onClose={() => setIsRoleDrawerOpen(false)}
        title={drawerMode === 'create' ? 'Create Security Role' : `Edit Role: ${selectedRole?.name}`}
        subtitle="Specify role title and descriptive purpose for employee access"
        isSubmitting={false}
        maxWidth="sm:max-w-[500px]"
        showFooter={true}
        onSave={handleSaveRoleForm}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Role Title</label>
            <input
              type="text"
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              placeholder="e.g. Telecaller, Designer, Video Editor..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#23C45E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Role Description</label>
            <textarea
              rows={3}
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              placeholder="Scope of work and permissions granted to staff holding this role..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#23C45E]"
            />
          </div>
        </div>
      </AdminFormDrawer>
    </div>
  );
}
