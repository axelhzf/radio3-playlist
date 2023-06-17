import { Spotify } from '../../../services/spotify';
import { NextRequest, NextResponse } from 'next/server';
import { serialize as serialize } from 'cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const spotify = new Spotify();
  const { searchParams } = new URL(request.url);
  const code = searchParams?.get('code');

  if (!code) return NextResponse.redirect(new URL(`/error`, request.url));

  const { accessToken, refreshToken, expiresIn } = await spotify.getToken(code);
  const response = NextResponse.redirect(new URL('/', request.url));
  response.headers.append(
    'Set-Cookie',
    serialize('accessToken', accessToken, { maxAge: expiresIn, path: '/' })
  );
  response.headers.append(
    'Set-Cookie',
    serialize('refreshToken', refreshToken, { maxAge: 31536000, path: '/' })
  );
  return response;
}
