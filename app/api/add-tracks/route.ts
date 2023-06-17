import { NextApiRequest, NextApiResponse } from 'next';
import { flatMap } from 'lodash';
import { getSpotifyFromRequest } from '../../../services/getSpotifyFromRequest';
import { NextRequest, NextResponse } from 'next/server';
import { PodcastWithEpisodes } from '../../../services/PodcastWithEpisodes';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const spotify = await getSpotifyFromRequest();

  if (!spotify.isAuthenticated()) {
    return NextResponse.json(
      { status: 'error', message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const podcastWithEpisodes: PodcastWithEpisodes[] = await request.json();
  for (const podcast of podcastWithEpisodes) {
    const allTracks = flatMap(podcast.episodes, (e) => e.playlist);
    await spotify.addTracksToPlaylist(podcast.name, allTracks);
  }

  return NextResponse.json({ status: 'success ' });
}
