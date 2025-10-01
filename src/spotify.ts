import { SpotifyApi } from '@spotify/web-api-ts-sdk';

export type TrackDescriptor = {
  artist: string;
  title: string;
};

export class Spotify {
  private sdk: SpotifyApi;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  scopes: string[];

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri?: string
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri ?? 'http://localhost:3000/spotify/auth';
    this.scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
    ];

    // Initialize SDK with client credentials (will be replaced with proper auth)
    this.sdk = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  auth(accessToken: string, refreshToken: string) {
    // Create SDK instance with user authorization
    this.sdk = SpotifyApi.withAccessToken(this.clientId, {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
    });
  }

  async refreshAccessToken(): Promise<string> {
    console.log('🔄 Refreshing Spotify access token...');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: (this.sdk as any).getAccessToken().refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string; refresh_token?: string };

    // Update SDK with new token
    this.sdk = SpotifyApi.withAccessToken(this.clientId, {
      access_token: data.access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: data.refresh_token || (this.sdk as any).getAccessToken().refresh_token,
    });

    console.log('✓ Access token refreshed successfully');
    return data.access_token;
  }

  getAuthorizeUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: 'fake_state',
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async getToken(code: string) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string; refresh_token: string };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  async getUserPlaylists() {
    const playlists = await this.sdk.currentUser.playlists.playlists(50);
    return playlists.items;
  }

  async searchTrack(track: TrackDescriptor) {
    console.log('Searching', track);
    const query = `track:${track.title} artist:${track.artist}`;
    const results = await this.sdk.search(query, ['track'], undefined, 1);
    return results.tracks.items;
  }

  async searchTracks(tracks: TrackDescriptor[]) {
    const foundTracks: any[] = [];

    // Process tracks with basic concurrency control
    const batchSize = 10;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (track) => {
          try {
            const searchResult = await this.searchTrack(track);
            return searchResult.length > 0 ? searchResult[0] : null;
          } catch (error) {
            console.error(`Error searching track ${track.artist} - ${track.title}:`, error);
            return null;
          }
        })
      );
      foundTracks.push(...batchResults.filter((t) => t !== null));
    }

    return foundTracks;
  }

  async addTracksToPlaylist(playlistName: string, tracks: TrackDescriptor[]) {
    const me = await this.getMe();
    const currentUserId = me.id;

    console.log('Searching tracks on Spotify...');
    const foundTracks = await this.searchTracks(tracks);
    const trackUris = foundTracks.map((track: any) => track.uri);

    console.log('Finding user playlists');
    const userPlaylists = await this.getUserPlaylists();
    let playlist = userPlaylists.find(
      (playList) => playList.name === playlistName
    );

    if (!playlist) {
      console.log(`Creating new playlist: ${playlistName}`);
      const newPlaylist = await this.sdk.playlists.createPlaylist(currentUserId, {
        name: playlistName,
        public: true,
        description: 'Auto-generated playlist from Radio3 podcast',
      });

      console.log(`👷 Adding ${trackUris.length} tracks to the playlist`);

      if (trackUris.length > 0) {
        await this.sdk.playlists.addItemsToPlaylist(newPlaylist.id, trackUris);
      }
    } else {
      console.log('Searching current playlist tracks to avoid duplicates');
      const currentPlaylistTracks = await this.getAllPlaylistTracks(playlist.id);
      const existingUris = currentPlaylistTracks.map((t: any) => t.track.uri);
      const newUris = trackUris.filter((uri: string) => !existingUris.includes(uri));

      console.log(`👷 Adding ${newUris.length} new tracks to the playlist`);

      if (newUris.length > 0) {
        await this.sdk.playlists.addItemsToPlaylist(playlist.id, newUris);
      }
    }
  }

  private async getAllPlaylistTracks(id: string) {
    let result: any[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    do {
      console.log('Fetching playlist tracks, offset:', offset);
      const response = await this.sdk.playlists.getPlaylistItems(id, undefined, undefined, limit, offset);

      result = [...result, ...response.items];
      if (response.items.length === 0) hasMore = false;
      if (result.length >= response.total) hasMore = false;

      offset += limit;
    } while (hasMore);

    return result;
  }

  async getMe() {
    return await this.sdk.currentUser.profile();
  }
}
