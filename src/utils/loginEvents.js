/**
 * Collapses the "same ninja, same moment" duplicate that Recent attempts used
 * to show: signing in calls verify_member_pin (source 'pin'), which sets
 * currentNinja, which AuthContext reacts to by touching the session
 * (source 'session') — two rows for one real visit.
 *
 * Both are genuine events in login_events and neither should be deleted, but
 * the list only needs one of them. 'session' wins: it is the one that exists
 * specifically to say "this ninja is here", while 'pin' exists to say
 * "this PIN check happened" — useful on its own for a wrong PIN, redundant
 * once a session row already places them at the same time.
 *
 * Failed attempts are always 'pin' (touch_sign_in never records a failure)
 * and are never deduplicated — each wrong PIN is a real, distinct attempt.
 */
const DEFAULT_WINDOW_MINUTES = 10

export const dedupeSignIns = (events = [], windowMinutes = DEFAULT_WINDOW_MINUTES) => {
  const windowMs = windowMinutes * 60 * 1000

  const hasNearbySessionTouch = (event) =>
    events.some((other) => {
      if (other === event || other.source !== 'session' || !other.succeeded) return false
      if (other.member_id !== event.member_id) return false

      return Math.abs(new Date(other.created_at) - new Date(event.created_at)) <= windowMs
    })

  return events.filter((event) => {
    if (!event.succeeded || event.source !== 'pin') return true
    return !hasNearbySessionTouch(event)
  })
}
