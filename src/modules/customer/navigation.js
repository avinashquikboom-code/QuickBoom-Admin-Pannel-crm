import { faChartLine, faClock, faFileInvoiceDollar, faShareNodes, faShieldHalved, faTicket, faUserGroup } from '@fortawesome/free-solid-svg-icons';
export const navigation = [
    { name: 'Dashboard', href: '/admin/customer/dashboard', icon: faUserGroup },
    { name: 'Invoices & Billing', href: '/admin/customer/invoices', icon: faFileInvoiceDollar },
    { name: 'Coupons', href: '/admin/customer/coupons', icon: faTicket },
    { name: 'Active Subscriptions', href: '/admin/customer/subscriptions', icon: faShieldHalved },
    { name: 'Offline Payment Requests', href: '/admin/customer/offline-payments', icon: faClock },
    { name: 'Resource Usage', href: '/admin/customer/usage', icon: faChartLine },
    { name: 'SSM Account Access Details', href: '/admin/ssm-access', icon: faShareNodes },
];
