import SpotifyWebApi from 'spotify-web-api-node';
import { difference, chunk } from 'lodash';
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

  setAccessToken(accessToken: string) {
    return this.spotifyApi.setAccessToken(accessToken);
  }

  setRefreshToken(refreshToken: string) {
    return this.spotifyApi.setRefreshToken(refreshToken);
  }

  isAuthenticated() {
    return this.spotifyApi.getAccessToken() !== undefined;
  }

  async refreshAccessToken() {
    const { body } = await this.spotifyApi.refreshAccessToken();
    const accessToken = body.access_token;
    const expiresIn = body.expires_in;
    return { accessToken, expiresIn };
  }

  getAuthorizeUrl() {
    return this.spotifyApi.createAuthorizeURL(this.scopes, 'fake_state');
  }

  async getToken(code: string) {
    // Retrieve an access token and a refresh token
    const data = await this.spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];
    const expiresIn = data.body['expires_in'];

    return { accessToken, refreshToken, expiresIn };
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
        playlistName,
        { public: true }
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
      const existingUris = currentPlaylistTracks.flatMap((t) =>
        t.track ? [t.track.uri] : []
      );

      const preservedUris = difference(existingUris, trackUris).slice(
        0,
        50 - trackUris.length
      );
      const toRemoveUris = difference(existingUris, preservedUris);

      if (toRemoveUris.length > 0) {
        console.log(`👷 Removing ${toRemoveUris.length} from the playlist`);

        for (const c of chunk(toRemoveUris, 20)) {
          await this.spotifyApi.removeTracksFromPlaylist(
            playlist.id,
            c.map((uri) => ({ uri }))
          );
        }
      }

      if (trackUris.length > 0) {
        console.log(`👷 Adding ${trackUris.length} to the playlist`);
        await this.spotifyApi.addTracksToPlaylist(playlist.id, trackUris, {
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
