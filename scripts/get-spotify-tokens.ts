import { Spotify } from '../src/spotify.ts';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getTokens() {
  console.log('=== Spotify Token Generator ===\n');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env');
    process.exit(1);
  }

  const spotify = new Spotify(clientId, clientSecret, 'http://localhost:3000/spotify/auth');

  console.log('\n1. Open this URL in your browser:');
  console.log(spotify.getAuthorizeUrl());
  console.log('\n2. After authorizing, you\'ll be redirected to a URL like:');
  console.log('   http://localhost:3000/spotify/auth?code=XXXXX');
  console.log('\n3. Copy the "code" parameter from the URL\n');

  rl.question('Enter the authorization code: ', async (code) => {
    try {
      const { accessToken, refreshToken } = await spotify.getToken(code.trim());

      console.log('\n=== Success! Add these to your .env file: ===\n');
      console.log(`SPOTIFY_ACCESS_TOKEN=${accessToken}`);
      console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
      console.log('\n=== Or set them as wrangler secrets: ===\n');
      console.log(`wrangler secret put SPOTIFY_ACCESS_TOKEN`);
      console.log(`wrangler secret put SPOTIFY_REFRESH_TOKEN`);
      console.log('\nNote: The refresh token never expires, but the access token does.');
      console.log('The worker will automatically refresh it when needed.\n');
    } catch (error) {
      console.error('Error getting tokens:', error);
    }
    rl.close();
  });
}

getTokens();
