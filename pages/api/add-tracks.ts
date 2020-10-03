import { NextApiRequest, NextApiResponse } from 'next';
import { PodcastWithEpisodes } from '../index';
import { flatMap } from 'lodash';
import { parse } from 'cookie';
import { Spotify } from '../../services/spotify';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Content-Type', 'application/json');

  const cookies = parse((req.headers.cookie as string) ?? '');
  const accessToken = cookies.accessToken ?? null;
  const refreshToken = cookies.refreshToken ?? null;

  if (!accessToken || !refreshToken) {
    res.statusCode = 401;
    res.end(JSON.stringify({ status: 'error' }));
    return;
  }

  const spotify = new Spotify();
  spotify.auth(accessToken, refreshToken);

  const podcastWithEpisodes: PodcastWithEpisodes[] = JSON.parse(req.body);
  for (const podcast of podcastWithEpisodes) {
    const allTracks = flatMap(podcast.episodes, (e) => e.playlist);
    await spotify.addTracksToPlaylist(podcast.name, allTracks);
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'success' }));
};
