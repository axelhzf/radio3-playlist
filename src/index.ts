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
    console.log('========================================');
    console.log('🚀 Starting scheduled playlist update...');
    console.log('Event cron:', event.cron);
    console.log('Event scheduledTime:', new Date(event.scheduledTime).toISOString());
    console.log('========================================');

    try {
      // Check environment variables
      console.log('📋 Checking environment variables...');
      console.log('SPOTIFY_CLIENT_ID:', env.SPOTIFY_CLIENT_ID ? '✓ Set' : '✗ Missing');
      console.log('SPOTIFY_CLIENT_SECRET:', env.SPOTIFY_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
      console.log('SPOTIFY_ACCESS_TOKEN:', env.SPOTIFY_ACCESS_TOKEN ? '✓ Set' : '✗ Missing');
      console.log('SPOTIFY_REFRESH_TOKEN:', env.SPOTIFY_REFRESH_TOKEN ? '✓ Set' : '✗ Missing');

      if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_ACCESS_TOKEN || !env.SPOTIFY_REFRESH_TOKEN) {
        console.error('❌  Missing required Spotify credentials. Skipping playlist update.');
        return;
      }

      // Initialize Spotify client
      console.log('🎵 Initializing Spotify client...');
      const spotify = new Spotify(
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET,
        env.SPOTIFY_REDIRECT_URL
      );

      console.log('🔐 Authenticating with Spotify...');
      spotify.auth(env.SPOTIFY_ACCESS_TOKEN, env.SPOTIFY_REFRESH_TOKEN);

      // Refresh the access token to ensure it's valid
      try {
        await spotify.refreshAccessToken({ SPOTIFY_REFRESH_TOKEN: env.SPOTIFY_REFRESH_TOKEN });
      } catch (error) {
        console.error('⚠️  Failed to refresh access token', { error });
        throw error;
      }

      // Process each podcast
      console.log(`📻 Processing ${PODCASTS.length} podcasts...`);
      for (const podcast of PODCASTS) {
        console.log('----------------------------------------');
        console.log(`📡 Processing podcast: ${podcast.name}`);
        console.log(`📡 RSS feed: ${podcast.rss}`);

        try {
          console.log(`⬇️  Fetching episodes from RSS feed...`);
          const episodes = await fetchEpisodes(podcast.rss);
          console.log(`✓ Fetched ${episodes.length} episodes`);

          // Get the latest episode (first in the list)
          if (episodes.length > 0) {
            const latestEpisode = episodes[0];
            if (!latestEpisode) continue;

            console.log(`📝 Latest episode: ${latestEpisode.title}`);
            console.log(`📅 Published: ${latestEpisode.pubDate}`);
            console.log(`🎵 Found ${latestEpisode.playlist.length} tracks`);

            if (latestEpisode.playlist.length > 0) {
              console.log(`🎶 Sample tracks:`, latestEpisode.playlist.slice(0, 3).map(t => `${t.artist} - ${t.title}`).join(', '));
              console.log(`📤 Adding tracks to Spotify playlist: ${podcast.name}`);

              await spotify.addTracksToPlaylist(
                podcast.name,
                latestEpisode.playlist
              );
              console.log(`✅ Updated playlist for ${podcast.name}`);
            } else {
              console.log(`⚠️  No tracks found in latest episode`);
            }
          } else {
            console.log(`⚠️  No episodes found in feed`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${podcast.name}:`, error);
          if (error instanceof Error) {
            console.error(`   Error message: ${error.message}`);
            console.error(`   Stack trace:`, error.stack);
          }
        }
      }

      console.log('========================================');
      console.log('✅ Scheduled playlist update completed');
      console.log('========================================');
    } catch (error) {
      console.error('========================================');
      console.error('❌ Error in scheduled task:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Stack trace:', error.stack);
      }
      console.error('========================================');
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
