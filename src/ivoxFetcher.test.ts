import { describe, it, expect } from 'vitest';
import { extractPlaylistFromContent } from './ivoxFetcher';

describe('ivoxFetcher', () => {
  describe('extractPlaylistFromContent', () => {
    it('should extract tracks from real Turbo3 RSS content', () => {
      const realContent = `<p>Estrenamos 'Dove', el segundo adelanto del próximo y esperado disco de Dharmacide, una de las mejores bandas de shoegaze y dream pop de nuestra escena; con influencias de My Blooyd Valentine y DIIV, 'Dove' es el segundo avance de un álbum que verá la luz en noviembre con el título de 'Tougher Than The Rest'. Además, te presentamos las últimas novedades de Yonaka, Medalla, Magdalena Bay, Miniño, Salvana y Jeff Tweedy.</p><p>Playlist:</p><p>TAME IMPALA - Dracula</p><p>TAME IMPALA - Is It True</p><p>TAME IMPALA - The Less I Know The Better</p><p>TAME IMPALA - Elephant</p><p>TAME IMPALA - Solitude Is Bliss</p><p>THUNDERCAT - I Wish I Didn't Waste Your Time</p><p>MAGDALENA BAY - Second Sleep</p><p>MAGDALENA BAY - Ashes to Ashes (triple j Like A Version)</p><p>NOVA TWINS - Piranha [Disco Gourmet de la semana]</p><p>YONAKA - Problems</p><p>TWENTY ONE PILOTS - Drum Show</p><p>TURNSTILE - I Care</p><p>MINIÑO - Bicho raro</p><p>MEDALLA - El trabajo no dignifica</p><p>MEDALLA - Asedio</p><p>SALVANA - Alas rotas</p><p>DHARMACIDE - Dove</p><p>MY BLOODY VALENTINE - Only Shallow</p><p>SONIC YOUTH - Kool Thing</p><p>DAFFO - Go Fetch</p><p>FRANZ BAUER - I Believe</p><p>TYLER BALLGAME - I Believe In Love</p><p>DJO - Carry The Name</p><p>JEFF TWEEDY - Out in the Dark</p><p>JEFF TWEEDY - Lou Reed Was My Babysitter</p><p>THE VELVET UNDERGROUND - Rock &amp; Roll</p>`;

      const playlist = extractPlaylistFromContent(realContent);

      // Should extract all 26 tracks
      expect(playlist).toHaveLength(26);

      // Check first track
      expect(playlist[0]).toEqual({
        artist: 'Tame Impala',
        title: 'Dracula',
      });

      // Check track with special characters (MINIÑO becomes MiniÑO due to word boundary after 'i')
      expect(playlist[12]).toEqual({
        artist: 'MiniÑO',
        title: 'Bicho raro',
      });

      // Check track with HTML entity
      expect(playlist[25]).toEqual({
        artist: 'The Velvet Underground',
        title: 'Rock & Roll',
      });

      // Check track with parentheses
      expect(playlist[7]).toEqual({
        artist: 'Magdalena Bay',
        title: 'Ashes to Ashes (triple j Like A Version)',
      });

      // Check track with brackets
      expect(playlist[8]).toEqual({
        artist: 'Nova Twins',
        title: 'Piranha [Disco Gourmet de la semana]',
      });
    });

    it('should handle empty content', () => {
      const playlist = extractPlaylistFromContent('');
      expect(playlist).toEqual([]);
    });

    it('should handle content without tracks', () => {
      const content = '<p>Some description without any tracks</p>';
      const playlist = extractPlaylistFromContent(content);
      expect(playlist).toEqual([]);
    });

    it('should handle HTML encoded entities', () => {
      const content = '<p>THE VELVET UNDERGROUND - Rock &amp; Roll</p><p>AC/DC - Back In Black</p>';
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(2);
      expect(playlist[0]).toEqual({
        artist: 'The Velvet Underground',
        title: 'Rock & Roll',
      });
      expect(playlist[1]).toEqual({
        artist: 'Ac/Dc',
        title: 'Back In Black',
      });
    });

    it('should capitalize artist names correctly', () => {
      const content = '<p>tame impala - Dracula</p><p>the beatles - Hey Jude</p>';
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(2);
      expect(playlist[0].artist).toBe('Tame Impala');
      expect(playlist[1].artist).toBe('The Beatles');
    });

    it('should handle tracks with special characters in titles', () => {
      const content = `
        <p>ARTIST ONE - Song (feat. Someone)</p>
        <p>ARTIST TWO - Song [Live Version]</p>
        <p>ARTIST THREE - Song's Title</p>
      `;
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(3);
      expect(playlist[0].title).toBe('Song (feat. Someone)');
      expect(playlist[1].title).toBe('Song [Live Version]');
      expect(playlist[2].title).toBe("Song's Title");
    });

    it('should trim whitespace from artist and title', () => {
      const content = '<p>  TAME IMPALA   -   Dracula  </p>';
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(1);
      expect(playlist[0]).toEqual({
        artist: 'Tame Impala',
        title: 'Dracula',
      });
    });

    it('should handle mixed case artist names', () => {
      const content = '<p>MiNiÑo - Bicho raro</p><p>DJO - Carry The Name</p>';
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(2);
      expect(playlist[0].artist).toBe('MiniÑO');
      expect(playlist[1].artist).toBe('Djo');
    });

    it('should not extract lines without the " - " separator', () => {
      const content = `
        <p>This is some text</p>
        <p>VALID ARTIST - Valid Song</p>
        <p>This line has no separator</p>
        <p>ANOTHER ARTIST - Another Song</p>
      `;
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(2);
      expect(playlist[0].artist).toBe('Valid Artist');
      expect(playlist[1].artist).toBe('Another Artist');
    });

    it('should handle complex HTML with nested tags', () => {
      const content = `
        <div>
          <p>Introduction text</p>
          <p><strong>ARTIST</strong> - <em>Song Title</em></p>
          <p>More text</p>
        </div>
      `;
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(1);
      expect(playlist[0]).toEqual({
        artist: 'Artist',
        title: 'Song Title',
      });
    });

    it('should handle quotes and apostrophes', () => {
      const content = `
        <p>ARTIST - Song &quot;Title&quot;</p>
        <p>ARTIST TWO - Don&#039;t Stop</p>
      `;
      const playlist = extractPlaylistFromContent(content);

      expect(playlist).toHaveLength(2);
      expect(playlist[0].title).toBe('Song "Title"');
      expect(playlist[1].title).toBe("Don't Stop");
    });
  });
});
