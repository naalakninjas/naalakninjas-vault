/**
 * The window during which a ninja may still correct something they entered.
 *
 * Mirrors the `edit_window_hours` setting and the guard triggers in
 * db/schema.sql. The database is the authority — these helpers only decide
 * whether to offer the button, so that a ninja is not invited to click
 * something that would come back as an error.
 */

export const DEFAULT_EDIT_WINDOW_HOURS = 24

/** Reads the window from a `getSettings()` result, falling back to 24 hours. */
export const readEditWindowHours = (settings) => {
  const configured = parseFloat(
    (settings ?? []).find((setting) => setting.key === 'edit_window_hours')?.value
  )

  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_EDIT_WINDOW_HOURS
}

const millisecondsLeft = (createdAt, hours) => {
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return 0

  return created.getTime() + hours * 60 * 60 * 1000 - Date.now()
}

export const isWithinEditWindow = (createdAt, hours = DEFAULT_EDIT_WINDOW_HOURS) =>
  millisecondsLeft(createdAt, hours) > 0

/**
 * How much of the window is left, for a hint next to the buttons. Rounds up so
 * it never reads "0h left" while the action is still allowed.
 */
export const editWindowRemaining = (createdAt, hours = DEFAULT_EDIT_WINDOW_HOURS) => {
  const remaining = millisecondsLeft(createdAt, hours)
  if (remaining <= 0) return null

  const minutes = Math.ceil(remaining / (60 * 1000))
  if (minutes < 60) return `${minutes}m left`

  return `${Math.ceil(minutes / 60)}h left`
}
