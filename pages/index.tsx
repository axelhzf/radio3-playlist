import { GetServerSideProps } from "next";
import { parse, serialize } from "cookie";
import { MeResponse, Spotify } from "../src/spotify";
import { Layout } from "../components/Layout";
import { Episode, fetchEpisodes } from "../src/ivoxFetcher";
import { useState } from "react";

type PodcastWithEpisode = {
  name: string;
  rss: string;
  episodes: Episode[];
}

type Props = {
  me: MeResponse["body"] | null;
  authUrl: string;
  podcastWithEpisodes: PodcastWithEpisode[]
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
      {props.me && <div>Logged in as {props.me.display_name}</div>}

      <div>
        {props.podcastWithEpisodes.map(podcast => (
          <div>
            <h3 className="text-xl mt-8 mb-4">{podcast.name}</h3>
            <div className="ml-4 mb-8">
              {podcast.episodes.map(episode => (
                <EpisodeTracks episode={episode}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

function EpisodeTracks(props: { episode: Episode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h4 className="cursor-pointer" onClick={() => setOpen(o => !o)}>{props.episode.title}</h4>
      {open && (<div>
        <ul className="pl-5 pt-2 pb-10 bg-gray-800">
          {props.episode.playlist.map(track => (
            <li>{track.artist} - {track.title}</li>
          ))}
        </ul>
      </div>)}
    </div>
  );
}


export const getServerSideProps: GetServerSideProps<Props> = async context => {
  const cookies = parse(context.req.headers.cookie as string ?? "");
  const accessToken = cookies.accessToken ?? null;
  const refreshToken = cookies.refreshToken ?? null;

  const spotify = new Spotify();
  let me: MeResponse["body"] | null = null;
  if (accessToken && refreshToken) {
    try {
      spotify.auth(accessToken, refreshToken);
      me = await spotify.getMe();
    } catch (e) {
      context.res.setHeader("Set-Cookie", [
        serialize("accessToken", "", { maxAge: -1, path: "/" }),
        serialize("refreshToken", "", { maxAge: -1, path: "/" })
      ]);
    }
  }
  const podcasts = [
    { name: "Turbo3", rss: "https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml" },
    { name: "Na na na", rss: "https://www.ivoox.com/na-na-na_fg_f1128042_filtro_1.xml" },
    { name: '180 grados', rss: 'http://api.rtve.es/api/programas/22270/audios.rss'}
  ];
  const podcastWithEpisodes: PodcastWithEpisode = await Promise.all(podcasts.map(async (podcast) => {
    const episodes = await fetchEpisodes(podcast.rss);
    return { ...podcast, episodes };
  }));

  const authUrl = await spotify.getAuthorizeUrl();

  return { props: { me, authUrl, podcastWithEpisodes } };
};
