# Radio3 Playlist - Cloudflare Workers

Automated Spotify playlist updater that fetches podcast episodes from Radio3 RSS feeds and creates playlists with the tracks mentioned in each episode.

## Features

- **Scheduled Execution**: Runs daily at 9 AM UTC via Cloudflare Workers cron
- **RSS Feed Processing**: Fetches podcast episodes from Radio3/iVoox feeds
- **Spotify Integration**: Automatically creates/updates playlists with discovered tracks
- **Serverless**: No server maintenance required
- **Auto-refresh tokens**: Automatically refreshes Spotify access tokens using refresh tokens

## Project Structure

```
src/
├── index.ts          # Main worker entry point with cron handler
├── ivoxFetcher.ts    # RSS feed parsing and track extraction
├── ivoxFetcher.test.ts # Test suite (11 tests)
└── spotify.ts        # Spotify API integration
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your **Client ID** and **Client Secret**
4. Add `http://localhost:3000/callback` to **Redirect URIs** in app settings

### 3. Configure Environment Variables

Create a `.env` file:

```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 4. Get Spotify Tokens (One-time OAuth)

Run the token generator script:

```bash
npm run get-tokens
```

This will:
1. Give you a URL to open in your browser
2. You'll authorize the app with Spotify
3. Copy the `code` parameter from the redirect URL
4. Paste it into the terminal
5. You'll receive your **access token** and **refresh token**

Add the tokens to your `.env` file:

```bash
SPOTIFY_ACCESS_TOKEN=your_access_token_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

**Important Notes:**
- The **refresh token never expires** - keep it safe!
- The **access token expires in 1 hour** but is automatically refreshed by the worker
- You only need to do this OAuth flow **once**

### 5. Configure Cron Schedule

Edit `wrangler.toml` to adjust the cron schedule:

```toml
[triggers]
crons = ["0 9 * * *"]  # Daily at 9 AM UTC
```

Common cron patterns:
- `"0 9 * * *"` - Daily at 9 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * 1"` - Every Monday at midnight

### 6. Development

Test your worker locally:

```bash
npm run worker:dev
```

**Test the HTTP endpoint:**
Visit `http://localhost:8787` to see the latest episodes as JSON.

**Trigger the cron manually:**
```bash
curl "http://localhost:8787/__scheduled?cron=0+9+*+*+*"
```

### 7. Deploy to Cloudflare

**Set up Wrangler secrets:**
```bash
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put SPOTIFY_CLIENT_SECRET
wrangler secret put SPOTIFY_ACCESS_TOKEN
wrangler secret put SPOTIFY_REFRESH_TOKEN
```

**Deploy:**
```bash
npm run worker:deploy
```

### 8. Monitor Logs

View real-time logs from your deployed worker:

```bash
npm run worker:tail
```

## How It Works

1. **Scheduled Trigger**: Cloudflare triggers the worker daily at the configured time
2. **Token Refresh**: Automatically refreshes the Spotify access token if needed
3. **Fetch Podcasts**: Fetches RSS feeds for configured podcasts
4. **Extract Tracks**: Parses episode descriptions to extract track listings (artist - title format)
5. **Update Playlists**: Creates or updates Spotify playlists with new tracks
6. **Deduplication**: Avoids adding duplicate tracks to existing playlists

## Podcasts Configured

- **Turbo3**: https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml
- **Na na na**: https://www.ivoox.com/na-na-na_fg_f1128042_filtro_1.xml
- **180 grados**: http://api.rtve.es/api/programas/22270/audios.rss

Edit `src/index.ts` to add/remove podcasts.

## API Endpoints

### `GET /`
Returns JSON with the latest episode from each podcast, including:
- Episode title and publish date
- Track count
- Full track listing

Example response:
```json
[
  {
    "podcast": "Turbo3",
    "rss": "https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml",
    "latestEpisode": {
      "title": "Episode Title",
      "pubDate": "Tue, 30 Sep 2025 16:00:00 GMT",
      "audio": "https://...",
      "tracksCount": 26,
      "tracks": [
        { "artist": "Tame Impala", "title": "Dracula" },
        ...
      ]
    }
  }
]
```

## Testing

Run the test suite:

```bash
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:ui     # UI mode
```

The test suite includes 11 tests covering:
- Real RSS feed parsing
- HTML entity decoding
- Artist name capitalization
- Unicode support
- Edge cases

## Costs

Cloudflare Workers Free Tier includes:
- 100,000 requests per day
- 10ms CPU time per request

This cron job runs once daily, well within free tier limits.

## Troubleshooting

### Cron Not Running

1. Check logs: `npm run worker:tail`
2. Verify environment variables are set in Cloudflare dashboard
3. Trigger manually: `curl "http://localhost:8787/__scheduled?cron=0+9+*+*+*"`

### Token Issues

The worker automatically refreshes expired access tokens using the refresh token. If you see authentication errors:

1. Verify your refresh token is still valid
2. Re-run `npm run get-tokens` to get new tokens
3. Update the secrets in Cloudflare

### Missing Tracks

Check the logs for detailed information about:
- RSS feed fetching
- Track extraction
- Spotify API calls

```bash
npm run worker:tail
```

### Debugging Locally

The worker includes comprehensive logging. When you trigger the cron, you'll see:
- 🚀 Start/completion markers
- 📋 Environment variable checks
- 📻 Each podcast being processed
- 📝 Episode details and track counts
- ✅/❌ Success/error indicators

## Development Scripts

```bash
npm run worker:dev      # Start local development server
npm run worker:deploy   # Deploy to Cloudflare
npm run worker:tail     # View production logs
npm run get-tokens      # Get Spotify OAuth tokens
npm run test            # Run tests in watch mode
npm run test:run        # Run tests once
npm run typecheck       # Check TypeScript types
```

## License

MIT
