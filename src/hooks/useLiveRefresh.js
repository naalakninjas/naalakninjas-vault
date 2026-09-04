import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'

/**
 * Re-runs `onChange` when the vault changes underneath the screen.
 *
 * Four people share one vault, so a screen opened five minutes ago is often
 * stale: a vote was cast, a contribution logged, a request withdrawn. This
 * subscribes to Postgres changes through Supabase Realtime and reloads the
 * page's own data when one arrives.
 *
 * A refresh on regaining focus backs it up. The websocket is the fast path but
 * not a guaranteed one — some networks block it, a laptop wakes from sleep
 * with a dead socket — and coming back to the tab is exactly when a stale
 * number would be read as current.
 *
 * `onChange` is held in a ref so a caller that redefines it every render does
 * not tear the subscription down and rebuild it on each pass.
 */
export const useLiveRefresh = (tables, onChange, { enabled = true } = {}) => {
  const handler = useRef(onChange)
  handler.current = onChange

  // Joined so the effect compares by value; a fresh array literal from the
  // caller would otherwise look like a new dependency every render.
  const key = tables.join(',')

  useEffect(() => {
    if (!enabled) return

    const watched = key.split(',')

    // Changes tend to arrive in bursts — one vote fires the votes row, the
    // mission status update and the activity entry — so they are collapsed
    // into a single reload rather than three.
    let timer = null
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => handler.current(), 250)
    }

    const channel = supabase.channel(`live:${watched.join('-')}`)

    watched.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
    })

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(
          `Live updates unavailable (${status}); falling back to refresh on focus`
        )
      }
    })

    const onFocus = () => {
      if (document.visibilityState === 'visible') schedule()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [key, enabled])
}
