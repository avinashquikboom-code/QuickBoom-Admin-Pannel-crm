'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Target,
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
  RotateCcw,
  Unlock,
  Lock,
  ExternalLink,
  Power,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AdminPageHeader, AdminButton, AdminFormDrawer } from '@/components/admin';

// ---------------------------------------------------------------------------
// PERMISSION TREE DEFINITIONS (Categorized & Normalized Granular Model)
// ---------------------------------------------------------------------------

interface PermissionNode {
  key: string;
  module: string;
  action: string;
  label: string;
  description: string;
}

type PermissionCategory =
  | 'CRM'
  | 'WORKSPACE'
  | 'CALENDAR'
  | 'CREATIVE'
  | 'HRM'
  | 'SYSTEM'
  | 'CUSTOMER';

interface ModuleGroup {
  id: string;
  name: string;
  icon: any;
  category: PermissionCategory;
  description: string;
  permissions: PermissionNode[];
}

const CATEGORY_DEFINITIONS: { id: PermissionCategory; name: string; icon: any }[] = [
  { id: 'CRM', name: 'CRM WORKFLOW', icon: Users },
  { id: 'WORKSPACE', name: 'MY WORK & TASKS', icon: Briefcase },
  { id: 'CALENDAR', name: 'CALENDAR', icon: Calendar },
  { id: 'CREATIVE', name: 'CREATIVE / SSM', icon: Share2 },
  { id: 'HRM', name: 'HRM / WORKPLACE', icon: Clock3 },
  { id: 'SYSTEM', name: 'SYSTEM', icon: Sliders },
  { id: 'CUSTOMER', name: 'CUSTOMER MOBILE', icon: Smartphone },
];

const PERMISSION_MODULE_GROUPS: ModuleGroup[] = [
  // =========================================================================
  // 1. CRM WORKFLOW
  // =========================================================================
  {
    id: 'LEADS',
    name: 'Leads & Inquiries',
    icon: Users,
    category: 'CRM',
    description: 'CRM lead acquisition pipeline, telecalling, and stage status changes',
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
    id: 'DATA_CAPTURE',
    name: 'Data Capture & Places',
    icon: Target,
    category: 'CRM',
    description: 'Prospect extraction from Google Places, manual lead capture, and bulk CRM imports',
    permissions: [
      { key: 'employee.data_capture.view', module: 'DATA_CAPTURE', action: 'VIEW', label: 'View Data Capture', description: 'Display Data Capture screen, search places, and view extraction history' },
      { key: 'employee.data_capture.create', module: 'DATA_CAPTURE', action: 'CREATE', label: 'Create / Extract Records', description: 'Execute new Google Places extraction or manual entry' },
      { key: 'employee.data_capture.edit', module: 'DATA_CAPTURE', action: 'EDIT', label: 'Edit / Validate / Import', description: 'Edit captured records, validate status, or import to CRM Leads' },
      { key: 'employee.data_capture.delete', module: 'DATA_CAPTURE', action: 'DELETE', label: 'Delete Records', description: 'Remove captured prospects or extraction jobs' },
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
    description: 'Service bundle catalog, pricing, and offering toggling',
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
    description: 'Client invoices, payment logs, and transaction records',
    permissions: [
      { key: 'employee.payments.view', module: 'PAYMENTS', action: 'VIEW', label: 'View Payments', description: 'Display Payments in navigation' },
      { key: 'employee.payments.create', module: 'PAYMENTS', action: 'CREATE', label: 'Record Payment', description: 'Log incoming client payment transaction' },
      { key: 'employee.payments.edit', module: 'PAYMENTS', action: 'EDIT', label: 'Edit Payment', description: 'Update payment record details' },
      { key: 'employee.payments.delete', module: 'PAYMENTS', action: 'DELETE', label: 'Delete Payment', description: 'Remove payment transaction' },
      { key: 'employee.payments.export', module: 'PAYMENTS', action: 'EXPORT', label: 'Export Payments', description: 'Export payment statements' },
    ],
  },
  {
    id: 'CUSTOMERS',
    name: 'Customer Directory',
    icon: Building2,
    category: 'CRM',
    description: 'Client master accounts, plan quotas, and company profiles',
    permissions: [
      { key: 'employee.customers.view', module: 'CUSTOMERS', action: 'VIEW', label: 'View Customers', description: 'Display Customers directory in drawer' },
      { key: 'employee.customers.create', module: 'CUSTOMERS', action: 'CREATE', label: 'Add Customer', description: 'Create new company client account' },
      { key: 'employee.customers.edit', module: 'CUSTOMERS', action: 'EDIT', label: 'Edit Customer', description: 'Update client profile details' },
      { key: 'employee.customers.delete', module: 'CUSTOMERS', action: 'DELETE', label: 'Delete Customer', description: 'Remove or archive customer' },
      { key: 'employee.customers.export', module: 'CUSTOMERS', action: 'EXPORT', label: 'Export Customers', description: 'Export customer list' },
    ],
  },

  // =========================================================================
  // 2. MY WORK & TASKS
  // =========================================================================
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
      { key: 'employee.my_work.submit', module: 'MY_WORK', action: 'SUBMIT', label: 'Submit for Review', description: 'Submit creative for supervisory review' },
      { key: 'employee.my_work.complete', module: 'MY_WORK', action: 'COMPLETE', label: 'Mark Complete', description: 'Mark deliverable fully finished' },
    ],
  },
  {
    id: 'TASKS',
    name: 'Assigned Tasks',
    icon: CheckCheck,
    category: 'WORKSPACE',
    description: 'Operational tasks, photo proofs, and internal checklists',
    permissions: [
      { key: 'employee.tasks.view', module: 'TASKS', action: 'VIEW', label: 'View Tasks', description: 'Display Tasks in drawer and view task board' },
      { key: 'employee.tasks.create', module: 'TASKS', action: 'CREATE', label: 'Create Task', description: 'Assign new task to team or self' },
      { key: 'employee.tasks.start', module: 'TASKS', action: 'START', label: 'Start Task', description: 'Clock in on assigned task' },
      { key: 'employee.tasks.update', module: 'TASKS', action: 'UPDATE', label: 'Update Task', description: 'Update task checklist and notes' },
      { key: 'employee.tasks.submit_proof', module: 'TASKS', action: 'SUBMIT_PROOF', label: 'Submit Photo Proof', description: 'Upload camera proof of completion' },
      { key: 'employee.tasks.complete', module: 'TASKS', action: 'COMPLETE', label: 'Complete Task', description: 'Mark task done' },
      { key: 'employee.tasks.approve', module: 'TASKS', action: 'APPROVE', label: 'Approve Task', description: 'Manager sign-off on completed task' },
      { key: 'employee.tasks.edit', module: 'TASKS', action: 'EDIT', label: 'Edit Task', description: 'Modify task deadlines and priority' },
      { key: 'employee.tasks.delete', module: 'TASKS', action: 'DELETE', label: 'Delete Task', description: 'Remove task from board' },
    ],
  },
  {
    id: 'WORK_EXECUTION',
    name: 'Work Execution (Projects)',
    icon: Layers,
    category: 'WORKSPACE',
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

  // =========================================================================
  // 3. CALENDAR
  // =========================================================================
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

  // =========================================================================
  // 4. CREATIVE / SSM WORK
  // =========================================================================
  {
    id: 'CREATIVE_WORK',
    name: 'Creative & Social Media Work',
    icon: Share2,
    category: 'CREATIVE',
    description: 'SSM post briefs, reel scheduling, approvals, and media review',
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

  // =========================================================================
  // 5. HRM & WORKPLACE
  // =========================================================================
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

  // =========================================================================
  // 6. SYSTEM & UTILITIES
  // =========================================================================
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

  // =========================================================================
  // CUSTOMER MOBILE APP
  // =========================================================================
  {
    id: 'CUSTOMER_HOME',
    name: 'Home',
    icon: Smartphone,
    category: 'CUSTOMER',
    description: 'Customer mobile home tab',
    permissions: [
      { key: 'employee.customer_home.view', module: 'CUSTOMER_HOME', action: 'VIEW', label: 'View Home', description: 'Show the home tab' },
    ],
  },
  {
    id: 'CUSTOMER_PLANS',
    name: 'Plans',
    icon: Package,
    category: 'CUSTOMER',
    description: 'Subscription plans and checkout',
    permissions: [
      { key: 'employee.customer_plans.view', module: 'CUSTOMER_PLANS', action: 'VIEW', label: 'View Plans', description: 'Show subscription plans' },
      { key: 'employee.customer_plans.create', module: 'CUSTOMER_PLANS', action: 'CREATE', label: 'Purchase Plan', description: 'Allow plan checkout' },
    ],
  },
  {
    id: 'CUSTOMER_TRENDING',
    name: 'Trending',
    icon: Sparkles,
    category: 'CUSTOMER',
    description: 'Trending content tab',
    permissions: [
      { key: 'employee.customer_trending.view', module: 'CUSTOMER_TRENDING', action: 'VIEW', label: 'View Trending', description: 'Show the trending tab' },
    ],
  },
  {
    id: 'CUSTOMER_ORDERS',
    name: 'Orders',
    icon: FileText,
    category: 'CUSTOMER',
    description: 'Customer orders',
    permissions: [
      { key: 'employee.customer_orders.view', module: 'CUSTOMER_ORDERS', action: 'VIEW', label: 'View Orders', description: 'Show this customer’s orders' },
    ],
  },
  {
    id: 'CUSTOMER_INVOICES',
    name: 'Invoices',
    icon: CreditCard,
    category: 'CUSTOMER',
    description: 'Customer invoices and downloads',
    permissions: [
      { key: 'employee.customer_invoices.view', module: 'CUSTOMER_INVOICES', action: 'VIEW', label: 'View Invoices', description: 'Show this customer’s invoices' },
      { key: 'employee.customer_invoices.download', module: 'CUSTOMER_INVOICES', action: 'DOWNLOAD', label: 'Download Invoice', description: 'Download invoice or receipt files' },
    ],
  },
  {
    id: 'CUSTOMER_PROFILE',
    name: 'Profile',
    icon: User,
    category: 'CUSTOMER',
    description: 'Account profile',
    permissions: [
      { key: 'employee.customer_profile.view', module: 'CUSTOMER_PROFILE', action: 'VIEW', label: 'View Profile', description: 'Show the account tab' },
      { key: 'employee.customer_profile.edit', module: 'CUSTOMER_PROFILE', action: 'EDIT', label: 'Edit Profile', description: 'Allow profile updates' },
    ],
  },
  {
    id: 'CUSTOMER_CALENDAR',
    name: 'Calendar',
    icon: Calendar,
    category: 'CUSTOMER',
    description: 'Customer calendar',
    permissions: [
      { key: 'employee.customer_calendar.view', module: 'CUSTOMER_CALENDAR', action: 'VIEW', label: 'View Calendar', description: 'Show the customer calendar' },
    ],
  },
  {
    id: 'CUSTOMER_SSM',
    name: 'SSM Account Access',
    icon: Share2,
    category: 'CUSTOMER',
    description: 'Social media account access',
    permissions: [
      { key: 'employee.customer_ssm.view', module: 'CUSTOMER_SSM', action: 'VIEW', label: 'View SSM Access', description: 'Show social media account access' },
    ],
  },
  {
    id: 'CUSTOMER_INFLUENCERS',
    name: 'Influencer Hub',
    icon: Users,
    category: 'CUSTOMER',
    description: 'Influencer hub and bookings',
    permissions: [
      { key: 'employee.customer_influencers.view', module: 'CUSTOMER_INFLUENCERS', action: 'VIEW', label: 'View Influencer Hub', description: 'Show the influencer hub' },
      { key: 'employee.customer_influencer_bookings.view', module: 'CUSTOMER_INFLUENCER_BOOKINGS', action: 'VIEW', label: 'View Bookings', description: 'Show this customer’s influencer bookings' },
    ],
  },
  {
    id: 'CUSTOMER_NOTIFICATIONS',
    name: 'Notifications',
    icon: AlertCircle,
    category: 'CUSTOMER',
    description: 'Customer notifications',
    permissions: [
      { key: 'employee.customer_notifications.view', module: 'CUSTOMER_NOTIFICATIONS', action: 'VIEW', label: 'View Notifications', description: 'Show notifications' },
    ],
  },
  {
    id: 'CUSTOMER_SUPPORT',
    name: 'Support',
    icon: ShieldCheck,
    category: 'CUSTOMER',
    description: 'Support and help desk',
    permissions: [
      { key: 'employee.customer_support.view', module: 'CUSTOMER_SUPPORT', action: 'VIEW', label: 'View Support', description: 'Show support and help' },
      { key: 'employee.customer_support.create', module: 'CUSTOMER_SUPPORT', action: 'CREATE', label: 'Create Support Request', description: 'Allow submitting a support request' },
    ],
  },
  {
    id: 'CUSTOMER_MARKETING',
    name: 'Marketing & Offers',
    icon: Target,
    category: 'CUSTOMER',
    description: 'Promotional banners, coupon offers and marketing videos shown on Customer Home',
    permissions: [
      { key: 'employee.customer_marketing.view', module: 'CUSTOMER_MARKETING', action: 'VIEW', label: 'View Marketing & Offers', description: 'Show promotional banners, coupon carousels and marketing videos' },
    ],
  },
];

// Helper to normalize keys to dot format
function toKey(mod: string, act: string): string {
  return `employee.${mod.toLowerCase()}.${act.toLowerCase()}`;
}

interface RoleItem {
  id: string;          // designationId (used as the canonical role identifier)
  roleId?: string;     // underlying Role table id (kept for reference only)
  name: string;
  rawName?: string;
  type: string;
  description: string;
  permissionsCount: number;
  usersCount: number;
  isSystem: boolean;
  isActive: boolean;
  code?: string;
  audience?: 'EMPLOYEE' | 'CUSTOMER' | string;
  permissions?: { module: string; action: string; key?: string; description?: string }[];
}

function isCustomerRoleItem(r: {
  audience?: string;
  code?: string;
  name?: string;
  rawName?: string;
  permissions?: { module?: string }[];
}) {
  if (String(r.audience || '').toUpperCase() === 'CUSTOMER') return true;
  const code = String(r.code || '').toUpperCase();
  if (code === 'CUSTOMER' || code.startsWith('CUSTOMER_')) return true;
  const name = String(r.name || r.rawName || '').trim().toUpperCase();
  if (
    name === 'CUSTOMER' ||
    name === 'CUSTOMER ROLE' ||
    name === 'CUSTOMER MOBILE' ||
    name === 'CUSTOMER APP' ||
    name.startsWith('CUSTOMER ') ||
    name.endsWith(' CUSTOMER') ||
    name.includes('CUSTOMER MOBILE') ||
    name.includes('CUSTOMER APP')
  ) {
    return true;
  }
  const perms = r.permissions || [];
  return (
    perms.length > 0 &&
    perms.every((p) => String(p.module || '').toUpperCase().startsWith('CUSTOMER_'))
  );
}

function unwrapPermissionPayload(res: any) {
  if (res?.modules) return res;
  if (res?.data?.modules) return res.data;
  return res?.data || res;
}

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // TOP DUAL-TAB STATE: 'roles' (Role Permissions) vs 'employees' (Employee Overrides)
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'roles' | 'employees' | 'customers'>('roles');
  const [roleAudience, setRoleAudience] = useState<'employee' | 'customer'>('employee');

  // =========================================================================
  // TAB 1: ROLE PERMISSIONS STATE
  // =========================================================================
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [permSearch, setPermSearch] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const [localPerms, setLocalPerms] = useState<Set<string>>(new Set());
  const [serverPerms, setServerPerms] = useState<Set<string>>(new Set());
  const [localCrmAccess, setLocalCrmAccess] = useState<boolean>(false);
  const [serverCrmAccess, setServerCrmAccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // Role Drawer State — no longer used for creating roles (use Designations page)
  const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });

  // =========================================================================
  // TAB 2: EMPLOYEE PERMISSIONS STATE
  // =========================================================================
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [empOverrideEdits, setEmpOverrideEdits] = useState<Record<string, 'INHERIT' | 'ALLOW' | 'DENY'>>({});
  const [inheritOverride, setInheritOverride] = useState<boolean | null>(null);
  const [isSavingEmpPerms, setIsSavingEmpPerms] = useState(false);
  const [empCategoryFilter, setEmpCategoryFilter] = useState<string>('ALL');
  const [empModuleSearch, setEmpModuleSearch] = useState<string>('');
  const [expandedEmpModules, setExpandedEmpModules] = useState<Record<string, boolean>>({});

  // Mobile Preview Modal State (shared)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Employee-specific Reset & Restrict All Modals State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRestrictAllModalOpen, setIsRestrictAllModalOpen] = useState(false);
  const [isResettingPerms, setIsResettingPerms] = useState(false);
  const [isRestrictingAllPerms, setIsRestrictingAllPerms] = useState(false);

  // -------------------------------------------------------------------------
  // ─── 1. FETCH ROLES ─── source of truth: /designations/roles ──────────────
  // Designations are the single source of truth for Employee Roles.
  // /designations/roles auto-creates linked Role records on demand.
  const { data: rolesData, isLoading: isRolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['admin-rbac-roles'],
    queryFn: async () => {
      const res: any = await api.get('/designations/roles');
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    },
    retry: 1,
  });

  const roles: RoleItem[] = useMemo(() => {
    return (rolesData || []).map((r: any) => ({
      // id = designationId — this is what /designations/:id/permissions expects
      id: String(r.designationId ?? r.id),
      roleId: r.roleId ? String(r.roleId) : undefined,
      name: r.name,
      code: r.code,
      audience: isCustomerRoleItem(r) ? 'CUSTOMER' : r.audience || 'EMPLOYEE',
      rawName: r.rawName || r.name,
      type: r.type || 'CUSTOM',
      description: r.description || `${r.name} role`,
      permissionsCount: r.permissionsCount || r.permissions?.length || 0,
      usersCount: r.usersCount || 0,
      isSystem: Boolean(r.isSystem),
      isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
      permissions: r.permissions || [],
    }));
  }, [rolesData]);

  const customerRoles = useMemo(
    () => roles.filter((r) => isCustomerRoleItem(r)),
    [roles],
  );

  // Keep employee designations, hide obsolete generic EMPLOYEE role and customer roles
  const employeeRoles = useMemo(() => {
    const excludedNames = ['EMPLOYEE', 'EMPLOYEE ROLE'];
    const seen = new Set<string>();
    const result: RoleItem[] = [];

    for (const r of roles) {
      const raw = (r.rawName || r.name || '').trim().toUpperCase();
      const norm = (r.name || '').trim().toLowerCase();
      if (isCustomerRoleItem(r)) {
        continue;
      }
      if (excludedNames.includes(raw) || norm === 'employee') {
        continue;
      }
      if (seen.has(norm)) {
        continue;
      }
      seen.add(norm);
      result.push(r);
    }
    return result;
  }, [roles]);

  const currentAudienceRoles = useMemo(() => {
    return roleAudience === 'customer' ? customerRoles : employeeRoles;
  }, [roleAudience, customerRoles, employeeRoles]);

  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return currentAudienceRoles;
    const q = roleSearch.toLowerCase();
    return currentAudienceRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.rawName && r.rawName.toLowerCase().includes(q))
    );
  }, [currentAudienceRoles, roleSearch]);

  const selectedRole = useMemo(() => {
    return (
      currentAudienceRoles.find((r) => r.id === selectedRoleId) ||
      currentAudienceRoles[0] ||
      null
    );
  }, [currentAudienceRoles, selectedRoleId]);

  useEffect(() => {
    const activeList = roleAudience === 'customer' ? customerRoles : employeeRoles;
    if (activeList.length > 0 && (!selectedRoleId || !activeList.some((r) => r.id === selectedRoleId))) {
      setSelectedRoleId(activeList[0].id);
    }
  }, [roleAudience, customerRoles, employeeRoles, selectedRoleId]);

  // Fetch Permissions for Selected Designation-Role
  // Uses /designations/:designationId/permissions — the source-of-truth endpoint.
  const { data: rolePermsData, isLoading: isPermsLoading, refetch: refetchRolePerms } = useQuery({
    queryKey: ['admin-role-perms', selectedRole?.id],
    enabled: Boolean(selectedRole?.id),
    queryFn: async () => {
      const res: any = await api.get(`/designations/${selectedRole!.id}/permissions`);
      const payload = res?.data || res;
      const keys: string[] = [];
      if (Array.isArray(payload?.permissions)) {
        payload.permissions.forEach((p: any) => {
          if (p.key) keys.push(p.key);
          else if (p.module && p.action) keys.push(toKey(p.module, p.action));
        });
      }
      return {
        keys,
        crmMobileAccess: payload?.crmMobileAccess !== undefined
          ? Boolean(payload.crmMobileAccess)
          : Boolean((selectedRole as any)?.crmMobileAccess),
      };
    },
    retry: 1,
  });

  useEffect(() => {
    if (rolePermsData) {
      const newSet = new Set(rolePermsData.keys);
      setServerPerms(newSet);
      setLocalPerms(new Set(newSet));
      setServerCrmAccess(rolePermsData.crmMobileAccess);
      setLocalCrmAccess(rolePermsData.crmMobileAccess);
    }
  }, [rolePermsData, selectedRole?.id]);

  useEffect(() => {
    const allExp: Record<string, boolean> = {};
    PERMISSION_MODULE_GROUPS.forEach((g) => {
      allExp[g.id] = true;
    });
    setExpandedModules(allExp);
  }, []);

  const hasUnsavedRoleChanges = useMemo(() => {
    if (localCrmAccess !== serverCrmAccess) return true;
    if (localPerms.size !== serverPerms.size) return true;
    for (const k of localPerms) {
      if (!serverPerms.has(k)) return true;
    }
    return false;
  }, [localPerms, serverPerms, localCrmAccess, serverCrmAccess]);

  // -------------------------------------------------------------------------
  // 2. FETCH EMPLOYEES & INDIVIDUAL OVERRIDES (Backend API)
  // -------------------------------------------------------------------------
  const { data: employeesRes, isLoading: isEmployeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['admin-rbac-employees-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/employees', { params: { limit: 100 } });
        return Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.employees)
          ? res.employees
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
          ? res
          : [];
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  const { data: customersRes, isLoading: isCustomersLoading, refetch: refetchCustomers } = useQuery({
    queryKey: ['admin-rbac-customers-list'],
    queryFn: async () => {
      try {
        const res: any = await api.get('/customers', { params: { limit: 100, excludeAdmins: 'true' } });
        const raw =
          res?.data?.data ||
          res?.data?.items ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.items || []);
        return (Array.isArray(raw) ? raw : []).map((c: any) => {
          const displayName =
            c.contactFullName ||
            c.customerName ||
            c.companyName ||
            c.name ||
            'Customer';
          return {
            id: c.id,
            name: displayName,
            firstName: displayName,
            lastName: '',
            email: c.email,
            employeeCode: c.customerId || `CUST-${c.id}`,
            designation: { name: c.mobileRole?.name || 'Customer' },
            mobileRoleId: c.mobileRoleId || c.mobileRole?.id || null,
            roleName: c.mobileRole?.name || 'Customer',
          };
        });
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  const employeesList = useMemo(() => {
    return Array.isArray(employeesRes) ? employeesRes : [];
  }, [employeesRes]);

  const customersList = useMemo(() => {
    return Array.isArray(customersRes) ? customersRes : [];
  }, [customersRes]);

  const isCustomerOverrides = activeTab === 'customers';
  const permissionSubject: 'employee' | 'customer' =
    activeTab === 'customers' ||
    (activeTab === 'roles' && (roleAudience === 'customer' || (selectedRole ? isCustomerRoleItem(selectedRole) : false)))
      ? 'customer'
      : 'employee';
  const overrideList = isCustomerOverrides ? customersList : employeesList;
  const isOverrideListLoading = isCustomerOverrides ? isCustomersLoading : isEmployeesLoading;

  const filteredEmployees = useMemo(() => {
    const source = isCustomerOverrides ? customersList : employeesList;
    if (!empSearch.trim()) return source;
    const q = empSearch.toLowerCase();
    return source.filter((emp: any) => {
      const name = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.name || ''}`.toLowerCase();
      const role = (emp.roleName || emp.designation?.name || emp.designation || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      return name.includes(q) || role.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [employeesList, customersList, empSearch, isCustomerOverrides]);

  const selectedEmployee = useMemo(() => {
    const selectedId = isCustomerOverrides ? selectedCustomerId : selectedEmpId;
    return (
      overrideList.find((e: any) => String(e.id) === selectedId) ||
      overrideList[0] ||
      null
    );
  }, [overrideList, selectedEmpId, selectedCustomerId, isCustomerOverrides]);

  useEffect(() => {
    setSelectedRoleId('');
    setSelectedCategory('ALL');
    setPermSearch('');
  }, [roleAudience]);

  useEffect(() => {
    if (employeesList.length > 0 && !selectedEmpId) {
      setSelectedEmpId(String(employeesList[0].id));
    }
  }, [employeesList, selectedEmpId]);

  useEffect(() => {
    if (customersList.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(String(customersList[0].id));
    }
  }, [customersList, selectedCustomerId]);

  const {
    data: employeePermsRaw,
    isLoading: isEmployeePermsLoading,
    refetch: refetchEmployeePerms,
  } = useQuery({
    queryKey: ['admin-employee-permissions', selectedEmpId],
    enabled: Boolean(selectedEmpId) && activeTab === 'employees',
    queryFn: async () => {
      const res: any = await api.get(`/employees/${selectedEmpId}/permissions`);
      return unwrapPermissionPayload(res);
    },
    retry: 1,
  });

  const {
    data: customerPermsRaw,
    isLoading: isCustomerPermsLoading,
    refetch: refetchCustomerPerms,
  } = useQuery({
    queryKey: ['admin-customer-permissions', selectedCustomerId],
    enabled: Boolean(selectedCustomerId) && activeTab === 'customers',
    queryFn: async () => {
      const res: any = await api.get(`/customers/${selectedCustomerId}/mobile-permissions`);
      return unwrapPermissionPayload(res);
    },
    retry: 1,
  });

  const empPermsData = isCustomerOverrides
    ? customerPermsRaw ||
      (isCustomerPermsLoading
        ? undefined
        : {
            roleName: selectedEmployee?.roleName || selectedEmployee?.designation?.name || 'Customer',
            designationName: selectedEmployee?.designation?.name || 'Customer',
            mobileRoleId: selectedEmployee?.mobileRoleId || null,
            modules: PERMISSION_MODULE_GROUPS.filter((g) => g.category === 'CUSTOMER').map((g) => ({
              moduleKey: g.id,
              label: g.name,
              category: 'CUSTOMER',
              description: g.description,
              roleDefault: true,
              override: 'INHERIT',
              effective: true,
            })),
            granularPermissions: PERMISSION_MODULE_GROUPS.filter((g) => g.category === 'CUSTOMER').flatMap((g) =>
              g.permissions.map((p) => ({
                key: p.key,
                module: p.module,
                action: p.action,
                label: p.label,
                description: p.description,
                category: 'CUSTOMER',
                roleDefault: true,
                override: 'INHERIT',
                effective: true,
              })),
            ),
          })
    : employeePermsRaw;
  const isEmpPermsLoading = isCustomerOverrides ? isCustomerPermsLoading : isEmployeePermsLoading;
  const refetchEmpPerms = isCustomerOverrides ? refetchCustomerPerms : refetchEmployeePerms;

  const initialEmpOverrides: Record<string, 'INHERIT' | 'ALLOW' | 'DENY'> = useMemo(() => {
    const map: Record<string, 'INHERIT' | 'ALLOW' | 'DENY'> = {};
    if (empPermsData?.modules) {
      empPermsData.modules.forEach((m: any) => {
        map[m.moduleKey] = m.override || 'INHERIT';
      });
    }
    if (empPermsData?.granularPermissions) {
      empPermsData.granularPermissions.forEach((g: any) => {
        if (g.override && g.override !== 'INHERIT') {
          map[g.key] = g.override;
        }
      });
    }
    return map;
  }, [empPermsData]);

  useEffect(() => {
    setEmpOverrideEdits({});
    setExpandedEmpModules({});
    setInheritOverride(null);
  }, [selectedEmployee?.id]);

  const toggleEmpModuleExpand = (moduleKey: string) => {
    setExpandedEmpModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const handleExpandAllEmpModules = () => {
    const next: Record<string, boolean> = {};
    empPermsData?.modules?.forEach((m: any) => {
      next[m.moduleKey] = true;
    });
    setExpandedEmpModules(next);
  };

  const handleCollapseAllEmpModules = () => {
    setExpandedEmpModules({});
  };

  const getEmpModuleOverride = (key: string): 'INHERIT' | 'ALLOW' | 'DENY' => {
    if (empOverrideEdits[key] !== undefined) return empOverrideEdits[key];
    return initialEmpOverrides[key] || 'INHERIT';
  };

  const getEmpEffectiveStatus = (m: any): boolean => {
    const rawKey = typeof m === 'string' ? m : m?.key || m?.moduleKey;
    if (!rawKey) return false;

    // Direct override check
    const ov = getEmpModuleOverride(rawKey);
    if (ov === 'ALLOW') return true;
    if (ov === 'DENY') return false;

    // If it's a granular key like employee.data_capture.view, also check module override 'DATA_CAPTURE'
    if (rawKey.includes('.')) {
      const parts = rawKey.split('.');
      const modName = parts[1]?.toUpperCase();
      if (modName) {
        const modOv = getEmpModuleOverride(modName);
        if (modOv === 'ALLOW') return true;
        if (modOv === 'DENY') return false;
      }
    }
    if (rawKey.includes(':')) {
      const parts = rawKey.split(':');
      const modName = parts[0]?.toUpperCase();
      if (modName) {
        const modOv = getEmpModuleOverride(modName);
        if (modOv === 'ALLOW') return true;
        if (modOv === 'DENY') return false;
      }
    }

    if (typeof m === 'object' && m !== null && m.roleDefault !== undefined) {
      return Boolean(m.roleDefault);
    }

    // Lookup in granular permissions first
    const granularMatch = empPermsData?.granularPermissions?.find(
      (item: any) => item.key === rawKey || `${item.module}:${item.action}` === rawKey
    );
    if (granularMatch) {
      const gOv = getEmpModuleOverride(granularMatch.key);
      if (gOv === 'ALLOW') return true;
      if (gOv === 'DENY') return false;
      const modOv = getEmpModuleOverride(granularMatch.module);
      if (modOv === 'ALLOW') return true;
      if (modOv === 'DENY') return false;
      return Boolean(granularMatch.roleDefault);
    }

    // Lookup in modules
    const modKey = rawKey.includes('.') ? rawKey.split('.')[1]?.toUpperCase() : rawKey.toUpperCase();
    const found = empPermsData?.modules?.find(
      (item: any) => item.moduleKey.toUpperCase() === modKey
    );
    if (found) {
      const foundOv = getEmpModuleOverride(found.moduleKey);
      if (foundOv === 'ALLOW') return true;
      if (foundOv === 'DENY') return false;
      return Boolean(found.roleDefault);
    }

    return false;
  };

  const isInheritingRoleDefaults = useMemo(() => {
    if (inheritOverride !== null) return inheritOverride;
    const editKeys = Object.keys(empOverrideEdits);
    if (editKeys.length > 0) {
      return !editKeys.some((k) => empOverrideEdits[k] === 'ALLOW' || empOverrideEdits[k] === 'DENY');
    }
    if (empPermsData?.customPermissionsEnabled !== undefined) {
      return !empPermsData.customPermissionsEnabled;
    }
    return !Object.values(initialEmpOverrides).some((v) => v === 'ALLOW' || v === 'DENY');
  }, [inheritOverride, empOverrideEdits, empPermsData, initialEmpOverrides]);

  const hasUnsavedEmpChanges = useMemo(() => {
    if (inheritOverride !== null) {
      const serverInheriting = empPermsData?.customPermissionsEnabled !== undefined
        ? !empPermsData.customPermissionsEnabled
        : !Object.values(initialEmpOverrides).some((v) => v === 'ALLOW' || v === 'DENY');
      if (inheritOverride !== serverInheriting) return true;
    }
    return Object.keys(empOverrideEdits).some(
      (k) => empOverrideEdits[k] !== (initialEmpOverrides[k] || 'INHERIT')
    );
  }, [inheritOverride, empOverrideEdits, initialEmpOverrides, empPermsData]);

  const handleSetEmpOverride = (key: string, val: 'INHERIT' | 'ALLOW' | 'DENY') => {
    setEmpOverrideEdits((prev) => ({ ...prev, [key]: val }));
    if (val === 'ALLOW' || val === 'DENY') {
      setInheritOverride(false);
    }
  };

  const handleToggleMasterInherit = () => {
    const nextState = !isInheritingRoleDefaults;
    setInheritOverride(nextState);

    if (nextState) {
      handleResetEmpToRoleDefaults();
      toast.success('Enabled Designation Inheritance. All module overrides reset to INHERIT (Role Defaults).');
    } else {
      toast('Custom overrides mode active. Use the segmented controls below to customize permissions.', {
        icon: '⚙️',
      });
    }
  };

  const handleToggleModuleSwitch = (mod: any) => {
    if (isInheritingRoleDefaults) {
      toast('Turn off "Inherit from Designation / Role" switch above to customize individual module permissions.', {
        icon: '🔒',
      });
      return;
    }
    const currentEffective = getEmpEffectiveStatus(mod);
    const nextOverride = currentEffective ? 'DENY' : 'ALLOW';
    handleSetEmpOverride(mod.moduleKey, nextOverride);
  };

  const handleToggleGranularSwitch = (p: any) => {
    if (isInheritingRoleDefaults) {
      toast('Turn off "Inherit from Designation / Role" switch above to customize individual actions.', {
        icon: '🔒',
      });
      return;
    }
    const currentEffective = getEmpEffectiveStatus(p);
    const nextOverride = currentEffective ? 'DENY' : 'ALLOW';
    handleSetEmpOverride(p.key, nextOverride);
  };

  // "Remove Restriction" behavior: Resets DENY -> INHERIT so role default becomes active again
  const handleRemoveRestriction = (moduleKey: string) => {
    handleSetEmpOverride(moduleKey, 'INHERIT');
    toast.success(`Restriction removed! Restored default role permission.`);
  };

  // Remove ALL Restrictions for selected employee
  const handleRemoveAllRestrictions = () => {
    if (!empPermsData?.modules) return;
    const nextEdits: Record<string, 'INHERIT' | 'ALLOW' | 'DENY'> = { ...empOverrideEdits };
    let removedCount = 0;
    empPermsData.modules.forEach((m: any) => {
      if (getEmpModuleOverride(m.moduleKey) === 'DENY') {
        nextEdits[m.moduleKey] = 'INHERIT';
        removedCount++;
      }
    });
    setEmpOverrideEdits(nextEdits);
    toast.success(
      removedCount > 0
        ? `Removed ${removedCount} restriction(s)! Restored default role permissions.`
        : 'No active restrictions to remove.'
    );
  };

  // Reset ALL overrides to INHERIT (Role Defaults)
  const handleResetEmpToRoleDefaults = () => {
    const reset: Record<string, 'INHERIT' | 'ALLOW' | 'DENY'> = {};
    if (empPermsData?.modules) {
      empPermsData.modules.forEach((m: any) => {
        reset[m.moduleKey] = 'INHERIT';
      });
    }
    if (empPermsData?.granularPermissions) {
      empPermsData.granularPermissions.forEach((g: any) => {
        reset[g.key] = 'INHERIT';
      });
    }
    setEmpOverrideEdits(reset);
    toast.success('All overrides reset to INHERIT (Role Defaults)');
  };

  // Handle Confirmed Reset of Employee Permissions to Role Defaults
  const handleConfirmResetPermissions = async () => {
    if (!selectedEmployee) return;
    setIsResettingPerms(true);
    try {
      if (isCustomerOverrides) {
        await api.delete(`/customers/${selectedEmployee.id}/mobile-permissions`);
        toast.success('Permissions reset successfully. Customer is now using role defaults.');
      } else {
        await api.delete(`/employees/${selectedEmployee.id}/permissions`);
        toast.success('Permissions reset successfully. Employee is now using role defaults.');
      }
      setEmpOverrideEdits({});
      setIsResetModalOpen(false);
      await queryClient.invalidateQueries({
        queryKey: isCustomerOverrides
          ? ['admin-customer-permissions', String(selectedEmployee.id)]
          : ['admin-employee-permissions', String(selectedEmployee.id)],
      });
      await refetchEmpPerms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset employee permissions');
    } finally {
      setIsResettingPerms(false);
    }
  };

  // Handle Confirmed Restrict All Modules for Employee
  const handleConfirmRestrictAllPermissions = async () => {
    if (!selectedEmployee) return;
    setIsRestrictingAllPerms(true);
    try {
      if (isCustomerOverrides) {
        await api.post(`/customers/${selectedEmployee.id}/mobile-permissions/restrict-all`);
        toast.success('All Customer Mobile permissions have been restricted.');
      } else {
        await api.post(`/employees/${selectedEmployee.id}/permissions/restrict-all`);
        toast.success('All Employee Mobile permissions have been restricted.');
      }
      setEmpOverrideEdits({});
      setIsRestrictAllModalOpen(false);
      await queryClient.invalidateQueries({
        queryKey: isCustomerOverrides
          ? ['admin-customer-permissions', String(selectedEmployee.id)]
          : ['admin-employee-permissions', String(selectedEmployee.id)],
      });
      await refetchEmpPerms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to restrict all employee permissions');
    } finally {
      setIsRestrictingAllPerms(false);
    }
  };

  // Save Employee Overrides
  const handleSaveEmpPermissions = async () => {
    if (!selectedEmployee || !empPermsData?.modules) return;
    setIsSavingEmpPerms(true);
    try {
      if (isInheritingRoleDefaults && inheritOverride === true) {
        if (isCustomerOverrides) {
          await api.delete(`/customers/${selectedEmployee.id}/mobile-permissions`);
        } else {
          await api.delete(`/employees/${selectedEmployee.id}/permissions`);
        }
        toast.success(
          `Inheriting role defaults for ${selectedEmployee.firstName || selectedEmployee.name}!`
        );
      } else {
        const moduleOverrides = empPermsData.modules.map((m: any) => ({
          moduleKey: m.moduleKey,
          override: getEmpModuleOverride(m.moduleKey),
        }));

        const granularOverrides = (empPermsData.granularPermissions || [])
          .filter((g: any) => empOverrideEdits[g.key] !== undefined)
          .map((g: any) => ({
            moduleKey: g.key,
            override: getEmpModuleOverride(g.key),
          }));

        const path = isCustomerOverrides
            ? `/customers/${selectedEmployee.id}/mobile-permissions`
            : `/employees/${selectedEmployee.id}/permissions`;
        await api.put(path, {
          overrides: [...moduleOverrides, ...granularOverrides],
        });

        toast.success(
          `Permissions updated successfully for ${selectedEmployee.firstName || selectedEmployee.name}!`
        );
      }
      setEmpOverrideEdits({});
      setInheritOverride(null);
      await queryClient.invalidateQueries({
        queryKey: isCustomerOverrides
          ? ['admin-customer-permissions', String(selectedEmployee.id)]
          : ['admin-employee-permissions', String(selectedEmployee.id)],
      });
      await refetchEmpPerms();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save employee permissions');
    } finally {
      setIsSavingEmpPerms(false);
    }
  };

  // =========================================================================
  // ROLE PERMISSIONS ACTIONS
  // =========================================================================
  const handleSelectRole = (roleId: string) => {
    if (hasUnsavedRoleChanges) {
      if (confirm('You have unsaved permission changes. Discard and switch role?')) {
        setSelectedRoleId(roleId);
      }
    } else {
      setSelectedRoleId(roleId);
    }
  };

  const handleToggleKey = (key: string) => {
    setLocalPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleModule = (module: ModuleGroup) => {
    const allKeys = module.permissions.map((p) => p.key);
    const allChecked = allKeys.every((k) => localPerms.has(k));
    setLocalPerms((prev) => {
      const next = new Set(prev);
      if (allChecked) allKeys.forEach((k) => next.delete(k));
      else allKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const getModuleCheckState = (module: ModuleGroup): 'checked' | 'indeterminate' | 'unchecked' => {
    const total = module.permissions.length;
    if (total === 0) return 'unchecked';
    const checkedCount = module.permissions.filter((p) => localPerms.has(p.key)).length;
    if (checkedCount === total) return 'checked';
    if (checkedCount > 0) return 'indeterminate';
    return 'unchecked';
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    roleModuleCatalog.forEach((g) => (next[g.id] = true));
    setExpandedModules((prev) => ({ ...prev, ...next }));
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    roleModuleCatalog.forEach((g) => (next[g.id] = false));
    setExpandedModules((prev) => ({ ...prev, ...next }));
  };

  const handleSelectAll = () => {
    const next = new Set(localPerms);
    roleModuleCatalog.forEach((g) => {
      g.permissions.forEach((p) => next.add(p.key));
    });
    setLocalPerms(next);
  };

  const handleClearAll = () => {
    const catalogKeys = new Set(roleModuleCatalog.flatMap((g) => g.permissions.map((p) => p.key)));
    setLocalPerms((prev) => {
      const next = new Set(prev);
      catalogKeys.forEach((k) => next.delete(k));
      return next;
    });
  };

  const handleResetToTemplate = () => {
    if (!selectedRole) return;
    if (isCustomerMobileRole) {
      const templateKeys = new Set<string>();
      roleModuleCatalog.forEach((g) => {
        g.permissions.forEach((p) => {
          templateKeys.add(p.key);
        });
      });
      setLocalPerms(templateKeys);
      toast.success(`Reset to ${selectedRole.name} default permissions!`);
      return;
    }
    const upper = (selectedRole.rawName || selectedRole.name).toUpperCase().replace(/\s+/g, '_');
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
      : upper.includes('SALES')
      ? 'SALES_EXECUTIVE'
      : 'TELECALLER';

    const templateKeys = new Set<string>();
    PERMISSION_MODULE_GROUPS.forEach((g) => {
      g.permissions.forEach((p) => {
        if (templateName === 'TELECALLER') {
          if (['CALENDAR', 'MY_WORK', 'CREATIVE_WORK'].includes(p.module)) return;
          if (['LEADS', 'FOLLOW_UP', 'VISITS', 'ATTENDANCE', 'LEAVE', 'PROFILE', 'DASHBOARD', 'NOTIFICATIONS', 'SETTINGS'].includes(p.module)) {
            templateKeys.add(p.key);
          }
        } else if (['DESIGNER', 'EDITOR', 'PHOTOGRAPHER'].includes(templateName)) {
          if (['LEADS', 'FOLLOW_UP', 'VISITS', 'PROPOSALS', 'PACKAGES', 'PAYMENTS', 'WORK_EXECUTION', 'CUSTOMERS'].includes(p.module)) return;
          if (['CALENDAR', 'MY_WORK', 'CREATIVE_WORK', 'ATTENDANCE', 'TASKS', 'SALARY', 'PROFILE', 'DASHBOARD', 'NOTIFICATIONS', 'SETTINGS'].includes(p.module)) {
            templateKeys.add(p.key);
          }
        } else if (templateName === 'SOCIAL_MEDIA_MANAGER') {
          if (['LEADS', 'FOLLOW_UP', 'VISITS', 'PROPOSALS', 'PACKAGES', 'PAYMENTS', 'CUSTOMERS'].includes(p.module)) return;
          templateKeys.add(p.key);
        } else if (templateName === 'SALES_EXECUTIVE') {
          if (['MY_WORK', 'CREATIVE_WORK'].includes(p.module)) return;
          templateKeys.add(p.key);
        }
      });
    });

    setLocalPerms(templateKeys);
    toast.success(`Reset to ${selectedRole.name} template presets!`);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const keysList = Array.from(localPerms);
      // PUT /designations/:designationId/permissions — emits real-time events to affected employees
      await api.put(`/designations/${selectedRole.id}/permissions`, {
        permissions: keysList,
        crmMobileAccess: localCrmAccess,
      });
      setServerPerms(new Set(localPerms));
      setServerCrmAccess(localCrmAccess);
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

  const handleToggleRoleActive = async () => {
    if (!selectedRole) return;
    try {
      const nextActive = !selectedRole.isActive;
      // Designations are the single source of truth for Roles
      await api.patch(`/designations/${selectedRole.id}`, {
        isActive: nextActive,
      });
      toast.success(
        nextActive
          ? `Role "${selectedRole.name}" activated!`
          : `Role "${selectedRole.name}" deactivated!`
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-rbac-roles'] });
      await refetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update role status');
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.isSystem || selectedRole.code === 'CUSTOMER') {
      toast.error('Default system role cannot be deleted');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/designations/${selectedRole.id}`);
      toast.success(`Role "${selectedRole.name}" deleted successfully`);
      setSelectedRoleId('');
      await queryClient.invalidateQueries({ queryKey: ['admin-rbac-roles'] });
      await refetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleOpenCreateRole = () => {
    // Roles derive from Designations — redirect admin to Designation management
    setIsRoleDrawerOpen(true);
    setDrawerMode('create');
    setRoleFormData({ name: '', description: '' });
  };

  const handleOpenEditRole = (role: RoleItem) => {
    setDrawerMode('edit');
    setRoleFormData({ name: role.name, description: role.description });
    setIsRoleDrawerOpen(true);
  };

  const handleSaveRoleForm = async () => {
    if (roleAudience !== 'customer') {
      setIsRoleDrawerOpen(false);
      return;
    }
    const name = roleFormData.name.trim();
    if (!name) {
      toast.error('Role name is required');
      return;
    }
    try {
      if (drawerMode === 'edit' && selectedRole) {
        await api.patch(`/designations/${selectedRole.id}`, {
          name,
          description: roleFormData.description.trim(),
        });
        toast.success('Customer role updated');
      } else {
        await api.post('/designations', {
          name,
          description: roleFormData.description.trim(),
          audience: 'CUSTOMER',
          crmMobileAccess: false,
        });
        toast.success('Customer role created');
      }
      setIsRoleDrawerOpen(false);
      refetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save customer role');
    }
  };

  const handleAssignCustomerRole = async (mobileRoleId: string) => {
    if (!selectedEmployee || !isCustomerOverrides) return;
    try {
      await api.patch(`/customers/${selectedEmployee.id}/mobile-role`, {
        mobileRoleId: mobileRoleId ? Number(mobileRoleId) : null,
      });
      toast.success('Customer role updated');
      refetchEmpPerms();
      refetchCustomers();
      refetchRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign customer role');
    }
  };

  const isCustomerMobileRole = useMemo(() => {
    if (roleAudience === 'customer') return true;
    return selectedRole ? isCustomerRoleItem(selectedRole) : false;
  }, [roleAudience, selectedRole]);

  const roleModuleCatalog = useMemo(
    () =>
      isCustomerMobileRole
        ? PERMISSION_MODULE_GROUPS.filter((group) => group.category === 'CUSTOMER')
        : PERMISSION_MODULE_GROUPS.filter((group) => group.category !== 'CUSTOMER'),
    [isCustomerMobileRole],
  );

  const visibleCategories = useMemo(
    () =>
      isCustomerMobileRole
        ? CATEGORY_DEFINITIONS.filter((cat) => cat.id === 'CUSTOMER')
        : CATEGORY_DEFINITIONS.filter((cat) => cat.id !== 'CUSTOMER'),
    [isCustomerMobileRole],
  );

  // Filter modules for Tab 1 (Role Permissions)
  const filteredRoleModules = useMemo(() => {
    return roleModuleCatalog.filter((group) => {
      if (selectedCategory !== 'ALL' && group.category !== selectedCategory) {
        return false;
      }
      if (!permSearch.trim()) return true;
      const q = permSearch.toLowerCase();
      const matchGroupName = group.name.toLowerCase().includes(q);
      const matchDesc = group.description.toLowerCase().includes(q);
      const matchPerms = group.permissions.some(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
      return matchGroupName || matchDesc || matchPerms;
    });
  }, [roleModuleCatalog, selectedCategory, permSearch]);

  // Render a module card in Tab 1
  const renderRoleModuleCard = (group: ModuleGroup) => {
    const isExpanded = Boolean(expandedModules[group.id]);
    const checkState = getModuleCheckState(group);
    const totalCount = group.permissions.length;
    const checkedCount = group.permissions.filter((p) => localPerms.has(p.key)).length;
    const isAllChecked = checkState === 'checked';
    const isPartiallyChecked = checkState === 'indeterminate';
    const isOn = isAllChecked || isPartiallyChecked;

    return (
      <div
        key={group.id}
        className={`rounded-2xl border transition-all ${
          checkState === 'checked'
            ? 'border-emerald-200/80 bg-white shadow-xs'
            : checkState === 'indeterminate'
            ? 'border-emerald-200/50 bg-white shadow-xs'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
              <group.icon className="w-4.5 h-4.5 text-[#1AA14D]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-black text-slate-900 tracking-tight">{group.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {group.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{group.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors ${
                checkedCount === totalCount
                  ? 'bg-emerald-100 text-emerald-800'
                  : checkedCount > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {checkedCount} / {totalCount} active
            </span>

            {/* DEFAULT ROLE PERMISSION SWITCH [ ON ] / [ OFF ] */}
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                Default:
              </span>
              <button
                type="button"
                onClick={() => handleToggleModule(group)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAllChecked
                    ? 'bg-[#23C45E]'
                    : isPartiallyChecked
                    ? 'bg-emerald-400'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                title={
                  isAllChecked
                    ? 'Default: ON. Click to set OFF for this designation'
                    : 'Default: OFF. Click to set ON for this designation'
                }
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isAllChecked
                    ? 'bg-emerald-100 text-emerald-800'
                    : isPartiallyChecked
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isAllChecked ? 'ON' : isPartiallyChecked ? 'PARTIAL' : 'OFF'}
              </span>
            </div>

            {/* Expand / Collapse Sub-actions */}
            <button
              type="button"
              onClick={() =>
                setExpandedModules((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
              }
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse sub-permissions' : 'Expand sub-permissions'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 divide-y divide-slate-100 bg-white rounded-b-2xl">
            {group.permissions.map((perm) => {
              const isChecked = localPerms.has(perm.key);
              return (
                <div
                  key={perm.key}
                  className="py-2.5 px-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{perm.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {perm.key}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{perm.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
                      Default:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleKey(perm.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isChecked ? 'bg-[#23C45E]' : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                      title={isChecked ? 'Default: ON. Click to toggle OFF' : 'Default: OFF. Click to toggle ON'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isChecked ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isChecked ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. STANDARD PAGE HEADER */}
      <AdminPageHeader
        title="Roles & UI Permissions"
        description="Configure role defaults and manage individual employee mobile access overrides."
        icon={ShieldCheck}
        iconColor="text-[#1AA14D]"
        badge={{
          text: 'ACCESS CONTROL & SECURITY',
          icon: ShieldCheck,
          variant: 'emerald',
        }}
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Roles & Permissions' },
        ]}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {activeTab === 'roles' ? (
              <AdminButton
                variant="primary"
                size="md"
                icon={Plus}
                onClick={handleOpenCreateRole}
              >
                Create Role
              </AdminButton>
            ) : activeTab === 'customers' ? (
              <Link href="/customers">
                <AdminButton
                  variant="outline"
                  size="md"
                  icon={Users}
                >
                  Customer Directory
                </AdminButton>
              </Link>
            ) : (
              <Link href="/employees">
                <AdminButton
                  variant="outline"
                  size="md"
                  icon={Users}
                >
                  Employee Directory
                </AdminButton>
              </Link>
            )}
          </div>
        }
      />

        {/* PRIMARY DUAL TABS SWITCHER */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Role Permissions (Defaults)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
              {roles.filter((r) => r.name.toUpperCase() !== 'EMPLOYEE').length} Roles
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-[#1AA14D]" />
            <span>Employee Permissions (Overrides)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
              {employeesList.length} Employees
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>Customer Permissions (Overrides)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
              {customersList.length} Customers
            </span>
          </button>
        </div>

      {/* =================================================================== */}
      {/* TAB 1: ROLE PERMISSIONS (DEFAULTS)                                  */}
      {/* =================================================================== */}
      {activeTab === 'roles' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Unsaved Changes Alert Banner */}
          {hasUnsavedRoleChanges && selectedRole && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    You have unsaved permission changes for{' '}
                    <span className="underline">{selectedRole.name}</span>.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Changes represent default permissions and will not affect mobile devices until saved.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocalPerms(new Set(serverPerms));
                    setLocalCrmAccess(serverCrmAccess);
                  }}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (hasUnsavedRoleChanges && selectedRole) {
                  if (!confirm(`You have unsaved permission changes for ${selectedRole.name}. Discard and switch to Employee Roles?`)) {
                    return;
                  }
                }
                setRoleAudience('employee');
                setSelectedCategory('ALL');
                setPermSearch('');
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-colors cursor-pointer ${
                roleAudience === 'employee' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Employee Roles ({employeeRoles.length})
            </button>
            <button
              type="button"
              onClick={() => {
                if (hasUnsavedRoleChanges && selectedRole) {
                  if (!confirm(`You have unsaved permission changes for ${selectedRole.name}. Discard and switch to Customer Roles?`)) {
                    return;
                  }
                }
                setRoleAudience('customer');
                setSelectedCategory('ALL');
                setPermSearch('');
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition-colors cursor-pointer ${
                roleAudience === 'customer' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Customer Roles ({customerRoles.length})
            </button>
          </div>

          {/* Role Layout: 4 Cols Roles List, 8 Cols Permissions Tree */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT SIDEBAR: EMPLOYEE ROLES (Cols: 4) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1AA14D]" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {roleAudience === 'customer' ? 'CUSTOMER ROLES' : 'EMPLOYEE ROLES'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredRoles.length} Roles
                </span>
              </div>

              {/* Search Role */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search roles..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              {/* Role Cards List */}
              <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {isRolesLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1AA14D]" />
                    Loading {roleAudience === 'customer' ? 'customer' : 'employee'} roles...
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No {roleAudience === 'customer' ? 'customer' : 'employee'} roles matching "{roleSearch}"
                  </div>
                ) : (
                  filteredRoles.map((role) => {
                    const isSelected = selectedRole?.id === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleSelectRole(role.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                          isSelected
                            ? 'bg-emerald-50/70 border-[#23C45E] shadow-sm ring-1 ring-[#23C45E]'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 tracking-tight truncate">
                                {role.name}
                              </h4>
                              {(role as any)?.crmMobileAccess && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 tracking-wider">
                                  CRM
                                </span>
                              )}
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-[#23C45E] shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                              {role.description || `${role.name} role`}
                            </p>
                          </div>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              role.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {role.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
                          <span className="flex items-center gap-1 text-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {isSelected ? `${localPerms.size} Permissions` : `${role.permissionsCount} Permissions`}
                            </span>
                          </span>

                          <span className="flex items-center gap-1 text-slate-500">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>{role.usersCount} {isCustomerRoleItem(role) ? 'Customers' : 'Staff'}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL: SELECTED ROLE PERMISSIONS (Cols: 8) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedRole ? (
                <div className="space-y-4">
                  {/* Role Header Card */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-base font-black text-slate-900 tracking-tight">
                            {selectedRole.name}
                          </h2>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              selectedRole.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {selectedRole.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {selectedRole.usersCount} {isCustomerMobileRole ? 'Assigned Customers' : 'Assigned Staff'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {selectedRole.description || `${selectedRole.name} role`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          title="Preview Mobile UI"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-[#1AA14D]" />
                          <span>Preview Mobile UI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditRole(selectedRole)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                          title="Edit role details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleRoleActive}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            selectedRole.isActive
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={selectedRole.isActive ? 'Deactivate role' : 'Activate role'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {roleAudience === 'customer' && !selectedRole.isSystem && selectedRole.code !== 'CUSTOMER' && (
                          <button
                            type="button"
                            onClick={handleDeleteRole}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                            title="Delete custom customer role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={handleResetToTemplate}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="Reset to default template"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Defaults</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSavePermissions}
                          disabled={isSaving || !hasUnsavedRoleChanges}
                          className={`flex items-center gap-1.5 px-4 py-1.5 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer ${
                            hasUnsavedRoleChanges
                              ? 'bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 animate-pulse'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>{isSaving ? 'Saving...' : hasUnsavedRoleChanges ? 'Save Changes *' : 'Save Permissions'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Metrics Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#1AA14D] flex items-center justify-center font-bold">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block">
                            Enabled Permissions
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            Active: {localPerms.size} permissions
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block">
                            Module Coverage
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {
                              roleModuleCatalog.filter((g) =>
                                g.permissions.some((p) => localPerms.has(p.key))
                              ).length
                            }{' '}
                            of {roleModuleCatalog.length} Modules Active
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 block">
                            {isCustomerMobileRole ? 'Customer Impact' : 'Staff Impact'}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {selectedRole.usersCount} {isCustomerMobileRole ? 'Customers' : 'Employees'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CRM Mobile Section Eligibility Toggle */}
                    {!isCustomerMobileRole && <div className={`p-4 rounded-2xl border transition-all ${
                      localCrmAccess
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50/80 border-slate-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            localCrmAccess ? 'bg-[#23C45E] text-slate-950 font-bold' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 tracking-tight">
                                CRM Mobile Navigation Section
                              </span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                localCrmAccess ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {localCrmAccess ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl">
                              Enables the dedicated <strong className="text-slate-700">CRM</strong> section in Employee Mobile App sidebar (Dashboard, Data Capture, Leads, Customers) for employees with this designation (e.g. Telesales, BPO, Telecallers).
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setLocalCrmAccess(!localCrmAccess)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              localCrmAccess ? 'bg-[#23C45E]' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                localCrmAccess ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold text-slate-700 select-none">
                            {localCrmAccess ? 'Access Enabled' : 'Access Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>}
                  </div>

                  {/* Toolbar: Category Tabs, Search & Bulk Actions */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={permSearch}
                          onChange={(e) => setPermSearch(e.target.value)}
                          placeholder="Search permissions or modules..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#23C45E]"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          type="button"
                          onClick={handleExpandAll}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Expand All
                        </button>
                        <button
                          type="button"
                          onClick={handleCollapseAll}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Collapse All
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                          selectedCategory === 'ALL'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Modules
                      </button>

                      {visibleCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            selectedCategory === cat.id
                              ? 'bg-[#23C45E] text-slate-950 shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <cat.icon className="w-3.5 h-3.5" />
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner: Employee Mobile Module Permissions */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#1AA14D] flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                        {isCustomerMobileRole ? 'Customer Mobile Module Permissions' : 'Employee Mobile Module Permissions'}
                      </h3>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        {isCustomerMobileRole
                          ? 'These switches control what the customer mobile app can show and do. Customers only see their own data.'
                          : <>These switches represent the <span className="font-bold text-slate-900">DEFAULT FOR THIS DESIGNATION</span>. These permissions are automatically inherited by employees assigned to this designation unless individually overridden.</>}
                      </p>
                    </div>
                  </div>

                  {/* Grouped Permission Modules Tree */}
                  <div className="space-y-6">
                    {isPermsLoading ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                        <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1AA14D]" />
                        Loading permissions for {selectedRole.name}...
                      </div>
                    ) : filteredRoleModules.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                        No permissions match your search or filter.
                      </div>
                    ) : selectedCategory === 'ALL' ? (
                      visibleCategories.map((cat) => {
                        const catModules = filteredRoleModules.filter((m) => m.category === cat.id);
                        if (catModules.length === 0) return null;
                        return (
                          <div key={cat.id} className="space-y-3">
                            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200">
                              <cat.icon className="w-4 h-4 text-[#1AA14D]" />
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                {cat.name}
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {catModules.length} Modules
                              </span>
                            </div>
                            <div className="space-y-3">
                              {catModules.map((module) => renderRoleModuleCard(module))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="space-y-3">
                        {filteredRoleModules.map((module) => renderRoleModuleCard(module))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  Select a {roleAudience === 'customer' ? 'customer' : 'employee'} role from the left sidebar to configure its permissions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: EMPLOYEE PERMISSIONS (OVERRIDES)                             */}
      {/* =================================================================== */}
      {(activeTab === 'employees' || activeTab === 'customers') && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Unsaved Changes Banner for Employee */}
          {hasUnsavedEmpChanges && selectedEmployee && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    You have unsaved permission overrides for{' '}
                    <span className="underline">{selectedEmployee.firstName || selectedEmployee.name}</span>.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Overrides will not take effect on the {isCustomerOverrides ? 'customer' : 'employee'} mobile app until saved.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmpOverrideEdits({})}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmpPermissions}
                  disabled={isSavingEmpPerms}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isSavingEmpPerms ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSavingEmpPerms ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Employee Layout: 4 Cols Employees List, 8 Cols Overrides Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT SIDEBAR: EMPLOYEES LIST (Cols: 4) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1AA14D]" />
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {isCustomerOverrides ? 'CUSTOMERS' : 'EMPLOYEES'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredEmployees.length} {isCustomerOverrides ? 'Customers' : 'Staff'}
                </span>
              </div>

              {/* Search Employee */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder={permissionSubject === 'customer' ? 'Search customers...' : 'Search employees...'}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#23C45E]"
                />
              </div>

              {/* Employee Cards List */}
              <div className="space-y-2.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                    {isOverrideListLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1AA14D]" />
                    Loading {isCustomerOverrides ? 'customers' : 'employees'}...
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No {isCustomerOverrides ? 'customers' : 'employees'} matching "{empSearch}"
                  </div>
                ) : (
                  filteredEmployees.map((emp: any) => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    const desigTitle = emp.designation?.name || emp.designation || 'Staff';
                    const roleTitle = emp.roleName || desigTitle;
                    const effectiveCount = isSelected && empPermsData?.modules
                      ? empPermsData.modules.filter((m: any) => getEmpEffectiveStatus(m)).length
                      : emp.effectivePermissionsCount;
                    return (
                      <div
                        key={emp.id}
                        onClick={() =>
                          isCustomerOverrides
                            ? setSelectedCustomerId(String(emp.id))
                            : setSelectedEmpId(String(emp.id))
                        }
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                          isSelected
                            ? 'bg-emerald-50/70 border-[#23C45E] shadow-sm ring-1 ring-[#23C45E]'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 tracking-tight truncate">
                                {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : emp.name || (isCustomerOverrides ? 'Customer' : 'Staff Member')}
                              </h4>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-[#23C45E] shrink-0 animate-pulse" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-slate-500">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{desigTitle}</span>
                            </div>
                          </div>

                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                            {emp.employeeCode || `#${emp.id}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
                          <span className="flex items-center gap-1 text-slate-600 truncate">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate">{emp.email || 'No email'}</span>
                          </span>

                          <span className="flex items-center gap-1 text-purple-700 shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {effectiveCount !== undefined
                                ? `${effectiveCount} Effective Permissions`
                                : 'Role Defaults'}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL: SELECTED EMPLOYEE PERMISSIONS MATRIX (Cols: 8) */}
            <div className="lg:col-span-8 space-y-4">
              {selectedEmployee ? (
                <div className="space-y-4">
                  {/* Employee Header & 3-Tier Summary Card */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-base font-black text-slate-900 tracking-tight">
                            {selectedEmployee.firstName
                              ? `${selectedEmployee.firstName} ${selectedEmployee.lastName || ''}`.trim()
                              : selectedEmployee.name || (isCustomerOverrides ? 'Customer' : 'Employee')}
                          </h2>
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {permissionSubject === 'customer' ? 'Customer' : 'Designation'}: {selectedEmployee.designation?.name || empPermsData?.designationName || (permissionSubject === 'customer' ? 'Unassigned' : 'Staff')}
                          </span>
                          {permissionSubject === 'customer' ? (
                            <select
                              value={String(empPermsData?.mobileRoleId || '')}
                              onChange={(e) => handleAssignCustomerRole(e.target.value)}
                              className="text-[11px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="">Unassigned</option>
                              {roles
                                .filter((r) => isCustomerRoleItem(r))
                                .map((r) => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                          ) : (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Employee Role: {empPermsData?.roleName || selectedEmployee.designation?.name || 'Staff'}
                          </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            ID: {selectedEmployee.employeeCode || `#${selectedEmployee.id}`}
                          </span>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Active: {empPermsData?.modules ? empPermsData.modules.filter((m: any) => getEmpEffectiveStatus(m)).length : 0} permissions
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Role Default baseline merged with individual {isCustomerOverrides ? 'customer' : 'employee'} overrides to calculate effective mobile access.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Preview Mobile UI Button */}
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          title="Preview how Mobile App renders for this specific employee"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-[#1AA14D]" />
                          <span>Preview Mobile UI</span>
                        </button>

                        {/* Reset Permissions Button */}
                        <button
                          type="button"
                          onClick={() => setIsResetModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300"
                          title="Reset employee-specific overrides to inherit role defaults"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                          <span>Reset Permissions</span>
                        </button>

                        {/* Restrict All Button */}
                        <button
                          type="button"
                          onClick={() => setIsRestrictAllModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-rose-200"
                          title="Restrict all module access to DENY for this employee only"
                        >
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                          <span>Restrict All</span>
                        </button>

                        {/* Save Permissions */}
                        <button
                          type="button"
                          onClick={handleSaveEmpPermissions}
                          disabled={isSavingEmpPerms}
                          className={`flex items-center gap-1.5 px-4 py-1.5 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer ${
                            hasUnsavedEmpChanges
                              ? 'bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950 animate-pulse'
                              : 'bg-[#23C45E] hover:bg-[#1AA14D] text-slate-950'
                          }`}
                        >
                          {isSavingEmpPerms ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>{isSavingEmpPerms ? 'Saving...' : hasUnsavedEmpChanges ? 'Save Changes *' : 'Save Permissions'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 3-Tier Comparison Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          1. Role Defaults
                        </span>
                        <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>{empPermsData?.roleName || selectedEmployee.designation?.name || 'Staff'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {empPermsData?.modules
                            ? `${empPermsData.modules.filter((m: any) => m.roleDefault).length} modules enabled by default`
                            : 'Loading defaults...'}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          2. {isCustomerOverrides ? 'Customer Overrides' : 'Employee Overrides'}
                        </span>
                        <div className="font-extrabold text-xs text-indigo-700 flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-indigo-600" />
                          <span>
                            {empPermsData?.modules
                              ? `${empPermsData.modules.filter((m: any) => getEmpModuleOverride(m.moduleKey) !== 'INHERIT').length} Custom Overrides`
                              : '0 Overrides'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {empPermsData?.modules
                            ? `${empPermsData.modules.filter((m: any) => getEmpModuleOverride(m.moduleKey) === 'DENY').length} Restricted (DENY)`
                            : '0 Restricted'}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          3. Effective Access
                        </span>
                        <div className="font-extrabold text-xs text-[#1AA14D] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#1AA14D]" />
                          <span>
                            {empPermsData?.modules
                              ? `${empPermsData.modules.filter((m: any) => getEmpEffectiveStatus(m)).length} Active on Mobile`
                              : isEmpPermsLoading
                              ? 'Calculating...'
                              : '0 Active on Mobile'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Merged: Role Defaults + Overrides
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MASTER INHERIT FROM DESIGNATION / ROLE CARD */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                            isInheritingRoleDefaults
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-[#1AA14D]'
                          }`}
                        >
                          {isInheritingRoleDefaults ? <ShieldCheck className="w-5 h-5 text-purple-600" /> : <Sliders className="w-5 h-5 text-[#1AA14D]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900">
                              Inherit from {isCustomerOverrides ? 'Customer Role' : 'Designation / Role'}
                            </h3>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                isInheritingRoleDefaults
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isInheritingRoleDefaults ? 'Inheriting All Defaults' : 'Custom Overrides Active'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {isInheritingRoleDefaults
                              ? `${isCustomerOverrides ? 'Customer' : 'Employee'} automatically inherits default permissions from ${selectedEmployee.designation?.name || empPermsData?.designationName || (isCustomerOverrides ? 'Customer Role' : 'Designation')}. Use the segmented controls below to set custom overrides.`
                              : `Custom overrides are active for this ${isCustomerOverrides ? 'customer' : 'employee'}. Any module set to INHERIT will automatically follow ${isCustomerOverrides ? 'Customer Role' : 'Designation'} defaults.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={handleResetEmpToRoleDefaults}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-300"
                          title="Reset all module overrides to INHERIT (Role Defaults)"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                          <span>Reset All to Inherit</span>
                        </button>

                        {empPermsData?.modules &&
                          empPermsData.modules.some((m: any) => getEmpModuleOverride(m.moduleKey) === 'DENY') && (
                            <button
                              type="button"
                              onClick={handleRemoveAllRestrictions}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-blue-200"
                              title="Reset all DENY restrictions back to INHERIT"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                              <span>Remove All Restrictions</span>
                            </button>
                          )}

                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                          <span className="text-xs font-bold text-slate-600">
                            {isInheritingRoleDefaults ? 'Inherit: ON' : 'Inherit: OFF'}
                          </span>
                          <button
                            type="button"
                            onClick={handleToggleMasterInherit}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isInheritingRoleDefaults ? 'bg-purple-600' : 'bg-slate-300 hover:bg-slate-400'
                            }`}
                            title={isInheritingRoleDefaults ? 'Click to enable custom overrides' : 'Click to reset all to role defaults'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isInheritingRoleDefaults ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3-State Module Permission Matrix */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          {isCustomerOverrides ? 'Customer Mobile Application Module Permissions' : 'Mobile Application Module Permissions'}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Select <span className="font-bold text-slate-700">INHERIT</span> to use {isCustomerOverrides ? 'Customer Role' : 'Designation'} default, or set an individual <span className="font-bold text-emerald-700">ALLOW</span> / <span className="font-bold text-rose-700">DENY</span> override.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={empModuleSearch}
                            onChange={(e) => setEmpModuleSearch(e.target.value)}
                            placeholder="Filter modules..."
                            className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#23C45E]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleExpandAllEmpModules}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200/70 bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          Expand All
                        </button>
                        <button
                          type="button"
                          onClick={handleCollapseAllEmpModules}
                          className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200/70 bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          Collapse All
                        </button>
                      </div>
                    </div>

                    {isEmpPermsLoading ? (
                      <div className="p-12 text-center text-xs text-slate-400">
                        <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1AA14D]" />
                        Loading {isCustomerOverrides ? 'customer' : 'employee'} permissions...
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="py-3 px-5">Module / Action</th>
                              <th className="py-3 px-4 text-center">Role Default</th>
                              <th className="py-3 px-4 text-center">{isCustomerOverrides ? 'Customer Override' : 'Employee Override'}</th>
                              <th className="py-3 px-4 text-center">Effective Permission</th>
                              <th className="py-3 px-4 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {empPermsData?.modules
                              ?.filter((mod: any) => {
                                if (!empModuleSearch.trim()) return true;
                                const q = empModuleSearch.toLowerCase();
                                return (
                                  mod.label.toLowerCase().includes(q) ||
                                  mod.moduleKey.toLowerCase().includes(q) ||
                                  mod.category.toLowerCase().includes(q)
                                );
                              })
                              .map((mod: any) => {
                                const currentOverride = getEmpModuleOverride(mod.moduleKey);
                                const effective = getEmpEffectiveStatus(mod);
                                const isExpanded = Boolean(expandedEmpModules[mod.moduleKey]);
                                const modGranular = (empPermsData?.granularPermissions || []).filter(
                                  (g: any) => g.module?.toUpperCase() === mod.moduleKey?.toUpperCase()
                                );

                                return (
                                  <React.Fragment key={mod.moduleKey}>
                                    <tr className={`hover:bg-slate-50/60 transition-colors ${isExpanded ? 'bg-slate-50/40' : ''}`}>
                                      <td className="py-3 px-5">
                                        <div className="flex items-center gap-2">
                                          {modGranular.length > 0 ? (
                                            <button
                                              type="button"
                                              onClick={() => toggleEmpModuleExpand(mod.moduleKey)}
                                              className="p-1 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                              title={isExpanded ? 'Collapse actions' : 'Expand actions'}
                                            >
                                              {isExpanded ? (
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                                              ) : (
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                              )}
                                            </button>
                                          ) : (
                                            <div className="w-5.5" />
                                          )}
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-slate-900">{mod.label}</span>
                                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                                {mod.category}
                                              </span>
                                              {modGranular.length > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() => toggleEmpModuleExpand(mod.moduleKey)}
                                                  className="text-[9px] text-slate-400 font-medium hover:text-slate-600 cursor-pointer"
                                                >
                                                  ({modGranular.length} actions)
                                                </button>
                                              )}
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                              {mod.moduleKey}
                                            </p>
                                          </div>
                                        </div>
                                      </td>

                                      {/* Role Default */}
                                      <td className="py-3 px-4 text-center">
                                        {mod.roleDefault ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            ON
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                                            <XCircle className="w-3 h-3 text-slate-400" />
                                            OFF
                                          </span>
                                        )}
                                      </td>

                                      {/* Employee Override: Segmented control [ INHERIT ] [ ALLOW ] [ DENY ] */}
                                      <td className="py-3 px-4 text-center">
                                        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                                          <button
                                            type="button"
                                            onClick={() => handleSetEmpOverride(mod.moduleKey, 'INHERIT')}
                                            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                                              currentOverride === 'INHERIT'
                                                ? 'bg-white text-slate-900 shadow-xs font-black'
                                                : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                            title="Inherit default from role"
                                          >
                                            Inherit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSetEmpOverride(mod.moduleKey, 'ALLOW')}
                                            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                                              currentOverride === 'ALLOW'
                                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                                : 'text-emerald-700 hover:text-emerald-900'
                                            }`}
                                            title="Explicitly allow this module"
                                          >
                                            Allow
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSetEmpOverride(mod.moduleKey, 'DENY')}
                                            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                                              currentOverride === 'DENY'
                                                ? 'bg-rose-600 text-white shadow-xs font-black'
                                                : 'text-rose-700 hover:text-rose-900'
                                            }`}
                                            title="Explicitly deny/block this module"
                                          >
                                            Deny
                                          </button>
                                        </div>
                                      </td>

                                      {/* Effective Permission */}
                                      <td className="py-3 px-4 text-center">
                                        {effective ? (
                                          <div className="flex flex-col items-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                              ON
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                              {currentOverride === 'ALLOW' ? 'Override (Allow)' : 'Role Default'}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs">
                                              <Lock className="w-3.5 h-3.5 text-rose-600" />
                                              OFF
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                                              {currentOverride === 'DENY' ? 'Override (Deny)' : 'Role Default'}
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      {/* Actions */}
                                      <td className="py-3 px-4 text-center">
                                        {currentOverride === 'DENY' ? (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveRestriction(mod.moduleKey)}
                                            className="px-2.5 py-1.5 text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs inline-flex items-center gap-1.5"
                                            title="Remove restriction and restore role default permission (sets override to INHERIT)"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Remove Restriction</span>
                                          </button>
                                        ) : (
                                          <span className="text-slate-300 text-xs">—</span>
                                        )}
                                      </td>
                                    </tr>

                                    {/* Granular Module Actions (View, Create, Edit, Delete, etc.) */}
                                    {isExpanded &&
                                      modGranular.map((p: any) => {
                                        const permOverride = getEmpModuleOverride(p.key);
                                        const permEffective = getEmpEffectiveStatus(p.key);

                                        return (
                                          <tr
                                            key={p.key}
                                            className="bg-slate-50/50 hover:bg-slate-100/60 transition-colors border-t border-slate-100"
                                          >
                                            <td className="py-2.5 pl-11 pr-5">
                                              <div className="flex items-center gap-2.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                                <div className="min-w-0">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-xs">{p.label}</span>
                                                    <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                                      {p.action}
                                                    </span>
                                                  </div>
                                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                    {p.key}
                                                  </p>
                                                </div>
                                              </div>
                                            </td>

                                            {/* Granular Role Default */}
                                            <td className="py-2 px-4 text-center">
                                              {p.roleDefault ? (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
                                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                  ON
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                                                  <XCircle className="w-2.5 h-2.5 text-slate-400" />
                                                  OFF
                                                </span>
                                              )}
                                            </td>

                                            {/* Granular Employee Override */}
                                            <td className="py-2 px-4 text-center">
                                              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                                                <button
                                                  type="button"
                                                  onClick={() => handleSetEmpOverride(p.key, 'INHERIT')}
                                                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                                                    permOverride === 'INHERIT'
                                                      ? 'bg-white text-slate-900 shadow-xs font-black'
                                                      : 'text-slate-500 hover:text-slate-800'
                                                  }`}
                                                  title="Inherit from module/role"
                                                >
                                                  Inherit
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleSetEmpOverride(p.key, 'ALLOW')}
                                                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                                                    permOverride === 'ALLOW'
                                                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                                                      : 'text-emerald-700 hover:text-emerald-900'
                                                  }`}
                                                  title="Explicitly allow this action"
                                                >
                                                  Allow
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleSetEmpOverride(p.key, 'DENY')}
                                                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer ${
                                                    permOverride === 'DENY'
                                                      ? 'bg-rose-600 text-white shadow-xs font-black'
                                                      : 'text-rose-700 hover:text-rose-900'
                                                  }`}
                                                  title="Explicitly deny/block this action"
                                                >
                                                  Deny
                                                </button>
                                              </div>
                                            </td>

                                            {/* Granular Effective Permission */}
                                            <td className="py-2 px-4 text-center">
                                              {permEffective ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                                  <Unlock className="w-3 h-3 text-emerald-600" />
                                                  ON
                                                  {permOverride === 'ALLOW' && (
                                                    <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-200 text-emerald-900 font-black">
                                                      Override
                                                    </span>
                                                  )}
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                                                  <Lock className="w-3 h-3 text-rose-600" />
                                                  OFF
                                                  {permOverride === 'DENY' && (
                                                    <span className="text-[8px] px-1 py-0.2 rounded bg-rose-200 text-rose-900 font-black">
                                                      Override
                                                    </span>
                                                  )}
                                                </span>
                                              )}
                                            </td>

                                            {/* Granular Actions */}
                                            <td className="py-2 px-4 text-center">
                                              {permOverride === 'DENY' ? (
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveRestriction(p.key)}
                                                  className="px-2 py-0.5 text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                                                  title="Remove restriction and restore default permission (sets override to INHERIT)"
                                                >
                                                  <RotateCcw className="w-2.5 h-2.5 text-blue-600" />
                                                  <span>Remove Restriction</span>
                                                </button>
                                              ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </React.Fragment>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                  Select an employee from the left column to configure individual permission overrides.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2.5. RESET PERMISSIONS CONFIRMATION MODAL                  */}
      {/* ========================================================= */}
      {isResetModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Reset {isCustomerOverrides ? 'Customer' : 'Employee'} Permissions?</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isCustomerOverrides ? 'Customer' : 'Employee'}:{' '}
                  <span className="font-bold text-slate-800">
                    {selectedEmployee.firstName
                      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName || ''}`.trim()
                      : selectedEmployee.name || (isCustomerOverrides ? 'Customer' : 'Employee')}
                  </span>{' '}
                  ({empPermsData?.roleName || selectedEmployee.designation?.name || 'Role Defaults'})
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5">
              <p>
                This will remove all custom permission overrides for this {isCustomerOverrides ? 'customer' : 'employee'} and restore the permissions inherited from the {isCustomerOverrides ? 'customer' : 'employee'}'s role.
              </p>

              {hasUnsavedEmpChanges && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>You have unsaved permission changes. Resetting permissions will discard them.</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                ℹ️ Other {isCustomerOverrides ? 'customers' : 'employees'} assigned to this role will NOT be affected.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isResettingPerms}
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResettingPerms}
                onClick={handleConfirmResetPermissions}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isResettingPerms ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{isResettingPerms ? 'Resetting...' : 'Reset Permissions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2.6. RESTRICT ALL PERMISSIONS CONFIRMATION MODAL           */}
      {/* ========================================================= */}
      {isRestrictAllModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Restrict All Permissions?</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isCustomerOverrides ? 'Customer' : 'Employee'}:{' '}
                  <span className="font-bold text-slate-800">
                    {selectedEmployee.firstName
                      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName || ''}`.trim()
                      : selectedEmployee.name || (isCustomerOverrides ? 'Customer' : 'Employee')}
                  </span>{' '}
                  ({empPermsData?.roleName || selectedEmployee.designation?.name || 'Role Defaults'})
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5">
              <p>
                This will remove mobile access to all configured {isCustomerOverrides ? 'Customer' : 'Employee'} modules for this {isCustomerOverrides ? 'customer' : 'employee'}.
              </p>
              <p className="text-slate-500">
                The {isCustomerOverrides ? 'customer' : 'employee'} will remain active, but their {isCustomerOverrides ? 'Customer' : 'Employee'} Mobile App access will be restricted.
              </p>

              {hasUnsavedEmpChanges && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>You have unsaved permission changes. Restricting permissions will overwrite them.</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                ℹ️ This restriction applies ONLY to this {isCustomerOverrides ? 'customer' : 'employee'}. Other{' '}
                <span className="font-bold">{empPermsData?.roleName || selectedEmployee.designation?.name || 'staff'}</span> members and the role defaults remain completely unaffected.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isRestrictingAllPerms}
                onClick={() => setIsRestrictAllModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRestrictingAllPerms}
                onClick={handleConfirmRestrictAllPermissions}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isRestrictingAllPerms ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                <span>{isRestrictingAllPerms ? 'Restricting...' : 'Restrict All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MOBILE UI PREVIEW SIMULATOR MODAL (Shared)            */}
      {/* ========================================================= */}
      {isPreviewOpen && (activeTab === 'roles' ? selectedRole : selectedEmployee) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#23C45E]" />
                  <h3 className="text-sm font-black">{permissionSubject === 'customer' ? 'Customer Mobile App Simulator' : 'Employee Mobile App Simulator'}</h3>
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeTab === 'roles' ? (
                    <>
                      Simulating navigation defaults for role:{' '}
                      <span className="text-[#23C45E] font-bold">{selectedRole?.name}</span>
                    </>
                  ) : (
                    <>
                      Simulating effective navigation for employee:{' '}
                      <span className="text-[#23C45E] font-bold">
                        {selectedEmployee?.firstName || selectedEmployee?.name}
                      </span>{' '}
                      ({empPermsData?.roleName || selectedEmployee?.designation?.name || 'Staff'})
                    </>
                  )}
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
                {/* Status Bar */}
                <div className="bg-slate-900 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <span>09:41</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2 rounded-xs border border-slate-300 relative">
                      <div className="h-full bg-emerald-400 w-3" />
                    </div>
                  </div>
                </div>

                {/* Mobile Header */}
                <div className="bg-white p-3 border-b border-slate-100 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#23C45E]/10 text-[#1AA14D] flex items-center justify-center font-black text-xs">
                      QB
                    </div>
                    <span className="text-xs font-black text-slate-900">QuikBoom CRM</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {activeTab === 'roles'
                      ? selectedRole?.name
                      : `${selectedEmployee?.firstName || selectedEmployee?.name}`}
                  </span>
                </div>

                {/* Mobile Body Content */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
                  {/* Authorized Drawer Modules */}
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      Visible in Menu / Drawer
                    </span>

                    <div className="space-y-1">
                      {permissionSubject === 'customer' &&
                        [
                          ['employee.customer_home.view', 'Home'],
                          ['employee.customer_plans.view', 'Plans'],
                          ['employee.customer_trending.view', 'Trending'],
                          ['employee.customer_orders.view', 'Orders'],
                          ['employee.customer_invoices.view', 'Invoices'],
                          ['employee.customer_profile.view', 'Profile'],
                          ['employee.customer_calendar.view', 'Calendar'],
                          ['employee.customer_ssm.view', 'SSM'],
                          ['employee.customer_influencers.view', 'Influencers'],
                          ['employee.customer_notifications.view', 'Notifications'],
                          ['employee.customer_support.view', 'Support'],
                          ['employee.customer_marketing.view', 'Marketing & Offers'],
                        ]
                          .filter(([key]) =>
                            activeTab === 'roles' ? localPerms.has(key) : getEmpEffectiveStatus(key),
                          )
                          .map(([key, label]) => (
                            <div key={key} className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800">
                              {label}
                            </div>
                          ))}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.leads.view')
                        : getEmpEffectiveStatus('employee.leads.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>Leads Pipeline</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.followups.view')
                        : getEmpEffectiveStatus('employee.followups.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Follow-ups</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.visits.view')
                        : getEmpEffectiveStatus('employee.visits.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Field Visits</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.data_capture.view')
                        : getEmpEffectiveStatus('employee.data_capture.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-amber-500" />
                          <span>Data Capture</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.my_work.view')
                        : getEmpEffectiveStatus('employee.my_work.view')) && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-800 flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                          <span>My Work (Creative)</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.creative_work.view')
                        : getEmpEffectiveStatus('employee.creative_work.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5 text-purple-500" />
                          <span>Social Media Work</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.packages.view')
                        : getEmpEffectiveStatus('employee.packages.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-amber-500" />
                          <span>Packages</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.attendance.view')
                        : getEmpEffectiveStatus('employee.attendance.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Clock3 className="w-3.5 h-3.5 text-teal-500" />
                          <span>Attendance Punch</span>
                        </div>
                      )}
                      {permissionSubject !== 'customer' && (activeTab === 'roles'
                        ? localPerms.has('employee.tasks.view')
                        : getEmpEffectiveStatus('employee.tasks.view')) && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Assigned Tasks</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unavailable / Hidden Modules */}
                  {permissionSubject !== 'customer' && <div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-wider block mb-1.5">
                      Hidden / Restricted Modules
                    </span>

                    <div className="space-y-1">
                      {!(activeTab === 'roles'
                        ? localPerms.has('employee.calendar.view')
                        : getEmpEffectiveStatus('employee.calendar.view')) && (
                        <div className="p-1.5 rounded-lg bg-red-50/60 border border-red-200/60 text-[11px] font-medium text-red-700 flex items-center justify-between">
                          <span>Calendar</span>
                          <span className="text-[9px] font-bold uppercase text-red-500">Restricted</span>
                        </div>
                      )}
                      {!(activeTab === 'roles'
                        ? localPerms.has('employee.my_work.view')
                        : getEmpEffectiveStatus('employee.my_work.view')) && (
                        <div className="p-1.5 rounded-lg bg-red-50/60 border border-red-200/60 text-[11px] font-medium text-red-700 flex items-center justify-between">
                          <span>My Work</span>
                          <span className="text-[9px] font-bold uppercase text-red-500">Restricted</span>
                        </div>
                      )}
                      {!(activeTab === 'roles'
                        ? localPerms.has('employee.leads.view')
                        : getEmpEffectiveStatus('employee.leads.view')) && (
                        <div className="p-1.5 rounded-lg bg-red-50/60 border border-red-200/60 text-[11px] font-medium text-red-700 flex items-center justify-between">
                          <span>CRM Leads</span>
                          <span className="text-[9px] font-bold uppercase text-red-500">Restricted</span>
                        </div>
                      )}
                      {!(activeTab === 'roles'
                        ? localPerms.has('employee.data_capture.view')
                        : getEmpEffectiveStatus('employee.data_capture.view')) && (
                        <div className="p-1.5 rounded-lg bg-red-50/60 border border-red-200/60 text-[11px] font-medium text-red-700 flex items-center justify-between">
                          <span>Data Capture</span>
                          <span className="text-[9px] font-bold uppercase text-red-500">Restricted</span>
                        </div>
                      )}
                    </div>
                  </div>}
                </div>

                {/* Dynamic Bottom Navigation Bar */}
                <div className="bg-white border-t border-slate-200 p-2 flex items-center justify-around">
                  {(permissionSubject !== 'customer' || (activeTab === 'roles' ? localPerms.has('employee.customer_home.view') : getEmpEffectiveStatus('employee.customer_home.view'))) && (
                  <div className="flex flex-col items-center gap-0.5 text-[#1AA14D]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Home</span>
                  </div>
                  )}
                  {permissionSubject === 'customer' && (activeTab === 'roles' ? localPerms.has('employee.customer_plans.view') : getEmpEffectiveStatus('employee.customer_plans.view')) && (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Package className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Plans</span>
                    </div>
                  )}
                  {permissionSubject === 'customer' && (activeTab === 'roles' ? localPerms.has('employee.customer_orders.view') : getEmpEffectiveStatus('employee.customer_orders.view')) && (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Orders</span>
                    </div>
                  )}

                  {permissionSubject !== 'customer' && (activeTab === 'roles'
                    ? localPerms.has('employee.calendar.view')
                    : getEmpEffectiveStatus('employee.calendar.view')) && (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Calendar</span>
                    </div>
                  )}

                  {permissionSubject !== 'customer' && (activeTab === 'roles'
                    ? localPerms.has('employee.my_work.view')
                    : getEmpEffectiveStatus('employee.my_work.view')) && (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[9px] font-bold">My Work</span>
                    </div>
                  )}

                  {permissionSubject !== 'customer' && (activeTab === 'roles'
                    ? localPerms.has('employee.attendance.view')
                    : getEmpEffectiveStatus('employee.attendance.view')) && (
                    <div className="flex flex-col items-center gap-0.5 text-slate-600">
                      <Clock3 className="w-4 h-4" />
                      <span className="text-[9px] font-bold">Attendance</span>
                    </div>
                  )}

                  {(permissionSubject !== 'customer' || (activeTab === 'roles' ? localPerms.has('employee.customer_profile.view') : getEmpEffectiveStatus('employee.customer_profile.view'))) && (
                  <div className="flex flex-col items-center gap-0.5 text-slate-600">
                    <User className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Profile</span>
                  </div>
                  )}
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
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ROLE SOURCE-OF-TRUTH INFO DRAWER                       */}
      {/* Employee Roles come from Designations — not created here  */}
      {/* ========================================================= */}
      <AdminFormDrawer
        isOpen={isRoleDrawerOpen}
        onClose={() => setIsRoleDrawerOpen(false)}
        title={
          permissionSubject === 'customer'
            ? drawerMode === 'edit'
              ? 'Edit Customer Role'
              : 'Create Customer Role'
            : 'Employee Roles & Designations'
        }
        subtitle={
          permissionSubject === 'customer'
            ? 'Customer roles use the same permission system as employee roles'
            : 'How Employee Roles are managed in this system'
        }
        isSubmitting={false}
        maxWidth="sm:max-w-[500px]"
        showFooter={false}
      >
        {permissionSubject === 'customer' ? (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Role name</label>
              <input
                value={roleFormData.name}
                onChange={(e) => setRoleFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                placeholder="Premium Customer"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                value={roleFormData.description}
                onChange={(e) => setRoleFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                rows={3}
              />
            </div>
            <button
              type="button"
              onClick={handleSaveRoleForm}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800 transition-colors"
            >
              {drawerMode === 'edit' ? 'Save Changes' : 'Create Customer Role'}
            </button>
          </div>
        ) : (
        <div className="space-y-5 py-2">
          {/* Info Banner */}
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex gap-3 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <FolderLock className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 mb-1">Designations are the Source of Truth</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Employee Roles in the Permissions page are automatically derived from your
                <strong> Employee Designations</strong>. Each Designation (e.g. Designer, Telecaller)
                maps to exactly one Role and its default permissions.
              </p>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-wide">Permission Resolution Flow</p>
            <div className="space-y-2">
              {[
                { step: '1', label: 'Designation', desc: 'Created in Settings → Designations' },
                { step: '2', label: 'Default Permissions', desc: 'Configured here in Roles & Permissions' },
                { step: '3', label: 'Employee Override', desc: 'INHERIT / ALLOW / DENY per employee' },
                { step: '4', label: 'Effective Permissions', desc: 'Fetched by the mobile app in real-time' },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <span className="font-bold text-slate-800">{label}</span>
                    <span className="text-slate-500"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold text-slate-700 mb-2">To add a new Employee Role:</p>
            <p className="text-xs text-slate-500 mb-4">
              Create a new <strong>Designation</strong> from the Designation management page.
              It will automatically appear here in Roles & Permissions once created.
            </p>
            <Link
              href="/designations"
              onClick={() => setIsRoleDrawerOpen(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Go to Designation Management
            </Link>
          </div>
        </div>
        )}
      </AdminFormDrawer>

    </div>
  );
}
