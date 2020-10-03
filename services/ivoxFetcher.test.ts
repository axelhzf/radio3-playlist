import { extractPlaylistFromContent } from './ivoxFetcher';

describe('ivoxFetcher', () => {
  describe('extractPlaylistFromContent', () => {
    it('should return empty playlist if no playlist is detected', function () {
      const playlist = extractPlaylistFromContent('');
      expect(playlist).toEqual([]);
    });

    it('should extract a playlist from turbo3 format content with new lines', function () {
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

    it('should extract a playlist from turbo3 format content without new lines', function () {
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
    const playlist = extractPlaylistFromContent(`&lt;p style="color:rgb(33, 33, 33);line-height:normal;"&gt;Hoy nos hemos levantado con la horrible noticia de haber perdido a un compa&amp;ntilde;ero: ha fallecido Jota May&amp;uacute;scula, uno de los pioneros del hip hop en Espa&amp;ntilde;a y responsable de &amp;#39;El Rimadero&amp;#39; de Radio 3. Los primeros minutos de esta sesi&amp;oacute;n van para &amp;eacute;l. Adem&amp;aacute;s, escuchamos lo nuevo de Shame, You Me At Six y IDLES.&lt;/p&gt;

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

  it.only('should extract 180 grados', () => {
    const playlist = extractPlaylistFromContent(
      `<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">Hoy la familia de Radio 3 y el rap español están de luto. Nos acostamos con la terrible noticia de la muerte de Jota Mayúscula y no sabemos cómo despedir a nuestro compañero… No hay palabras para transmitir semejante tragedia, solo agradecimiento por todo lo bueno que ha traído a las ondas de esta emisora, su casa, y por todo lo que ha hecho por la cultura del hip hip en nuestro país. Hasta siempre, querido Jota Mayúscula y, como dice nuestro Frank T, sube los graves allí donde vayas. Comenzamos y terminamos con él y con CPV un programa que le dedicamos y en el que queremos apoyar a un movimiento apolítico de unificación sectorial de la industria del espectáculo y los eventos. Se llama Alerta Roja porque su situación es de verdadera agonía. El día 17 de septiembre han preparado una movilización en 28 ciudades de nuestro país con el objetivo de que se tomen medidas urgentes para garantizar la supervivencia del sector. E insisten, se trata de mostrar de una manera segura, elegante e impactante que el sector del Espectáculo y los Eventos está en #ALERTA ROJA</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\"></p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\"></p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">CPV – La Gloria o La Ruina</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">BASEMENT JAXX – Red Alert</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">JOHN NEWMAN – Come On And Get It</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">THE STYLE COUNCIL – Walls Come Tumbling Down</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">LOS ENEMIGOS – Siete Mil Canciones</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">AGORAPHOBIA – Caffeine Pill</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">MUSE – New Born</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">DORIAN feat. JAVIERA MENA – Vicios y Defectos (Ley Dj & Alexander Som Remix)</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">VARRY BRAVA – Ritos Exóticos (vídeo)</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">SUPERSUBMARINA – Algo Que Sirva Como Luz</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">TULSA – Oda Al Amor Efímero</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">ARDADE FIRE – Ready To Start</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">GREMIO DC – El Mundo Al Revés</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">LEÓN BENAVENTE – No Hay Miedo</p>\\r\\n\\r\\n<p style=\\"color:rgb(33, 33, 33);line-height:normal;\\">CPV - Aleluya</p>\\r\\n<div><br/><a href=\\"https://www.rtve.es/alacarta/audios/180/180-grados-jota-mayuscula-alerta-roja-11-09-20/5660977/\\">Escuchar audio</a></div><img src=\\"http://secure-uk.imrworldwide.com/cgi-bin/m?ci=es-rssrtve&cg=F-N-B-TERNE-TERPROGR-TERMUSICA-TEMROCPOP-TES180GRA&si=https://www.rtve.es/alacarta/audios/180/180-grados-jota-mayuscula-alerta-roja-11-09-20/5660977/\\" alt=\\"\\"/>`
    );

    expect(playlist).toEqual([]);
  });
});
