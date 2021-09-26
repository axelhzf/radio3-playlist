import { NextApiRequest, NextApiResponse } from 'next';
import { PodcastWithEpisodes } from '../index';
import { first } from 'lodash';
import { getSpotifyFromRequest } from '../../services/getSpotifyFromRequest';
import { podcasts } from '../../services/podcasts';
import { fetchEpisodes } from '../../services/ivoxFetcher';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.setHeader('Content-Type', 'application/json');
  const spotify = await getSpotifyFromRequest(req, res);

  if (!spotify.isAuthenticated()) {
    res.statusCode = 401;
    res.end(JSON.stringify({ status: 'error' }));
    return;
  }

  const podcastWithEpisodes: PodcastWithEpisodes[] = await Promise.all(
    podcasts.map(async (podcast) => {
      const episodes = await fetchEpisodes(podcast.rss);
      return { ...podcast, episodes };
    })
  );

  for (const podcast of podcastWithEpisodes) {
    const playlist = first(podcast.episodes)?.playlist;
    if (playlist) {
      await spotify.addTracksToPlaylist(podcast.name, playlist);
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'success' }));
};
