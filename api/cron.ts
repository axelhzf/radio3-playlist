import { fetchEpisodes } from './_lib/ivoxFetcher.js';
import { Spotify } from './_lib/spotify.js';
import { createLogger } from './_lib/logger.js';
import { getPodcasts } from './_lib/podcasts.js';

const logger = createLogger();

interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  SPOTIFY_ACCESS_TOKEN: string;
  SPOTIFY_REFRESH_TOKEN: string;
  SPOTIFY_REDIRECT_URL?: string;
}

// Helper function to get environment variables
function getEnv(): Env {
  return {
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
    SPOTIFY_ACCESS_TOKEN: process.env.SPOTIFY_ACCESS_TOKEN || '',
    SPOTIFY_REFRESH_TOKEN: process.env.SPOTIFY_REFRESH_TOKEN || '',
    SPOTIFY_REDIRECT_URL: process.env.SPOTIFY_REDIRECT_URL,
  };
}

// Process a single podcast - can be called from both cron jobs and HTTP handlers
async function processPodcast(
  env: Env,
  podcast: { id: string; name: string; rss: string }
): Promise<void> {
  const podcastLogger = createLogger({
    podcastId: podcast.id,
    podcastName: podcast.name,
  });

  podcastLogger.info('Starting playlist update', {
    rssUrl: podcast.rss,
  });

  try {
    // Check environment variables
    const envCheck = {
      hasClientId: !!env.SPOTIFY_CLIENT_ID,
      hasClientSecret: !!env.SPOTIFY_CLIENT_SECRET,
      hasAccessToken: !!env.SPOTIFY_ACCESS_TOKEN,
      hasRefreshToken: !!env.SPOTIFY_REFRESH_TOKEN,
    };

    podcastLogger.debug('Checking environment variables', envCheck);

    if (
      !env.SPOTIFY_CLIENT_ID ||
      !env.SPOTIFY_CLIENT_SECRET ||
      !env.SPOTIFY_ACCESS_TOKEN ||
      !env.SPOTIFY_REFRESH_TOKEN
    ) {
      podcastLogger.error('Missing required Spotify credentials', {
        missingVars: Object.entries(envCheck)
          .filter(([, value]) => !value)
          .map(([key]) => key),
      });
      return;
    }

    // Initialize Spotify client
    podcastLogger.info('Initializing Spotify client');
    const spotify = new Spotify(
      env.SPOTIFY_CLIENT_ID,
      env.SPOTIFY_CLIENT_SECRET,
      env.SPOTIFY_REDIRECT_URL
    );

    podcastLogger.debug('Authenticating with Spotify');
    spotify.auth(env.SPOTIFY_ACCESS_TOKEN, env.SPOTIFY_REFRESH_TOKEN);

    // Refresh the access token to ensure it's valid
    try {
      podcastLogger.debug('Refreshing Spotify access token');
      await spotify.refreshAccessToken({
        SPOTIFY_REFRESH_TOKEN: env.SPOTIFY_REFRESH_TOKEN,
      });
      podcastLogger.info('Successfully refreshed access token');
    } catch (error) {
      podcastLogger.error(
        'Failed to refresh Spotify access token',
        {},
        error instanceof Error ? error : undefined
      );
      throw error;
    }

    // Process the podcast
    try {
      podcastLogger.info('Fetching episodes from RSS feed', {
        rssUrl: podcast.rss,
      });
      const startTime = Date.now();
      const episodes = await fetchEpisodes(podcast.rss);
      const fetchDuration = Date.now() - startTime;

      podcastLogger.info('Successfully fetched episodes', {
        episodeCount: episodes.length,
        fetchDurationMs: fetchDuration,
      });

      // Get the latest episode (first in the list)
      if (episodes.length > 0) {
        const latestEpisode = episodes[0];
        if (!latestEpisode) {
          podcastLogger.warn('No valid episode found in feed');
          return;
        }

        podcastLogger.info('Processing latest episode', {
          episodeTitle: latestEpisode.title,
          publishDate: latestEpisode.pubDate,
          trackCount: latestEpisode.playlist.length,
          audioUrl: latestEpisode.audio,
        });

        if (latestEpisode.playlist.length > 0) {
          const sampleTracks = latestEpisode.playlist.slice(0, 3).map((t) => ({
            artist: t.artist,
            title: t.title,
          }));

          podcastLogger.debug('Sample tracks from episode', {
            sampleTracks,
            totalTracks: latestEpisode.playlist.length,
          });

          podcastLogger.info('Adding tracks to Spotify playlist');
          const playlistStartTime = Date.now();

          await spotify.addTracksToPlaylist(
            podcast.name,
            latestEpisode.playlist
          );

          const playlistDuration = Date.now() - playlistStartTime;
          podcastLogger.info('Successfully updated Spotify playlist', {
            tracksAdded: latestEpisode.playlist.length,
            durationMs: playlistDuration,
          });
        } else {
          podcastLogger.warn('No tracks found in latest episode', {
            episodeTitle: latestEpisode.title,
          });
        }
      } else {
        podcastLogger.warn('No episodes found in RSS feed', {
          rssUrl: podcast.rss,
        });
      }
    } catch (error) {
      podcastLogger.error(
        'Error processing podcast',
        {
          stage: 'episode_processing',
        },
        error instanceof Error ? error : undefined
      );
      throw error;
    }

    podcastLogger.info('Playlist update completed successfully');
  } catch (error) {
    podcastLogger.error(
      'Fatal error in podcast processing',
      {
        stage: 'top_level',
      },
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}

export async function GET(request: Request): Promise<Response> {
  const env = getEnv();

  const results = [];
  const overallStartTime = Date.now();

  const podcasts = getPodcasts();
  for (const podcast of podcasts) {
    try {
      logger.info('Starting podcast processing', {
        podcastId: podcast.id,
        podcastName: podcast.name,
      });

      const startTime = Date.now();
      await processPodcast(env, podcast);
      const duration = Date.now() - startTime;

      results.push({
        podcast: podcast.name,
        success: true,
        durationMs: duration,
      });

      logger.info('Podcast processing completed', {
        podcastId: podcast.id,
        durationMs: duration,
      });
    } catch (error) {
      results.push({
        podcast: podcast.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      logger.error(
        'Podcast processing failed',
        {
          podcastId: podcast.id,
          podcastName: podcast.name,
        },
        error instanceof Error ? error : undefined
      );
    }
  }

  const overallDuration = Date.now() - overallStartTime;
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  logger.info('All podcasts processed', {
    totalPodcasts: podcasts.length,
    successCount,
    failureCount,
    totalDurationMs: overallDuration,
  });

  return Response.json(
    {
      success: failureCount === 0,
      totalPodcasts: podcasts.length,
      successCount,
      failureCount,
      totalDurationMs: overallDuration,
      results,
    },
    {
      status: failureCount === 0 ? 200 : 207,
    }
  );
}
