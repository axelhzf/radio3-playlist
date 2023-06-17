import { describe, it, expect } from 'vitest';
import { extractPlaylistFromContent } from './ivoxFetcher';

describe('ivoxFetcher', () => {
  describe('extractPlaylistFromContent', () => {
    it('should return empty playlist if no playlist is detected', function () {
      const playlist = extractPlaylistFromContent('');
      expect(playlist).toEqual([]);
    });

    it.skip('should extract a playlist from turbo3 format content with new lines', function () {
      const playlist = extractPlaylistFromContent(
        "Hemos preparado un cóctel energético perfecto para empezar el fin de semana. Hoy, entre otros cañonazos, te traemos lo nuevo de Second, 'Mira a la gente', primer adelanto del próximo disco que el grupo murciano lanzará en noviembre. Además, escuchamos a Lori Meyers, La Casa Azul, Muse, Mando Diao y Des Rocs.\\r\\n\\n\\nPlaylist:\\r\\n\\n\\nDES ROCS - Let me live / Let me die\\r\\n\\n\\nBARNS COURTNEY - Hellfire\\r\\n\\n\\nGRANDSON - Best friends\\r\\n\\n\\nWOLF ALICE - Giant peach\\r\\n\\n\\nMUSE - Pressure\\r\\n\\n\\nCAESARS - Jerk it out\\r\\n\\n\\nMANDO DIAO - Dance with somebody\\r\\n\\n\\nMANDO DIAO - Black Saturday\\r\\n\\n\\nMANDO DIAO - All the things\\r\\n\\n\\nKAISER CHIEFS - I predict a riot\\r\\n\\n\\nSECOND - Mira a la gente\\r\\n\\n\\nSECOND - Las serpientes\\r\\n\\n\\nLORI MEYERS - Mi realidad\\r\\n\\n\\nLA CASA AZUL - Nunca nadie pudo volar\\r\\n\\n\\nLA CASA AZUL - Los chicos hoy saltarán a la pista\\r\\n\\n\\nBLONDIE - Call me\\r\\n\\n\\r\\nEscuchar audio"
      );

      expect(playlist).toEqual([
        { artist: 'Des Rocs', title: 'Let me live / Let me die' },
        { artist: 'Barns Courtney', title: 'Hellfire' },
        { artist: 'Grandson', title: 'Best friends' },
        { artist: 'Wolf Alice', title: 'Giant peach' },
        { artist: 'Muse', title: 'Pressure' },
        { artist: 'Caesars', title: 'Jerk it out' },
        { artist: 'Mando Diao', title: 'Dance with somebody' },
        { artist: 'Mando Diao', title: 'Black Saturday' },
        { artist: 'Mando Diao', title: 'All the things' },
        { artist: 'Kaiser Chiefs', title: 'I predict a riot' },
        { artist: 'Second', title: 'Mira a la gente' },
        { artist: 'Second', title: 'Las serpientes' },
        { artist: 'Lori Meyers', title: 'Mi realidad' },
        { artist: 'La Casa Azul', title: 'Nunca nadie pudo volar' },
        { artist: 'La Casa Azul', title: 'Los chicos hoy saltarán a la pista' },
        { artist: 'Blondie', title: 'Call me' },
      ]);
    });

    it.skip('should extract a playlist from turbo3 format content without new lines', function () {
      const playlist = extractPlaylistFromContent(
        '&iexcl;Comenzamos nueva temporada de Radio 3! Y con el nuevo curso llegan nuevos discos, as&iacute; que hoy en Turbo 3 te ofrecemos un especial con algunos de los &aacute;lbumes m&aacute;s jugosos que ver&aacute;n la luz los pr&oacute;ximo meses: discos firmados por Muse, Nothing But Thieves, Bring Me The Horizon, Cat Power, Ron Gallo, Twenty Pilots o Villagers, entre otros. Playlist: MUSE - The dark side, NOTHING BUT THIEVES - Forever &amp; ever more, BRING ME THE HORIZON - Mantra, IMAGINE DRAGONS - Natural, BARNS COURTNEY - Good thing, WHITE DENIM - Moves on, RON GALLO - Do you love your company?, JUNGLE - Heavy, California, TWENTY ONE PILOTS - My blood, CHRISTINE AND THE QUEENS - 5 dollars, CAT POWER - Woman (feat. Lana del Rey), VILLAGERS - Fool, KURT VILE - Loading zones, PAUL MCCARTNEY - Come on to me,  ALT-J - In cold blood (feat. Kontra K), RAZORLIGHT - Olympus sleeping.\\r\\n\\n\\r\\nEscuchar audio'
      );

      expect(playlist).toEqual([
        { artist: 'Muse', title: 'The dark side' },
        { artist: 'Nothing But Thieves', title: 'Forever & ever more' },
        { artist: 'Bring Me The Horizon', title: 'Mantra' },
        { artist: 'Imagine Dragons', title: 'Natural' },
        { artist: 'Barns Courtney', title: 'Good thing' },
        { artist: 'White Denim', title: 'Moves on' },
        { artist: 'Ron Gallo', title: 'Do you love your company?' },
        { artist: 'Jungle', title: 'Heavy, California' },
        { artist: 'Twenty One Pilots', title: 'My blood' },
        { artist: 'Christine And The Queens', title: '5 dollars' },
        { artist: 'Cat Power', title: 'Woman (feat. Lana del Rey)' },
        { artist: 'Villagers', title: 'Fool' },
        { artist: 'Kurt Vile', title: 'Loading zones' },
        { artist: 'Paul Mccartney', title: 'Come on to me' },
        { artist: 'Alt-J', title: 'In cold blood (feat. Kontra K)' },
        { artist: 'Razorlight', title: 'Olympus sleeping' },
      ]);
    });
  });

  it('should extract a playlist from turbo3 in html format', () => {
    const playlist =
      extractPlaylistFromContent(`&lt;p style="color:rgb(33, 33, 33);line-height:normal;"&gt;Hoy nos hemos levantado con la horrible noticia de haber perdido a un compa&amp;ntilde;ero: ha fallecido Jota May&amp;uacute;scula, uno de los pioneros del hip hop en Espa&amp;ntilde;a y responsable de &amp;#39;El Rimadero&amp;#39; de Radio 3. Los primeros minutos de esta sesi&amp;oacute;n van para &amp;eacute;l. Adem&amp;aacute;s, escuchamos lo nuevo de Shame, You Me At Six y IDLES.&lt;/p&gt;

&lt;p style="color:rgb(33, 33, 33);line-height:normal;"&gt;Playlist:&lt;/p&gt;

&lt;p style="color:rgb(33, 33, 33);line-height:normal;"&gt;C.P.V. - El Hombre Metr&amp;oacute;nomo&lt;br /&gt;
MALA RODR&amp;Iacute;GUEZ - La ni&amp;ntilde;a&lt;br /&gt;
BEASTIE BOYS - Intergalactic&lt;br /&gt;
FIDLAR - Get Off My Rock&lt;br /&gt;
ALT-J - Breezeblocks&lt;br /&gt;
MIIKE SNOW - Genghis Khan&lt;br /&gt;
YOU ME AT SIX - MAKEMEFEELALIVE&lt;br /&gt;
BRING ME THE HORIZON - Obey (with YUNGBLUD)&lt;br /&gt;
LE&amp;Oacute;N BENAVENTE - Disparando a los caballos&lt;br /&gt;
SHAME - Alphabet&lt;br /&gt;
SHAME - Concrete&lt;br /&gt;
IDLES - Model Village&lt;br /&gt;
THE CURE - A Forest&lt;/p&gt;
&lt;div&gt;&lt;br/&gt;&lt;a href="https://www.rtve.es/alacarta/audios/turbo-3/turbo-3-viernes-electrico-378-11-09-20/5661336/"&gt;Escuchar audio&lt;/a&gt;&lt;/div&gt;&lt;img src="http://secure-uk.imrworldwide.com/cgi-bin/m?ci=es-rssrtve&amp;cg=F-N-B-TERNE-TERPROGR-TERMUSICA-TEMROCPOP-TESTURBO3&amp;si=https://www.rtve.es/alacarta/audios/turbo-3/turbo-3-viernes-electrico-378-11-09-20/5661336/" alt=""/&gt;`);

    expect(playlist).toEqual([
      { artist: 'C.P.V.', title: 'El Hombre Metrónomo' },
      { artist: 'Mala Rodríguez', title: 'La niña' },
      { artist: 'Beastie Boys', title: 'Intergalactic' },
      { artist: 'Fidlar', title: 'Get Off My Rock' },
      { artist: 'Alt-J', title: 'Breezeblocks' },
      { artist: 'Miike Snow', title: 'Genghis Khan' },
      { artist: 'You Me At Six', title: 'MAKEMEFEELALIVE' },
      { artist: 'Bring Me The Horizon', title: 'Obey (with YUNGBLUD)' },
      { artist: 'León Benavente', title: 'Disparando a los caballos' },
      { artist: 'Shame', title: 'Alphabet' },
      { artist: 'Shame', title: 'Concrete' },
      { artist: 'Idles', title: 'Model Village' },
      { artist: 'The Cure', title: 'A Forest' },
    ]);
  });
});
