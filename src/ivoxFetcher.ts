import Parser from 'rss-parser';
import * as he from 'he';
import * as capitalize from 'capitalize';
import sanitizeHtml from 'sanitize-html';

export async function fetchEpisodes(programFeedUrl: string): Promise<Episode[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(programFeedUrl);
  const episodes = feed.items.map(item => {
    const episode: Episode = {
      title: item.title,
      pubDate: item.pubDate,
      content: he.decode(item.content),
      audio: item.enclosure.url,
      playlist: extractPlaylistFromContent(item.content)
    };
    return episode;
  });
  return episodes;
}

export function extractPlaylistFromContent(content: string): Playlist {
  const decoded = he.decode(content);
  const sanitized = sanitizeHtml(decoded, { allowedTags: []});

  const trackRegex = /(.*?) - (.*)/g;
  let trackMatch = trackRegex.exec(sanitized);


  const playlist: Playlist = [];
  while (trackMatch != null) {
    playlist.push({
      artist: capitalize.words(trackMatch[1].trim()),
      title: trackMatch[2].trim()
    });
    trackMatch = trackRegex.exec(sanitized);
  }
  return playlist;
}

export type Episode = {
  title: string;
  pubDate: Date;
  content: string;
  audio: string;
  playlist: Playlist;
};

type Playlist = Track[];

type Track = {
  title: string;
  artist: string;
};
