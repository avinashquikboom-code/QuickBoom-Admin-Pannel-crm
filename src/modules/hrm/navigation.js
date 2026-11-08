import { faBell, faBuilding, faChartLine, faClock, faIndianRupeeSign, faGauge, faLocationDot, faMugHot, faPeopleGroup, faPercent, faSackDollar, faUsers, faWallet } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faCalendarCheck, faCalendarXmark, faFileLines } from '@fortawesome/free-regular-svg-icons';
import { mockKpiData } from '@/lib/mock-data';
export const navigation = [
        {
            name: 'HRM Dashboard',
            href: '/admin/hrm/dashboard',
            icon: faGauge,
            matchExact: true,
        },
        {
            name: 'Employees',
            href: '/admin/hrm/employees',
            icon: faUsers,
            badge: '10',
        },
        {
            name: 'Attendance',
            href: '/admin/hrm/attendance',
            icon: faCalendarCheck,
        },
        {
            name: 'Break Management',
            href: '/admin/hrm/break-management',
            icon: faMugHot,
        },
        {
            name: 'Overtime Approvals',
            href: '/admin/hrm/overtime',
            icon: faClock,
            badge: mockKpiData.pendingOvertime.toString(),
            badgeVariant: 'warning',
        },
        {
            name: 'Expense Claims',
            href: '/admin/hrm/expense-claims',
            icon: faIndianRupeeSign,
            badge: mockKpiData.pendingExpenses.toString(),
            badgeVariant: 'warning',
            tag: 'PAYROLL',
        },
        {
            name: 'Leave Management',
            href: '/admin/hrm/leaves',
            icon: faCalendarXmark,
        },
        {
            name: 'Payroll',
            href: '/admin/hrm/payroll',
            icon: faWallet,
            tag: 'PAYROLL',
        },
        {
            name: 'Salary Slips',
            href: '/admin/hrm/salary-slips',
            icon: faFileLines,
        },
        {
            name: 'Announcements',
            href: '/admin/hrm/announcements',
            icon: faBell,
        },
        {
            name: 'HRM Reports',
            href: '/admin/hrm/reports',
            icon: faChartLine,
        },
        {
            name: 'Office Management',
            href: '/admin/sections/office-management',
            icon: faBuilding,
        },
        {
            name: 'Team Management',
            href: '/admin/sections/team-management',
            icon: faPeopleGroup,
        },
        {
            name: 'Shifts',
            href: '/admin/sections/shifts',
            icon: faClock,
        },
        {
            name: 'Remote Work',
            href: '/admin/sections/remote-work',
            icon: faCalendar,
        },
        {
            name: 'Geo Tracking',
            href: '/admin/sections/geo-tracking',
            icon: faLocationDot,
            tag: 'GEO_TRACKING',
        },
        {
            name: 'Commissions',
            href: '/admin/sections/commissions',
            icon: faPercent,
            tag: 'PAYROLL',
        },
        {
            name: 'Loans',
            href: '/admin/sections/loans',
            icon: faSackDollar,
            tag: 'PAYROLL',
        },
    ];
