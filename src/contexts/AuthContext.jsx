import { createContext, useContext, useState } from 'react'

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
 * PINs are chosen by each ninja the first time they sign in on a device, and
 * live only in that browser's localStorage. There are deliberately no default
 * PINs: shipping a starting PIN meant the value sat in the source (and so in
 * the deployed bundle), where anyone could read it.
 *
 * This is still client-side only. The app has no server session, so a PIN is a
 * "who am I on this device" switch, not access control — the data itself is
 * reachable through the project's API regardless. See the Known limitations
 * section of README.md.
 */
const PIN_STORAGE_KEY = 'ninjaPins'

/**
 * Reads the stored PIN map, tolerating a corrupted entry. These run during
 * render, so an unguarded JSON.parse here would blank the login screen rather
 * than fall back to asking for a new PIN.
 */
const readPins = () => {
  try {
    return JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || '{}')
  } catch (error) {
    console.warn('Stored PINs were unreadable, clearing them:', error.message)
    localStorage.removeItem(PIN_STORAGE_KEY)
    return {}
  }
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

  /**
   * Signing in always requires a PIN that matches the stored one. The previous
   * version skipped verification whenever `pin` was falsy, which let a caller
   * in with no PIN at all.
   */
  const login = (ninja, pin) => {
    const storedPin = readPins()[ninja.id]

    if (!storedPin) {
      return { success: false, error: 'No PIN set on this device yet.' }
    }

    if (storedPin !== pin) {
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

  // Used both for the first-run choice and for a later change in Settings:
  // in either case the new value simply replaces whatever is stored.
  const updateNinjaPin = (ninjaId, newPin) => {
    const savedPins = readPins()
    savedPins[ninjaId] = newPin
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(savedPins))
  }

  // Drives the choice between asking for a PIN and setting one up. Note this
  // is per-device, so a ninja on a new browser sets a PIN again.
  //
  // There is deliberately no getter for the PIN itself: the UI only needs to
  // know whether one exists, and `login` does the comparison internally.
  const hasPin = (ninjaId) => Boolean(readPins()[ninjaId])

  const value = {
    currentNinja,
    login,
    logout,
    updateNinjaPin,
    hasPin,
    ninjas
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}