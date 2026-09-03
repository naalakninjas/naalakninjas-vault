import { createContext, useContext, useEffect, useState } from 'react'
import { dbService } from '../services/supabase'

const AuthContext = createContext({})

/**
 * The squad roster. `id` matches `members.id` in the database, so these ids are
 * reference data and must not be renumbered. Listed in display order.
 */
export const ninjas = [
  { id: 4, name: 'Aneesh', title: 'Gold Keeper', avatar: '/images/ninja-yellow.png' },
  { id: 1, name: 'Shilpha', title: 'Emerald Guardian', avatar: '/images/ninja-green.png' },
  { id: 3, name: 'Sudeep', title: 'Azure Defender', avatar: '/images/ninja-blue.png' },
  { id: 2, name: 'Suhas', title: 'Crimson Warrior', avatar: '/images/ninja-red.png' }
]

/**
 * PINs are chosen by each ninja on first sign-in and stored as bcrypt hashes
 * in the database, so one PIN follows a ninja to every device.
 *
 * They used to live in each browser's localStorage, which quietly made a PIN
 * mean "a PIN on this device": whoever opened the app somewhere new was
 * offered first-run setup for all four ninjas, and could set a PIN for a
 * teammate who already had one. Verification now happens in Postgres, through
 * the SECURITY DEFINER functions in db/schema.sql, and the hash is never sent
 * to the browser.
 *
 * This is still not authentication. Every browser holds the same public anon
 * key, and a successful PIN check creates no database session, so the data
 * remains reachable through the project's API regardless. A PIN says which
 * ninja is using the app; it does not restrict what the app can read. See the
 * Known limitations section of README.md.
 */

/**
 * Turns a Postgres error into something worth showing on screen. The messages
 * raised by set_member_pin() are matched on rather than passed through, so a
 * connection failure cannot end up rendered as a PIN complaint.
 */
const describePinFailure = (error) => {
  const message = error?.message || ''

  if (message.includes('Current PIN is incorrect')) return 'That is not your current PIN.'
  if (message.includes('four digits')) return 'A PIN must be exactly four digits.'

  console.error('Saving the PIN failed:', message)
  return 'Could not save your PIN. Check your connection and try again.'
}

/**
 * Reads the stored session. Runs during the initial state setup rather than in
 * an effect: if the first render saw `null`, ProtectedRoute would redirect to
 * ninja selection before the session restored, so refreshing any page kicked
 * you back to login.
 */
const restoreSession = () => {
  try {
    const saved = localStorage.getItem('currentNinja')
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.warn('Stored session was unreadable, clearing it:', error.message)
    localStorage.removeItem('currentNinja')
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [currentNinja, setCurrentNinja] = useState(restoreSession)
  const [pinStatus, setPinStatus] = useState(null)

  // Warmed up front so the selection screen can show who still needs to set a
  // PIN without a request per tap. `checkHasPin` re-reads before it matters.
  useEffect(() => {
    let active = true

    // PINs used to be kept here in plaintext. Nothing reads the key any more,
    // so clear it rather than leave a copy of everyone's PIN on the device.
    localStorage.removeItem('ninjaPins')

    dbService
      .getPinStatus()
      .then((status) => {
        if (active) setPinStatus(status)
      })
      .catch((error) => {
        console.warn('Could not load PIN status:', error.message)
      })

    return () => {
      active = false
    }
  }, [])

  /**
   * Whether a ninja has already claimed their PIN.
   *
   * Deliberately re-reads from the database instead of trusting the cached
   * map: another device may have claimed the ninja since this tab loaded, and
   * being wrong here would offer first-run setup for an account that already
   * has an owner. Throws if the database is unreachable, because the caller
   * must not guess which screen to show.
   */
  const checkHasPin = async (ninjaId) => {
    const status = await dbService.getPinStatus()
    setPinStatus(status)
    return Boolean(status[ninjaId])
  }

  /**
   * Signing in always requires a PIN that matches the stored hash. The
   * comparison happens in Postgres; a ninja with no PIN yet simply never
   * matches, and the selection screen routes them to setup instead.
   */
  const login = async (ninja, pin) => {
    let matches

    try {
      matches = await dbService.verifyPin(ninja.id, pin)
    } catch (error) {
      console.error('PIN verification failed:', error.message)
      return { success: false, error: 'Could not reach the vault. Try again.' }
    }

    if (!matches) {
      return { success: false, error: 'Invalid PIN. Please try again.' }
    }

    setCurrentNinja(ninja)
    localStorage.setItem('currentNinja', JSON.stringify(ninja))
    return { success: true }
  }

  const logout = () => {
    setCurrentNinja(null)
    localStorage.removeItem('currentNinja')
  }

  /**
   * Used both for the first-run choice and for a later change in Settings.
   * Pass `currentPin` for a change: the database requires it once a PIN
   * exists, which is what stops one browser from overwriting another's.
   *
   * Returns a result instead of throwing, since both callers need to render
   * the reason — "that is not your current PIN" above all.
   */
  const updateNinjaPin = async (ninjaId, newPin, currentPin = null) => {
    try {
      await dbService.setPin(ninjaId, newPin, currentPin)
      setPinStatus((previous) => ({ ...previous, [ninjaId]: true }))
      return { success: true }
    } catch (error) {
      return { success: false, error: describePinFailure(error) }
    }
  }

  const value = {
    currentNinja,
    login,
    logout,
    updateNinjaPin,
    checkHasPin,
    pinStatus,
    ninjas
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}