/**
 * Wraps an activity row so entries about a request open that request.
 *
 * Rows without a `mission_id` — contributions, PIN changes — have nothing to
 * open, so they render as a plain div rather than a button that looks
 * clickable and does nothing.
 *
 * Shared by the dashboard feed and the history modal, which lay their rows out
 * differently but need the same behaviour.
 */
const ActivityLink = ({ missionId, onOpenMission, className = '', children }) => {
  if (!missionId || !onOpenMission) {
    return <div className={className}>{children}</div>
  }

  return (
    <button
      type="button"
      onClick={() => onOpenMission(missionId)}
      className={`focus-ring w-full text-left transition-colors hover:bg-[color:var(--surface-hover)] ${className}`}
    >
      {children}
    </button>
  )
}

export default ActivityLink
