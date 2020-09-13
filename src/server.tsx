import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Spotify } from './spotify';
import cookieParser from 'cookie-parser';
import { createPlaylistFromPodcast } from "./createPlaylistFromPodcast";
import * as spotify from "./spotify";

const app = express();
app.use(cookieParser() as any);

const port = 3000;

const Login: React.FunctionComponent<{ authUrl: string }> = ({ authUrl }) => (
  <a href={authUrl}>Login with spotify</a>
);

app.get('/', async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.cookies ?? {};
    const spotify = new Spotify();

    if (!accessToken || !refreshToken) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      const url = await spotify.getAuthorizeUrl();
      res.send(renderToString(<Login authUrl={url} />));
      return;
    } else {
      spotify.auth(accessToken, refreshToken);
    }
    const me = await spotify.getMe();
    res.send(renderToString(
      <div>Logged in as {me.display_name}. <a href="/podcast-to-playlist">Process</a></div>));
  } catch (e) {
    console.error(e);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.send('error :( ');
  }
});

app.get('/podcast-to-playlist', async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.cookies ?? {};
    const spotify = new Spotify();
    if (!(!accessToken || !refreshToken)) {
      spotify.auth(accessToken, refreshToken);
    } else {
      res.send(401);
    }

    const podcasts = [
      { name: 'Turbo3', rss: 'https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml' },
      { name: 'Na na na', rss: 'https://www.ivoox.com/na-na-na_fg_f1128042_filtro_1.xml'},
      //  180 grados is not working
      //{ name: '180 grados', rss: 'http://api.rtve.es/api/programas/22270/audios.rss'}
    ];

    for (const podcast of podcasts) {
      await createPlaylistFromPodcast(spotify, podcast, 1);
    }

    res.send({ status: 'ok' });
  } catch (e) {
    console.error(e);
    res.send({ status: 'error' })
  }
});

app.get('/spotify/auth', async (req, res) => {


});

app.listen(port, () => console.log(`Spotify auth server running on http://localhost:${port}`));
