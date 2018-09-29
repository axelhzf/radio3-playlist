import dotenv from 'dotenv';
dotenv.config();
import { fetchEpisodes } from './ivoxFetcher';
import * as spotify from './spotify';
import { SpotifyPlaylist, SpotifyTrack } from './spotify';
import * as dateFns from 'date-fns';

type Podcast = {
  name: string;
  rss: string;
}

const podcasts = [
  { name: 'Turbo3', rss: 'https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml'},
  { name: 'Na na na', rss: 'https://www.ivoox.com/na-na-na_fg_f1128042_filtro_1.xml'}
];

async function main() {
  await spotify.auth();
  const userPlaylists = await spotify.getUserPlaylists();

  for (const podcast of podcasts) {
   await processPodcast(podcast, userPlaylists, 3);
  }
}

async function processPodcast(podcast: Podcast, userPlaylists: SpotifyPlaylist[], episodesLimit = 1) {
  const episodes = await fetchEpisodes(podcast.rss);
  const episodesToProcess = episodes.slice(0, episodesLimit);
  for (const episode of episodesToProcess) {
    const episodePlaylist = episode.playlist;
    const spotifyFinalTracks: SpotifyTrack[] = [];
    const playlistName = `${podcast.name} - ${dateFns.format(episode.pubDate, 'DD/MM/YYYY')}`;
    console.log(`🎙  ${playlistName}`);

    const playlistAlreadyExists = !!userPlaylists.find(playList => playList.name === playlistName);
    if (playlistAlreadyExists) {
      console.log(`  🦉 Playlist already exists`);
      continue;
    }

    for (const track of episodePlaylist) {
      const spotifyTracks = await spotify.searchTracks(track.artist, track.title);
      if (spotifyTracks && spotifyTracks.length > 0) {
        spotifyFinalTracks.push(spotifyTracks[0]);
        console.log(`  ✅ ${track.artist} - ${track.title} ${spotifyTracks[0].uri}`);
      } else {
        console.log(`  🔴 ${track.artist} - ${track.title}`);
      }
    }

    console.log(`  Adding ${spotifyFinalTracks.length} to the new playlist ${playlistName}`);
    await spotify.createPlaylist(playlistName, spotifyFinalTracks);
  }
}




main().catch(e => {
  console.log(JSON.stringify(e));
  console.error(e)
});
