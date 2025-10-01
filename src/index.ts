import { fetchEpisodes } from './ivoxFetcher';
import { Spotify } from './spotify';

interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_ACCESS_TOKEN: string;
  SPOTIFY_REFRESH_TOKEN: string;
  SPOTIFY_REDIRECT_URL?: string;
}

const PODCASTS = [
  {
    name: 'Turbo3',
    rss: 'https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml',
  },
  {
    name: 'Na na na',
    rss: 'https://www.ivoox.com/na-na-na_fg_f1128042_filtro_1.xml',
  },
  {
    name: '180 grados',
    rss: 'http://api.rtve.es/api/programas/22270/audios.rss',
  },
];

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Starting scheduled playlist update...');

    try {
      // Initialize Spotify client
      const spotify = new Spotify(
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET,
        env.SPOTIFY_REDIRECT_URL
      );

      spotify.auth(env.SPOTIFY_ACCESS_TOKEN, env.SPOTIFY_REFRESH_TOKEN);

      // Process each podcast
      for (const podcast of PODCASTS) {
        console.log(`Processing podcast: ${podcast.name}`);

        try {
          const episodes = await fetchEpisodes(podcast.rss);

          // Get the latest episode (first in the list)
          if (episodes.length > 0) {
            const latestEpisode = episodes[0];
            console.log(`Latest episode: ${latestEpisode.title}`);
            console.log(`Found ${latestEpisode.playlist.length} tracks`);

            if (latestEpisode.playlist.length > 0) {
              await spotify.addTracksToPlaylist(
                podcast.name,
                latestEpisode.playlist
              );
              console.log(`✅ Updated playlist for ${podcast.name}`);
            }
          }
        } catch (error) {
          console.error(`Error processing ${podcast.name}:`, error);
        }
      }

      console.log('Scheduled playlist update completed');
    } catch (error) {
      console.error('Error in scheduled task:', error);
      throw error;
    }
  },

  // Handle HTTP requests - returns latest episodes with parsed tracks
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      const results = await Promise.all(
        PODCASTS.map(async (podcast) => {
          try {
            const episodes = await fetchEpisodes(podcast.rss);
            const latestEpisode = episodes.length > 0 ? episodes[0] : null;

            return {
              podcast: podcast.name,
              rss: podcast.rss,
              latestEpisode: latestEpisode
                ? {
                    title: latestEpisode.title,
                    pubDate: latestEpisode.pubDate,
                    audio: latestEpisode.audio,
                    tracksCount: latestEpisode.playlist.length,
                    tracks: latestEpisode.playlist,
                  }
                : null,
            };
          } catch (error) {
            return {
              podcast: podcast.name,
              rss: podcast.rss,
              error: error instanceof Error ? error.message : 'Unknown error',
              latestEpisode: null,
            };
          }
        })
      );

      return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
