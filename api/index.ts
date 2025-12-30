import { fetchEpisodes } from '../lib/ivoxFetcher';
import { Spotify } from '../lib/spotify';
import { createLogger } from '../lib/logger';

const logger = createLogger();

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
async function processPodcast(env: Env, podcast: { id: string; name: string; rss: string }): Promise<void> {
  const podcastLogger = createLogger({ podcastId: podcast.id, podcastName: podcast.name });

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

    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_ACCESS_TOKEN || !env.SPOTIFY_REFRESH_TOKEN) {
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
      await spotify.refreshAccessToken({ SPOTIFY_REFRESH_TOKEN: env.SPOTIFY_REFRESH_TOKEN });
      podcastLogger.info('Successfully refreshed access token');
    } catch (error) {
      podcastLogger.error('Failed to refresh Spotify access token', {}, error instanceof Error ? error : undefined);
      throw error;
    }

    // Process the podcast
    try {
      podcastLogger.info('Fetching episodes from RSS feed', { rssUrl: podcast.rss });
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
          const sampleTracks = latestEpisode.playlist.slice(0, 3).map(t => ({
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
        podcastLogger.warn('No episodes found in RSS feed', { rssUrl: podcast.rss });
      }
    } catch (error) {
      podcastLogger.error('Error processing podcast', {
        stage: 'episode_processing',
      }, error instanceof Error ? error : undefined);
      throw error;
    }

    podcastLogger.info('Playlist update completed successfully');
  } catch (error) {
    podcastLogger.error('Fatal error in podcast processing', {
      stage: 'top_level',
    }, error instanceof Error ? error : undefined);
    throw error;
  }
}

// Main Vercel Function handler
export default async function handler(request: Request): Promise<Response> {
  const env = getEnv();
  const url = new URL(request.url);

  logger.info('Incoming HTTP request', {
    method: request.method,
    pathname: url.pathname,
    searchParams: Object.fromEntries(url.searchParams),
  });

  // Handle /cron/:podcast_id route - manually trigger task for a specific podcast
  const cronMatch = url.pathname.match(/^\/cron\/([^/]+)$/);
  if (cronMatch) {
    const podcastId = cronMatch[1];
    const podcast = PODCASTS.find(p => p.id === podcastId);

    if (!podcast) {
      logger.warn('Podcast not found', {
        requestedPodcastId: podcastId,
        availablePodcasts: PODCASTS.map(p => p.id),
      });

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

    logger.info('Manually triggering podcast cron job', {
      podcastId: podcast.id,
      podcastName: podcast.name,
    });

    try {
      const startTime = Date.now();
      await processPodcast(env, podcast);
      const duration = Date.now() - startTime;

      logger.info('Podcast cron job completed successfully', {
        podcastId: podcast.id,
        durationMs: duration,
      });

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
      logger.error('Podcast cron job failed', {
        podcastId: podcast.id,
        podcastName: podcast.name,
      }, error instanceof Error ? error : undefined);

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
  logger.info('Fetching latest episodes for all podcasts', {
    podcastCount: PODCASTS.length,
  });

  try {
    const results = await Promise.all(
      PODCASTS.map(async (podcast) => {
        try {
          logger.debug('Fetching episodes for podcast', {
            podcastId: podcast.id,
            podcastName: podcast.name,
          });

          const episodes = await fetchEpisodes(podcast.rss);
          const latestEpisode = episodes.length > 0 ? episodes[0] : null;

          logger.debug('Fetched episodes for podcast', {
            podcastId: podcast.id,
            episodeCount: episodes.length,
            hasLatestEpisode: !!latestEpisode,
          });

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
          logger.error('Failed to fetch episodes for podcast', {
            podcastId: podcast.id,
            podcastName: podcast.name,
          }, error instanceof Error ? error : undefined);

          return {
            podcast: podcast.name,
            rss: podcast.rss,
            error: error instanceof Error ? error.message : 'Unknown error',
            latestEpisode: null,
          };
        }
      })
    );

    logger.info('Successfully fetched all podcast episodes', {
      successCount: results.filter(r => !('error' in r)).length,
      errorCount: results.filter(r => 'error' in r).length,
    });

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Fatal error fetching podcast episodes', {}, error instanceof Error ? error : undefined);

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
}
