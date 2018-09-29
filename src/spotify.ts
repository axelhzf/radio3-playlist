import SpotifyWebApi from 'spotify-web-api-node';

const credentials = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri:  'http://localhost:8080'
};
const scopes = ['user-read-private', 'user-read-email', 'playlist-modify-public'];


const spotifyApi = new SpotifyWebApi(credentials);

if (process.env.SPOTIFY_CLIENT_AUTH_TOKEN) {
  spotifyApi.setAccessToken(process.env.SPOTIFY_CLIENT_AUTH_TOKEN);
}
if (process.env.SPOTIFY_CLIENT_AUTH_REFRESH_TOKEN) {
  spotifyApi.setAccessToken(process.env.SPOTIFY_CLIENT_AUTH_REFRESH_TOKEN);
}

export async function auth() {
  if (process.env.SPOTIFY_CLIENT_AUTH_TOKEN) {
    spotifyApi.setAccessToken(process.env.SPOTIFY_CLIENT_AUTH_TOKEN);
    if (process.env.SPOTIFY_CLIENT_AUTH_REFRESH_TOKEN) {
      spotifyApi.setRefreshToken(process.env.SPOTIFY_CLIENT_AUTH_REFRESH_TOKEN);
    }
    return;
  }

  if (process.env.SPOTIFY_CLIENT_AUTH_CODE) {
    await getToken(process.env.SPOTIFY_CLIENT_AUTH_CODE);
    process.exit(1);
  }
  await getAuthorizeUrl();
  process.exit(1);
}


export async function getAuthorizeUrl() {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  console.log(`Open ${authorizeURL} and copy the code to the .env file (SPOTIFY_CLIENT_AUTH_CODE)`);
}

export async function getToken(code: string) {
  // Retrieve an access token and a refresh token
  const data = await spotifyApi.authorizationCodeGrant(code);

  console.log(`Add the following lines to the env file`);
  console.log(`SPOTIFY_CLIENT_AUTH_TOKEN=${data.body['access_token']}`);
  console.log(`SPOTIFY_CLIENT_AUTH_REFRESH_TOKEN=${data.body['refresh_token']}`);
}

export async function searchTracks(artist: string, title: string): Promise<SpotifyTrack[]> {
  const response = await spotifyApi.searchTracks(`track:${title} artist:${artist}`);
  return response.body.tracks.items;
}

export async function getUserPlaylists(): Promise<SpotifyPlaylist[]> {
  const response = await spotifyApi.getUserPlaylists({ limit: 50 });
  return response.body.items;
}

export async function createPlaylist(name: string, tracks: SpotifyTrack[]) {
  const meResponse = await spotifyApi.getMe();
  const currentUserId = meResponse.body.id;
  const createPlaylistResponse = await spotifyApi.createPlaylist(currentUserId, name);
  const newPlaylistId = createPlaylistResponse.body.id;
  const trackUris = tracks.map(track => track.uri);
  await spotifyApi.addTracksToPlaylist(newPlaylistId, trackUris);
}

export type SpotifyPlaylist = {
  name: string;
  id: string;
}

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
}