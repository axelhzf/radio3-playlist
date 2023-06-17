import { first } from 'lodash';
import { getSpotifyFromRequest } from '../../../services/getSpotifyFromRequest';
import { podcasts } from '../../../services/podcasts';
import { fetchEpisodes } from '../../../services/ivoxFetcher';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spotify = await getSpotifyFromRequest();

  if (!spotify.isAuthenticated()) {
    return NextResponse.json(
      { status: 'error', message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const podcastWithEpisodes = await Promise.all(
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

  return NextResponse.json({ status: 'success' });
}
