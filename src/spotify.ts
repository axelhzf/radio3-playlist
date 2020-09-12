import SpotifyWebApi from 'spotify-web-api-node';
import { Simulate } from 'react-dom/test-utils';
import { difference } from 'lodash';

export class Spotify {
  spotifyApi: any;
  scopes: string[];

  constructor() {
    const credentials = {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: 'http://localhost:3000/spotify/auth'
    };
    this.scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public'
    ];
    this.spotifyApi = new SpotifyWebApi(credentials);
  }

  auth(accessToken: string, refreshToken: string) {
    this.spotifyApi.setAccessToken(accessToken);
    this.spotifyApi.setRefreshToken(refreshToken);
  }

  getAuthorizeUrl() {
    return this.spotifyApi.createAuthorizeURL(this.scopes);
  }

  async getToken(code: string) {
    // Retrieve an access token and a refresh token
    const data = await this.spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    return { accessToken, refreshToken };
  }

  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    const response = await this.spotifyApi.getUserPlaylists({ limit: 50 });
    return response.body.items;
  }

  async searchTracks(artist: string, title: string): Promise<SpotifyTrack[]> {
    const response = await this.spotifyApi.searchTracks(
      `track:${title} artist:${artist}`
    );
    return response.body.tracks.items;
  }

  async addTracksToPlaylist(name: string, tracks: SpotifyTrack[]) {
    const meResponse = await this.spotifyApi.getMe();
    const currentUserId = meResponse.body.id;

    const trackUris = tracks.map(track => track.uri);

    const userPlaylists = await this.getUserPlaylists();
    let playlist = userPlaylists.find(playList => playList.name === name);
    if (!playlist) {
      const createPlaylistResponse = await this.spotifyApi.createPlaylist(
        currentUserId,
        name
      );
      const playlistId = createPlaylistResponse.body.id;

      console.log(`👷 Adding ${trackUris.length} to the playlist`);

      await this.spotifyApi.addTracksToPlaylist(playlistId, trackUris, {
        position: 0
      });
    } else {
      const response = await this.spotifyApi.getPlaylist(playlist.id);

      const existingUris = response.body.tracks.items.map(
        track => track.track.uri
      );
      const newUris = difference(trackUris, existingUris);

      console.log(`👷 Adding ${newUris.length} to the playlist`);

      if (newUris.length > 0) {
        await this.spotifyApi.addTracksToPlaylist(playlist.id, newUris, {
          position: 0
        });
      }
    }
  }

  async getMe() {
    const meResponse: MeResponse = await this.spotifyApi.getMe();
    return meResponse.body;
  }
}

export type SpotifyPlaylist = {
  name: string;
  id: string;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
};

export type MeResponse = {
  body: {
    country: string;
    display_name: string;
    email: string;
    explicit_content: { filter_enabled: boolean; filter_locked: boolean };
    external_urls: { spotify: string };
    followers: { href: null; total: 52 };
    href: string;
    id: string;
    images: [
      {
        height: null;
        url: string;
        width: null;
      }
    ];
    product: string;
    type: string;
    uri: string;
  };
};
