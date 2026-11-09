import { faChartLine, faClock, faFileInvoiceDollar, faShieldHalved, faTicket, faUserGroup } from '@fortawesome/free-solid-svg-icons';
export const navigation = [
    { name: 'Customer Dashboard', href: '/admin/customer/dashboard', icon: faUserGroup },
    { name: 'Invoices & Billing', href: '/admin/customer/invoices', icon: faFileInvoiceDollar },
    { name: 'Coupons', href: '/admin/customer/coupons', icon: faTicket },
    { name: 'Active Subscriptions', href: '/admin/customer/subscriptions', icon: faShieldHalved },
    { name: 'Offline Payment Requests', href: '/admin/customer/offline-payments', icon: faClock },
    { name: 'Resource Usage', href: '/admin/customer/usage', icon: faChartLine },
];
