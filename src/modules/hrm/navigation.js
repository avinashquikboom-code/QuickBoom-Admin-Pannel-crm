import { faBuilding, faBullseye, faClock, faIndianRupeeSign, faGauge, faLocationDot, faMugHot, faPeopleGroup, faPercent, faSackDollar, faUsers, faWallet } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faCalendarCheck, faCalendarXmark, faFileLines } from '@fortawesome/free-regular-svg-icons';
export const navigation = [
        {
            name: 'Dashboard',
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
            name: 'Overtime Management',
            href: '/admin/hrm/overtime',
            icon: faClock,
        },
        {
            name: 'Leave Management',
            href: '/admin/hrm/leaves',
            icon: faCalendarXmark,
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
            name: 'Payroll',
            href: '/admin/hrm/payroll',
            icon: faWallet,
            tag: 'PAYROLL',
            children: [
                { name: 'Salary Management', href: '/admin/hrm/payroll', icon: faWallet, matchExact: true },
                { name: 'Salary Slips', href: '/admin/hrm/salary-slips', icon: faFileLines },
                { name: 'Employee Penalty & Deductions', href: '/admin/hrm/deductions', icon: faIndianRupeeSign },
                { name: 'Expense Claims', href: '/admin/hrm/expense-claims', icon: faIndianRupeeSign },
                { name: 'Target Salary', href: '/admin/hrm/salary-targets', icon: faBullseye },
                { name: 'Loans', href: '/admin/hrm/loans', icon: faSackDollar },
                { name: 'Shifts', href: '/admin/hrm/shifts', icon: faClock },
                { name: 'Commissions', href: '/admin/hrm/commissions', icon: faPercent },
            ],
        },
    ];
