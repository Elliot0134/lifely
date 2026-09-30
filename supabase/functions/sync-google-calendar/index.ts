// Supabase Edge Function: sync-google-calendar
// Pulls events from connected Google Calendars into external_events (read-only).
// Requires external_calendar_connections row with valid access_token.
// ENV REQUIRED: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (+ auto SUPABASE_URL/SERVICE_ROLE).
//
// DEPLOY: npx supabase functions deploy sync-google-calendar --project-ref owmfyebcsrhdiyskdffe
// INVOKE: POST /functions/v1/sync-google-calendar (authenticated)

import { createClient } from "jsr:@supabase/supabase-js@2"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const eventsUrl = (cal: string) =>
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal)}/events`

interface GoogleEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  htmlLink?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    client_id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
    client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })
  const resp = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!resp.ok) throw new Error(`Token refresh failed: ${await resp.text()}`)
  return resp.json() as Promise<{ access_token: string; expires_in: number }>
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return new Response("Unauthorized", { status: 401 })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) return new Response("Unauthorized", { status: 401 })

    const { data: connections } = await supabase
      .from("external_calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, message: "No Google connection" }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    let totalSynced = 0
    for (const conn of connections) {
      let accessToken = conn.access_token
      if (
        conn.token_expires_at &&
        new Date(conn.token_expires_at) <= new Date()
      ) {
        if (!conn.refresh_token) continue
        const refreshed = await refreshAccessToken(conn.refresh_token)
        accessToken = refreshed.access_token
        await supabase
          .from("external_calendar_connections")
          .update({
            access_token: accessToken,
            token_expires_at: new Date(
              Date.now() + refreshed.expires_in * 1000
            ).toISOString(),
          })
          .eq("id", conn.id)
      }

      const timeMin = new Date().toISOString()
      const timeMax = new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      ).toISOString()
      const url = new URL(eventsUrl("primary"))
      url.searchParams.set("timeMin", timeMin)
      url.searchParams.set("timeMax", timeMax)
      url.searchParams.set("singleEvents", "true")
      url.searchParams.set("orderBy", "startTime")
      url.searchParams.set("maxResults", "250")

      const eventsResp = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!eventsResp.ok) {
        console.error(`Google API error: ${await eventsResp.text()}`)
        continue
      }
      const { items } = (await eventsResp.json()) as { items: GoogleEvent[] }

      const rows = (items ?? []).map((ev) => {
        const isAllDay = !ev.start?.dateTime && !!ev.start?.date
        const startAt = ev.start?.dateTime ?? `${ev.start?.date}T00:00:00Z`
        const endAt = ev.end?.dateTime ?? `${ev.end?.date}T23:59:59Z`
        return {
          user_id: user.id,
          source: "google",
          source_event_id: ev.id,
          calendar_name: conn.account_email ?? "Google Calendar",
          title: ev.summary ?? "(sans titre)",
          description: ev.description ?? null,
          location: ev.location ?? null,
          start_at: startAt,
          end_at: endAt,
          all_day: isAllDay,
          html_link: ev.htmlLink ?? null,
          last_synced_at: new Date().toISOString(),
        }
      })

      if (rows.length > 0) {
        await supabase
          .from("external_events")
          .upsert(rows, { onConflict: "user_id,source,source_event_id" })
      }
      await supabase
        .from("external_calendar_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", conn.id)
      totalSynced += rows.length
    }

    return new Response(JSON.stringify({ synced: totalSynced }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
