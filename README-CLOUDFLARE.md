# Cloudflare Workers Migration Guide

This application has been migrated to run as a Cloudflare Worker with scheduled cron execution.

## Features

- **Scheduled Execution**: Runs daily at 9 AM UTC
- **RSS Feed Processing**: Fetches podcast episodes from Radio3 feeds
- **Spotify Integration**: Automatically creates/updates playlists with discovered tracks
- **Serverless**: No server maintenance required

## Project Structure

```
worker/
├── index.ts          # Main worker entry point with cron handler
├── ivoxFetcher.ts    # RSS feed parsing and track extraction
└── spotify.ts        # Spotify API integration
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Secrets

Set up your Spotify credentials and tokens using Wrangler:

```bash
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put SPOTIFY_CLIENT_SECRET
wrangler secret put SPOTIFY_ACCESS_TOKEN
wrangler secret put SPOTIFY_REFRESH_TOKEN
```

**Note**: You'll need to obtain Spotify tokens through the OAuth flow first. You can still use the Next.js app (`npm run dev`) to authenticate and get your tokens.

### 3. Configure Cron Schedule

Edit `wrangler.toml` to adjust the cron schedule:

```toml
[triggers]
crons = ["0 9 * * *"]  # Daily at 9 AM UTC
```

Common cron patterns:
- `"0 9 * * *"` - Daily at 9 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * 1"` - Every Monday at midnight

### 4. Development

Test your worker locally:

```bash
npm run worker:dev
```

This starts a local development server. You can trigger the cron manually:

```bash
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

### 5. Deploy

Deploy to Cloudflare Workers:

```bash
npm run worker:deploy
```

### 6. Monitor Logs

View real-time logs:

```bash
npm run worker:tail
```

## How It Works

1. **Scheduled Trigger**: Cloudflare triggers the worker daily at the configured time
2. **Fetch Podcasts**: The worker fetches RSS feeds for configured podcasts
3. **Extract Tracks**: Parses episode descriptions to extract track listings
4. **Update Playlists**: Creates or updates Spotify playlists with new tracks
5. **Deduplication**: Avoids adding duplicate tracks to existing playlists

## Podcasts Configured

- **Turbo3**: https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml
- **Na na na**: https://www.ivoox.com/na-na-na_fg_f1128042_filtro_1.xml
- **180 grados**: http://api.rtve.es/api/programas/22270/audios.rss

Edit `worker/index.ts` to add/remove podcasts.

## Costs

Cloudflare Workers Free Tier includes:
- 100,000 requests per day
- 10ms CPU time per request

This cron job runs once daily, well within free tier limits.

## Troubleshooting

### Token Expiration

If Spotify tokens expire, you'll need to refresh them:
1. Run the Next.js app locally: `npm run dev`
2. Authenticate with Spotify
3. Extract new tokens from cookies/logs
4. Update secrets: `wrangler secret put SPOTIFY_ACCESS_TOKEN`

### Missing Tracks

Check logs to see if tracks are being found:
```bash
npm run worker:tail
```

### Cron Not Triggering

Verify your cron schedule in the Cloudflare dashboard under Workers > Your Worker > Triggers.

## Next.js App (Optional)

The original Next.js app is still available for:
- Manual playlist management
- Spotify OAuth flow
- Web UI for viewing episodes

Run with: `npm run dev`
