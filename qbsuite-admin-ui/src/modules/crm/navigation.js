import {
    faAddressBook,
    faBuilding,
    faChartBar,
    faChartLine,
    faClock,
    faHandshake,
    faListCheck,
    faShieldHalved,
    faUserCheck,
    faUserGroup,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { mockCrmKpiData } from '@/modules/crm/services/mock-data';

export const navigation = [
    {
        name: 'Leads',
        href: '/admin/crm/leads',
        icon: faUsers,
        badge: mockCrmKpiData.leadsCount.toString(),
    },
    {
        name: 'Customers',
        href: '/admin/crm/customers',
        icon: faUserGroup,
    },
    {
        name: 'Deals',
        href: '/admin/sections/deals',
        icon: faHandshake,
    },
    {
        name: 'Follow-ups',
        href: '/admin/sections/follow-ups',
        icon: faClock,
    },
    {
        name: 'Sales Reports',
        href: '/admin/sections/sales-reports',
        icon: faChartBar,
    },
    {
        name: 'Lead Limits',
        href: '/admin/sections/lead-limits',
        icon: faShieldHalved,
    },
    {
        name: 'Contacts',
        href: '/admin/sections/contacts',
        icon: faAddressBook,
    },
    {
        name: 'Companies',
        href: '/admin/sections/companies',
        icon: faBuilding,
    },
    {
        name: 'Visits',
        href: '/admin/sections/visits',
        icon: faUserCheck,
    },
    {
        name: 'Tasks',
        href: '/admin/sections/tasks',
        icon: faListCheck,
    },
    {
        name: 'Activities',
        href: '/admin/sections/activities',
        icon: faChartLine,
    },
];
