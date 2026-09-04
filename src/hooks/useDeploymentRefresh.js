import { useEffect } from 'react'

/**
 * Picks up a new deployment in a tab that is already open.
 *
 * A deployment cannot reach into a running tab: Vite writes the app to a
 * content-hashed file, `index.html` points at it, and a browser that already
 * loaded the old file keeps running it until something reloads. Nobody closes
 * tabs on a phone, so a ninja can sit on last week's build for days while the
 * data on screen refreshes perfectly well around it.
 *
 * The check is a comparison of filenames: what this tab is running against
 * what the server is serving now. No version file to keep in step, and it
 * cannot drift out of date, because the hash *is* the build.
 *
 * The reload waits for a moment that costs nothing — see `isBusy`. Reloading
 * mid-form would throw away a half-typed contribution to deliver an update
 * nobody asked for, which is a bad trade at any speed.
 */

// Per-tab, so it clears on close. Only read to break a reload loop.
const RELOADED_KEY = 'reloadedForBuild'

const POLL_MS = 60_000

/** The bundle this tab is running, read from the tag that loaded it. */
const runningBundle = () =>
  document.querySelector('script[type="module"][src]')?.getAttribute('src') ?? null

/** The bundle the server would hand a browser arriving right now. */
const deployedBundle = async () => {
  const response = await fetch('/index.html', { cache: 'no-store' })
  if (!response.ok) return null

  const html = await response.text()

  // Both attribute orders, since nothing guarantees which side `src` lands on.
  const match =
    html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/) ??
    html.match(/<script[^>]*src="([^"]+)"[^>]*type="module"/)

  return match?.[1] ?? null
}

/**
 * Whether reloading now would interrupt something.
 *
 * An open modal covers every form in the app, and a focused field covers
 * typing outside one. Both are transient, and the reload is only deferred —
 * it goes through on the next check once the way is clear.
 */
const isBusy = () => {
  if (document.querySelector('[role="dialog"]')) return true

  const focused = document.activeElement
  if (!focused) return false

  return (
    focused.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(focused.tagName)
  )
}

export const useDeploymentRefresh = () => {
  useEffect(() => {
    // The dev server serves an unhashed entry and hot-reloads on its own, so
    // there is nothing here to detect and nothing to fix.
    if (!import.meta.env.PROD) return

    const running = runningBundle()
    if (!running) return

    let stopped = false
    let waitingFor = null

    const evaluate = async () => {
      if (stopped) return

      // Once a new build is known, stop asking and just wait for a safe
      // moment. Re-fetching would only confirm what we already found.
      if (!waitingFor) {
        let deployed = null

        try {
          deployed = await deployedBundle()
        } catch {
          // Offline, or a deployment is mid-flight. Nothing to do but retry.
          return
        }

        if (stopped || !deployed || deployed === running) return

        // Guards a reload loop: if the served HTML keeps naming a build this
        // tab does not end up running — a stale CDN copy, a rollback — one
        // attempt is enough.
        if (sessionStorage.getItem(RELOADED_KEY) === deployed) return

        waitingFor = deployed
      }

      if (isBusy()) return

      sessionStorage.setItem(RELOADED_KEY, waitingFor)
      window.location.reload()
    }

    // Returning to the tab is both the most likely moment for a deployment to
    // have happened since you last looked, and the least disruptive moment to
    // act on one.
    const timer = setInterval(evaluate, POLL_MS)
    window.addEventListener('focus', evaluate)
    document.addEventListener('visibilitychange', evaluate)

    return () => {
      stopped = true
      clearInterval(timer)
      window.removeEventListener('focus', evaluate)
      document.removeEventListener('visibilitychange', evaluate)
    }
  }, [])
}
