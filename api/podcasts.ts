import { fetchEpisodes } from './_lib/ivoxFetcher.js';
import { logger } from './_lib/logger.js';
import { getPodcasts } from './_lib/podcasts.js';

export async function GET(request: Request): Promise<Response> {
  const podcasts = getPodcasts();

  // Default route - return latest episodes info
  logger.info('Fetching latest episodes for all podcasts', {
    podcastCount: podcasts.length,
  });

  try {
    const results = await Promise.all(
      podcasts.map(async (podcast) => {
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
          logger.error(
            'Failed to fetch episodes for podcast',
            {
              podcastId: podcast.id,
              podcastName: podcast.name,
            },
            error instanceof Error ? error : undefined
          );

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
      successCount: results.filter((r) => !('error' in r)).length,
      errorCount: results.filter((r) => 'error' in r).length,
    });

    return new Response(JSON.stringify(results, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error(
      'Fatal error fetching podcast episodes',
      {},
      error instanceof Error ? error : undefined
    );

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
