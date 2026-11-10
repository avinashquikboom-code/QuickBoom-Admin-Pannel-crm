// Display only identity information supplied by the authenticated session.
export function adminProfile(user) {
  const text = (value) => typeof value === 'string' ? value.trim() : '';
  const email = text(user?.email);
  const name = text(user?.fullName) || text(user?.name) ||
    [user?.firstName, user?.middleName, user?.lastName].map(text).filter(Boolean).join(' ') ||
    email || 'Account';
  const rawRole = user?.role || user?.roles?.[0];
  const roleName = text(rawRole?.name) || text(rawRole?.type) || text(rawRole);
  const role = roleName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  const initials = name === 'Account' && !user ? '?' :
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase();
  return { name, email, role, initials };
}
