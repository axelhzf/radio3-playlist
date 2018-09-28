import { extractPlaylistFromContent } from './ivoxFetcher';

describe('ivoxFetcher', () => {
  describe('extractPlaylistFromContent', () => {
    it('should return empty playlist if no playlist is detected', function() {
      const playlist = extractPlaylistFromContent("");
      expect(playlist).toEqual([]);
    });
  });
});
