import { GetServerSideProps } from 'next';
import { parse, serialize } from 'cookie';
import { Spotify } from '../services/spotify';
import { Layout } from '../components/Layout';
import { Episode, fetchEpisodes } from '../services/ivoxFetcher';
import { useState } from 'react';

export type PodcastWithEpisodes = {
  name: string;
  rss: string;
  episodes: Episode[];
};

type Props = {
  me: SpotifyApi.CurrentUsersProfileResponse | null;
  authUrl: string;
  podcastWithEpisodes: PodcastWithEpisodes[];
};

export default function Index(props: Props) {
  return (
    <Layout>
      {!props.me && (
        <>
          <div className="my-3">
            <a
              href={props.authUrl}
              className="bg-green-500 py-2 px-6 rounded-md text-white"
            >
              Log in with Spotify
            </a>
          </div>
        </>
      )}
      {props.me && (
        <>
          <div>Logged in as {props.me.display_name}</div>
        </>
      )}

      <div>
        {props.podcastWithEpisodes.map((podcast) => (
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
    </Layout>
  );
}

function EpisodeTracks(props: { podcastName: string; episode: Episode }) {
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  async function addTracks() {
    setLoading(true);
    try {
      await fetch('/api/add-tracks', {
        method: 'POST',
        body: JSON.stringify([
          {
            name: props.podcastName,
            episodes: [props.episode],
          },
        ]),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h4 className="flex items-center">
        <div className="my-3 mr-2">
          <button
            disabled={loading}
            onClick={addTracks}
            className="bg-green-500 hover:bg-green-700 py-1 px-4 text-xs rounded-md text-white"
          >
            {!loading && <span>Add</span>}
            {loading && <span>Adding...</span>}
          </button>
        </div>
        <div className="cursor-pointer" onClick={() => setOpen((o) => !o)}>
          {props.episode.title}
        </div>
      </h4>
      {open && (
        <div>
          <ul className="pl-5 pt-2 pb-10 bg-gray-800">
            {props.episode.playlist.map((track) => (
              <li>
                {track.artist} - {track.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const cookies = parse((context.req.headers.cookie as string) ?? '');
  const accessToken = cookies.accessToken ?? null;
  const refreshToken = cookies.refreshToken ?? null;

  const spotify = new Spotify();
  let me: SpotifyApi.CurrentUsersProfileResponse | null = null;
  if (accessToken && refreshToken) {
    try {
      spotify.auth(accessToken, refreshToken);
      me = await spotify.getMe();
    } catch (e) {
      context.res.setHeader('Set-Cookie', [
        serialize('accessToken', '', { maxAge: -1, path: '/' }),
        serialize('refreshToken', '', { maxAge: -1, path: '/' }),
      ]);
    }
  }
  const podcasts = [
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
  const podcastWithEpisodes: PodcastWithEpisodes[] = await Promise.all(
    podcasts.map(async (podcast) => {
      const episodes = await fetchEpisodes(podcast.rss);
      return { ...podcast, episodes };
    })
  );

  const authUrl = await spotify.getAuthorizeUrl();

  return { props: { me, authUrl, podcastWithEpisodes } };
};
