import { IncomingMessage, ServerResponse } from 'http';
import { parse, serialize } from 'cookie';
import { Spotify } from './spotify';

export async function getSpotifyFromRequest(req: IncomingMessage, res: ServerResponse ) {
  const cookies = parse((req.headers.cookie as string) ?? '');
  let accessToken = cookies.accessToken ?? null;
  const refreshToken = cookies.refreshToken ?? null;

  const spotify = new Spotify();

  if (refreshToken) spotify.setRefreshToken(refreshToken);
  if (accessToken) spotify.setAccessToken(accessToken);

  if (accessToken == null && refreshToken !== null) {
    const { accessToken, expiresIn } = await spotify.refreshAccessToken();
    spotify.setAccessToken(accessToken);

    res.setHeader('Set-Cookie', [
      serialize('accessToken', accessToken, { maxAge: expiresIn, path: '/' }),
    ]);
  }

  return spotify;
}


