import { NextApiRequest, NextApiResponse } from 'next';
import { PodcastWithEpisodes } from '../index';
import { flatMap } from 'lodash';
import { getSpotifyFromRequest } from '../../services/getSpotifyFromRequest';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Content-Type', 'application/json');
  const spotify = await getSpotifyFromRequest(req, res);

  if (!spotify.isAuthenticated()) {
    res.statusCode = 401;
    res.end(JSON.stringify({ status: 'error' }));
    return;
  }

  const podcastWithEpisodes: PodcastWithEpisodes[] = JSON.parse(req.body);
  for (const podcast of podcastWithEpisodes) {
    const allTracks = flatMap(podcast.episodes, (e) => e.playlist);
    await spotify.addTracksToPlaylist(podcast.name, allTracks);
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'success' }));
};
