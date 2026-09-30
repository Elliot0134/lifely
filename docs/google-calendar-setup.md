# Google Calendar Integration — Setup

This doc walks you through enabling the Google Calendar sync for the `/planning` calendar.

## 1. Create a Google Cloud OAuth client

1. Go to https://console.cloud.google.com/
2. Create a project (or pick an existing one)
3. Enable the **Google Calendar API** (APIs & Services → Library → "Google Calendar API" → Enable)
4. OAuth consent screen :
   - User type : **External**
   - App name : LifeLy Planning
   - Scopes : `.../auth/calendar.readonly`, `.../auth/calendar.events.readonly`, `email`, `profile`, `openid`
   - Test users : add your own Gmail
5. Credentials → **Create credentials** → **OAuth client ID** → **Web application**
   - Authorized redirect URIs :
     - `http://localhost:3000/api/integrations/google-calendar` (dev)
     - `https://YOUR_DOMAIN/api/integrations/google-calendar` (prod)
6. Copy the **Client ID** and **Client Secret**.

## 2. Set Next.js env vars

Add to `.env.local` (dev) and Vercel env (prod) :

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your prod URL
```

## 3. Set Supabase Edge Function secrets

```bash
npx supabase secrets set GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com --project-ref owmfyebcsrhdiyskdffe
npx supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret --project-ref owmfyebcsrhdiyskdffe
```

## 4. Deploy the edge function

```bash
npx supabase functions deploy sync-google-calendar --project-ref owmfyebcsrhdiyskdffe
```

## 5. Use it

1. Go to `/settings` in LifeLy → section "Google Calendar"
2. Click **Connecter Google Calendar**
3. Authorize via Google consent screen
4. You'll be redirected back with `?integration=google&status=connected`
5. Click **Synchroniser** to pull your events (they appear on `/planning` read-only with a 📅 prefix)

## Troubleshooting

- **"redirect_uri_mismatch"** : Check exact match in Google Cloud Console vs your `NEXT_PUBLIC_APP_URL`
- **Token refresh fails** : Make sure `GOOGLE_CLIENT_SECRET` is set on both Next env and Supabase secrets
- **No events synced** : Verify the OAuth scopes include `calendar.readonly`
- **Sync too old** : Click "Synchroniser" manually, or set up a pg_cron to call the edge function periodically

## Architecture

- **Table `external_calendar_connections`** stores OAuth tokens (RLS : user_id only)
- **Table `external_events`** stores synced events (RLS : user_id only)
- **Edge function `sync-google-calendar`** pulls events from Google API and upserts them
- **Next.js route `/api/integrations/google-calendar`** handles OAuth init + callback
- **`/planning` page** merges external_events with LifeLy tasks (events are read-only)

## Future

- Auto-sync via pg_cron (every 10 min)
- Write-back (create/edit events in Google from LifeLy) — currently read-only
- Outlook & iCloud support
