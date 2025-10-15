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
    id: 'turbo3',
    name: 'Turbo3',
    rss: 'https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml',
  },
  {
    id: 'na-na-na',
    name: 'Na na na',
    rss: 'https://www.ivoox.com/na-na-na_fg_f1128042_filtro_1.xml',
  },
  {
    id: '180-grados',
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
    console.log('Event cron:', event.cron);
    console.log('Event scheduledTime:', new Date(event.scheduledTime).toISOString());

    // Determine which podcast to run based on the cron pattern
    const cronToPodcast: Record<string, typeof PODCASTS[number]> = {
      '0 9 * * *': PODCASTS[0]!,   // Turbo3
      '5 9 * * *': PODCASTS[1]!,   // Na na na
      '10 9 * * *': PODCASTS[2]!,  // 180 grados
    };

    const podcast = cronToPodcast[event.cron];
    if (podcast) {
      console.log(`🎯 Running scheduled task for podcast: ${podcast.name}`);
      await this.processPodcast(env, podcast);
    } else {
      console.log('⚠️ No podcast matched for this cron schedule:', event.cron);
    }
  },

  // Handle HTTP requests - returns latest episodes with parsed tracks
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle /cron/:podcast_id route - manually trigger task for a specific podcast
    const cronMatch = url.pathname.match(/^\/cron\/([^/]+)$/);
    if (cronMatch) {
      const podcastId = cronMatch[1];
      const podcast = PODCASTS.find(p => p.id === podcastId);

      if (!podcast) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Podcast not found: ${podcastId}`,
            availablePodcasts: PODCASTS.map(p => ({
              id: p.id,
              name: p.name
            }))
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      try {
        await this.processPodcast(env, podcast);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Scheduled task executed successfully for ${podcast.name}`
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            podcast: podcast.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Default route - return latest episodes info
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

  // Process a single podcast - can be called from both scheduled() and fetch()
  async processPodcast(env: Env, podcast: { id: string; name: string; rss: string }): Promise<void> {
    console.log('========================================');
    console.log(`🚀 Starting playlist update for ${podcast.name}...`);
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

      // Process the podcast
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
          if (!latestEpisode) {
            console.log(`⚠️  No valid episode found`);
            return;
          }

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
        throw error;
      }

      console.log('========================================');
      console.log(`✅ Playlist update completed for ${podcast.name}`);
      console.log('========================================');
    } catch (error) {
      console.error('========================================');
      console.error(`❌ Error in scheduled task for ${podcast.name}:`, error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Stack trace:', error.stack);
      }
      console.error('========================================');
      throw error;
    }
  },
};
