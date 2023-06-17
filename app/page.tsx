import { Episode, fetchEpisodes } from '../services/ivoxFetcher';
//import { useState } from 'react';
import { getSpotifyFromRequest } from '../services/getSpotifyFromRequest';
import { podcasts } from '../services/podcasts';
import { EpisodeTracks } from './EpisodeTracks';

export const dynamic = 'force-dynamic';

export default async function Index() {
  const spotify = await getSpotifyFromRequest();
  let me: SpotifyApi.CurrentUsersProfileResponse | null = null;

  if (spotify.isAuthenticated()) {
    me = await spotify.getMe();
  }

  const podcastWithEpisodes = await Promise.all(
    podcasts.map(async (podcast) => {
      const episodes = await fetchEpisodes(podcast.rss);
      return { ...podcast, episodes };
    })
  );

  return (
    <>
      {!me && (
        <div className="my-3">
          <a
            href={spotify.getAuthorizeUrl()}
            className="bg-green-500 py-2 px-6 rounded-md text-white"
          >
            Log in with Spotify
          </a>
        </div>
      )}
      {me && (
        <>
          <div>Logged in as {me.display_name}</div>
        </>
      )}

      <div>
        {podcastWithEpisodes.map((podcast) => (
          <div key={podcast.name}>
            <h3 className="text-xl mt-8 mb-4">{podcast.name}</h3>
            <div className="ml-4 mb-8">
              {podcast.episodes.map((episode) => (
                <EpisodeTracks
                  key={episode.pubDate + episode.title}
                  podcastName={podcast.name}
                  episode={episode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
