// Display only identity information supplied by the authenticated session.
export function adminProfile(user) {
  const text = (value) => typeof value === 'string' ? value.trim() : '';
  const email = text(user?.email);
  const rawRole = user?.effectiveRole || user?.role || user?.roles?.[0] || user?.roleType;
  const roleName = text(rawRole?.name) || text(rawRole?.type) || text(rawRole);
  let role = roleName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

  let name = text(user?.fullName) || text(user?.name) ||
    [user?.firstName, user?.middleName, user?.lastName].map(text).filter(Boolean).join(' ');

  const isSuperAdmin =
    role.toLowerCase().includes('super admin') ||
    role.toLowerCase() === 'admin' ||
    roleName.toUpperCase() === 'SUPER_ADMIN' ||
    roleName.toUpperCase() === 'ADMIN' ||
    (Array.isArray(user?.roles) && user.roles.some((r) => {
      const val = String(r?.name || r?.type || r).toUpperCase();
      return val === 'SUPER_ADMIN' || val === 'ADMIN';
    })) ||
    user?.customerId == null;

  if (isSuperAdmin) {
    if (!role || role.toLowerCase() === 'admin') role = 'Super Admin';
    if (!name || name === 'Account') name = 'Super Admin';
  } else if (!name) {
    name = email || 'Account';
  }

  const initials = (name === 'Account' && !user) ? '?' :
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase();
  return { name, email, role: role || (name === 'Super Admin' ? 'Super Admin' : ''), initials };
}
