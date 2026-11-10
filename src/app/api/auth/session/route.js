const SESSION_COOKIE = 'qb_admin_session';

export async function GET(request) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  return Response.json({ authenticated: Boolean(cookie) });
}
