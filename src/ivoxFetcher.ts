import Parser from 'rss-parser';

export async function fetchEpisodes(programFeedUrl: string) {
  const parser = new Parser();
  const feed = await parser.parseURL(programFeedUrl);
  const episodes = feed.items.map(item => {
    const episode: Episode = {
      title: item.title,
      pubDate: new Date(item.pubDate),
      content: item.content,
      audio: item.enclosure.url,
      playlist: extractPlaylistFromContent(item.content)
    };
    return episode;
  });
  return episodes;
}

export function extractPlaylistFromContent(content: string): Playlist {
  return [];
}

type Episode = {
  title: string;
  pubDate: Date;
  content: string;
  audio: string;
  playlist: Playlist;
};

type Playlist = Track[];

type Track = {
  title: string;
  author: string;
}