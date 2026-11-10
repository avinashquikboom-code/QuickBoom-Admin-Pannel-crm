const SESSION_COOKIE = 'qb_admin_session';

export async function POST(request) {
  const forwarded = request.headers.get('x-forwarded-proto');
  const secure = forwarded ? forwarded.split(',')[0].trim() === 'https' : new URL(request.url).protocol === 'https:';
  const response = Response.json({ ok: true });
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=0`,
  );
  return response;
}
