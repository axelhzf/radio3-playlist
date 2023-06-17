import { Episode } from './ivoxFetcher';

export type PodcastWithEpisodes = {
  name: string;
  rss: string;
  episodes: Episode[];
};
