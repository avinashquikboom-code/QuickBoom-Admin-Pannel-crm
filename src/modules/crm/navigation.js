import {
    faAddressBook,
    faBuilding,
    faChartLine,
    faClock,
    faHandshake,
    faListCheck,
    faPaperPlane,
    faShieldHalved,
    faUserCheck,
    faUserGroup,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';

export const navigation = [
    { name: 'Leads', href: '/admin/crm/leads', icon: faUsers },
    { name: 'Customers', href: '/admin/crm/customers', icon: faUserGroup },
    { name: 'Deals', href: '/admin/crm/deals', icon: faHandshake },
    { name: 'Follow-ups', href: '/admin/crm/follow-ups', icon: faClock },
    { name: 'Send Details', href: '/admin/crm/send-details', icon: faPaperPlane },
    { name: 'Lead Limits', href: '/admin/crm/lead-limits', icon: faShieldHalved },
    { name: 'Contacts', href: '/admin/crm/contacts', icon: faAddressBook },
    { name: 'Companies', href: '/admin/crm/companies', icon: faBuilding },
    { name: 'Visits', href: '/admin/crm/visits', icon: faUserCheck },
    { name: 'Tasks', href: '/admin/crm/tasks', icon: faListCheck },
    { name: 'Activities', href: '/admin/crm/activities', icon: faChartLine },
];
