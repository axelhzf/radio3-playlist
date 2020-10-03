import { Spotify, SpotifyTrack } from './spotify';
import { fetchEpisodes } from './ivoxFetcher';

type Podcast = {
  name: string;
  rss: string;
};

export async function createPlaylistFromPodcast(
  spotify: Spotify,
  podcast: Podcast,
  episodesLimit = 1
) {
  const episodes = await fetchEpisodes(podcast.rss);
  const episodesToProcess = episodes.slice(0, episodesLimit);

  for (const episode of episodesToProcess) {
    const episodePlaylist = episode.playlist;
    const spotifyFinalTracks: SpotifyTrack[] = [];
    const playlistName = `${podcast.name}`;
    console.log(`🎙  ${playlistName}`);

    for (const track of episodePlaylist) {
      const spotifyTracks = await spotify.searchTrack(
        track.artist,
        track.title
      );
      if (spotifyTracks && spotifyTracks.length > 0) {
        spotifyFinalTracks.push(spotifyTracks[0]);
        console.log(
          `  ✅ ${track.artist} - ${track.title} ${spotifyTracks[0].uri}`
        );
      } else {
        console.log(`  🔴 ${track.artist} - ${track.title}`);
      }
    }

    await spotify.addTracksToPlaylist(playlistName, spotifyFinalTracks);
  }
}
