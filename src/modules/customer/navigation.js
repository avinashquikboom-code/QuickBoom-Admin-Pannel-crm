import { faChartLine, faClock, faFileInvoiceDollar, faShieldHalved, faTicket, faUserGroup } from '@fortawesome/free-solid-svg-icons';
export const navigation = [
    { name: 'Customer Dashboard', href: '/admin/customer/dashboard', icon: faUserGroup },
    { name: 'Invoices & Billing', href: '/admin/sections/invoices-billing', icon: faFileInvoiceDollar },
    { name: 'Coupons', href: '/admin/sections/coupons', icon: faTicket },
    { name: 'Active Subscriptions', href: '/admin/sections/active-subscriptions', icon: faShieldHalved },
    { name: 'Offline Payment Requests', href: '/admin/sections/offline-payments', icon: faClock },
    { name: 'Resource Usage', href: '/admin/sections/resource-usage', icon: faChartLine },
];
