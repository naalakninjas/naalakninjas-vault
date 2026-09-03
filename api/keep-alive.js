/**
 * Daily keep-alive ping, invoked by the Vercel cron entry in vercel.json.
 *
 * Supabase pauses Free plan projects after 7 days of low activity, and it
 * measures *database* activity. A request that returns 200 without touching
 * Postgres does not reset the timer, so this issues a real (tiny) read against
 * `members` through PostgREST rather than just answering OK.
 *
 * One read is enough. The inactivity window is 7 days, so a daily run has to
 * miss seven times in a row before the project is at risk — the thing worth
 * guarding is a missed or unauthorised run, not the number of rows touched.
 *
 * Uses plain fetch instead of @supabase/supabase-js: one REST call needs no
 * client, and it keeps the function's cold start off the critical path.
 */

// Server-side names are preferred, but the VITE_-prefixed pair is what the
// project already has configured, so fall back to it rather than making the
// same two secrets get entered twice.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

/**
 * Leaves a trace of the run in `keep_alive_runs`, which is what the Vault
 * Status calendar in the app reads. Vercel's own logs are the other record,
 * but they are not visible from a phone.
 *
 * Never allowed to fail the request: the ping is the job, and losing the
 * bookkeeping is not a reason to report the ping as broken. It also counts as
 * a second write against the database, which only helps keep it awake.
 */
const recordRun = async (ok, detail) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/keep_alive_runs`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ ok, detail })
    })

    if (!response.ok) {
      console.error('Could not record the run:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Could not record the run:', error.message)
  }
}

export default async function handler(request, response) {
  // Cron paths are ordinary public URLs. Vercel sends CRON_SECRET as a bearer
  // token on its own invocations; without the secret configured there is no
  // way to tell a real cron run from anyone who guessed the path, so this
  // fails closed rather than leaving the endpoint open.
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET is not set; refusing to run unauthenticated')
    return response.status(500).json({ error: 'CRON_SECRET is not configured' })
  }

  if (request.headers.authorization !== `Bearer ${cronSecret}`) {
    return response.status(401).json({ error: 'Unauthorized' })
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Supabase credentials missing from the function environment')
    return response.status(500).json({ error: 'Supabase is not configured' })
  }

  try {
    const result = await fetch(`${SUPABASE_URL}/rest/v1/members?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    })

    if (!result.ok) {
      // Surfaced in the Vercel function logs and in the app's Vault Status
      // calendar: a paused project would start failing here first.
      const detail = await result.text()
      console.error('Keep-alive query failed:', result.status, detail)
      await recordRun(false, `Query failed with ${result.status}`)

      return response.status(502).json({ ok: false, status: result.status })
    }

    // The rows themselves are not echoed back; reaching Postgres is the point.
    await result.json()
    await recordRun(true, null)

    return response.status(200).json({ ok: true, pingedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Keep-alive request threw:', error.message)
    await recordRun(false, `Supabase unreachable: ${error.message}`)

    return response.status(502).json({ ok: false, error: 'Supabase unreachable' })
  }
}
