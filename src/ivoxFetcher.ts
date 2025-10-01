import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';

function capitalize(str: string): string {
  // Capitalize first letter of each word (Unicode-aware)
  return str.toLowerCase().replace(/\b[\p{L}\p{N}]/gu, (char) => char.toUpperCase());
}

function decodeHtml(html: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  // First decode numeric entities
  let decoded = html.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  // Then decode named entities
  decoded = decoded.replace(/&[a-z]+;/gi, (entity) => entities[entity.toLowerCase()] || entity);

  return decoded;
}

export async function fetchEpisodes(
  programFeedUrl: string
): Promise<Episode[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(programFeedUrl);
  const episodes = feed.items?.map((item) => {
    const episode: Episode = {
      title: item.title ?? '',
      pubDate: item.pubDate ?? '',
      content: decodeHtml(item.content ?? ''),
      audio: item.enclosure?.url ?? '',
      playlist: extractPlaylistFromContent(item.content ?? ''),
    };
    return episode;
  });
  return episodes ?? [];
}

export function extractPlaylistFromContent(content: string): Playlist {
  // Replace closing tags with newlines to preserve line breaks
  const withNewlines = content.replace(/<\/(p|div|br)>/gi, '\n');
  const sanitized = sanitizeHtml(withNewlines, { allowedTags: [] });
  // Decode HTML entities after sanitization
  const decoded = decodeHtml(sanitized);

  const playlist: Playlist = [];
  const trackRegex = /(.*?) - (.*)/gm;

  let trackMatch;
  while ((trackMatch = trackRegex.exec(decoded)) !== null) {
    playlist.push({
      artist: capitalize(trackMatch[1].trim()),
      title: trackMatch[2].trim(),
    });
  }
  return playlist;
}

export type Episode = {
  title: string;
  pubDate: string;
  content: string;
  audio: string;
  playlist: Playlist;
};

type Playlist = Track[];

type Track = {
  title: string;
  artist: string;
};
