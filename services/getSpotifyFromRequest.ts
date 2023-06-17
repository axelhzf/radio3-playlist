'use server';

import { Spotify } from './spotify';
import { cookies } from 'next/headers';

export async function getSpotifyFromRequest() {
  const c = cookies();
  let accessToken = c.get('accessToken')?.value ?? null;
  const refreshToken = c.get('refreshToken')?.value ?? null;

  const spotify = new Spotify();
  if (refreshToken) spotify.setRefreshToken(refreshToken);
  if (accessToken) spotify.setAccessToken(accessToken);

  if (accessToken == null && refreshToken !== null) {
    const { accessToken, expiresIn } = await spotify.refreshAccessToken();
    spotify.setAccessToken(accessToken);
    c.set('accessToken', accessToken, { maxAge: expiresIn, path: '/' });
  }

  return spotify;
}
