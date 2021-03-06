import SpotifyWebApi from 'spotify-web-api-node';
import { difference } from 'lodash';
import pAll from 'p-all';

type PlaylistObjectSimplified = SpotifyApi.PlaylistObjectSimplified;
type TrackObjectFull = SpotifyApi.TrackObjectFull;
type PlaylistTrackObject = SpotifyApi.PlaylistTrackObject;

export type TrackDescriptor = {
  artist: string;
  title: string;
};

export class Spotify {
  spotifyApi: SpotifyWebApi;
  scopes: string[];

  constructor() {
    const credentials = {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri:
        process.env.SPOTIFY_REDIRECT_URL ??
        'http://localhost:3000/spotify/auth',
    };
    this.scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
    ];
    this.spotifyApi = new SpotifyWebApi(credentials);
  }

  auth(accessToken: string, refreshToken: string) {
    this.spotifyApi.setAccessToken(accessToken);
    this.spotifyApi.setRefreshToken(refreshToken);
  }

  getAuthorizeUrl() {
    return this.spotifyApi.createAuthorizeURL(this.scopes, 'fake_state');
  }

  async getToken(code: string) {
    // Retrieve an access token and a refresh token
    const data = await this.spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    return { accessToken, refreshToken };
  }

  async getUserPlaylists(): Promise<PlaylistObjectSimplified[]> {
    const response = await this.spotifyApi.getUserPlaylists({ limit: 50 });
    return response.body.items;
  }

  async searchTrack(track: TrackDescriptor): Promise<TrackObjectFull[]> {
    console.log('Searching', track);
    const response = await this.spotifyApi.searchTracks(
      `track:${track.title} artist:${track.artist}`
    );
    return response.body.tracks?.items ?? [];
  }

  async searchTracks(tracks: TrackDescriptor[]): Promise<TrackObjectFull[]> {
    const actions = tracks.map((track) => {
      return async () => {
        const searchResult = await this.searchTrack(track);
        return searchResult.length > 0 ? searchResult[0] : null;
      };
    });
    const foundTracks = await pAll(actions, { concurrency: 10 });
    return foundTracks.filter((track) => track !== null) as TrackObjectFull[];
  }

  async addTracksToPlaylist(playlistName: string, tracks: TrackDescriptor[]) {
    const me = await this.getMe();
    const currentUserId = me.id;

    console.log('Finding user playlists');
    const foundTracks: TrackObjectFull[] = await this.searchTracks(tracks);
    const trackUris = foundTracks.map((track) => track.uri);

    console.log('Finding user playlists');
    const userPlaylists = await this.getUserPlaylists();
    let playlist = userPlaylists.find(
      (playList) => playList.name === playlistName
    );

    if (!playlist) {
      const createPlaylistResponse = await this.spotifyApi.createPlaylist(
        currentUserId,
        playlistName
      );
      const playlistId = createPlaylistResponse.body.id;

      console.log(`👷 Adding ${trackUris.length} to the playlist`);

      await this.spotifyApi.addTracksToPlaylist(playlistId, trackUris, {
        position: 0,
      });
    } else {
      console.log('Searching current playlist tracks to avoid duplicates');
      const currentPlaylistTracks = await this.getAllPlaylistTracks(
        playlist.id
      );
      const existingUris = currentPlaylistTracks.map((t) => t.track.uri);
      const newUris = difference(trackUris, existingUris);

      console.log(`👷 Adding ${newUris.length} to the playlist`);

      if (newUris.length > 0) {
        await this.spotifyApi.addTracksToPlaylist(playlist.id, newUris, {
          position: 0,
        });
      }
    }
  }

  private async getAllPlaylistTracks(
    id: string
  ): Promise<PlaylistTrackObject[]> {
    let result: PlaylistTrackObject[] = [];
    const limit = 50;
    let currentOffset = 0;
    let hasMore = true;
    do {
      console.log('add playlist tracks', currentOffset);
      const response = await this.spotifyApi.getPlaylistTracks(id, {
        limit,
        offset: currentOffset,
      });
      result = [...result, ...response.body.items];
      if (response.body.items.length === 0) hasMore = false;
      if (result.length === response.body.total) hasMore = false;

      currentOffset += limit;
    } while (hasMore);
    return result;
  }

  async getMe() {
    const meResponse = await this.spotifyApi.getMe();
    return meResponse.body;
  }
}
