import { faBuilding, faClock, faIndianRupeeSign, faGauge, faLocationDot, faMugHot, faPeopleGroup, faPercent, faSackDollar, faUsers, faWallet } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faCalendarCheck, faCalendarXmark, faFileLines } from '@fortawesome/free-regular-svg-icons';
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
        },
        {
            name: 'Expense Claims',
            href: '/admin/hrm/expense-claims',
            icon: faIndianRupeeSign,
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
            href: '/admin/hrm/shifts',
            icon: faClock,
        },
        {
            name: 'Remote Work',
            href: '/admin/hrm/remote-work',
            icon: faCalendar,
        },
        {
            name: 'Geo Tracking',
            href: '/admin/hrm/geo-tracking',
            icon: faLocationDot,
            tag: 'GEO_TRACKING',
        },
        {
            name: 'Commissions',
            href: '/admin/hrm/commissions',
            icon: faPercent,
            tag: 'PAYROLL',
        },
        {
            name: 'Loans',
            href: '/admin/hrm/loans',
            icon: faSackDollar,
            tag: 'PAYROLL',
        },
    ];
