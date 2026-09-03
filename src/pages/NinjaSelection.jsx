import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, ArrowLeft } from 'lucide-react'
import { getNinjaAccent } from '../utils/ninjaHelpers'
import { showError } from '../utils/toast'

const NinjaSelection = () => {
  const { ninjas, login, updateNinjaPin, checkHasPin } = useAuth()
  const navigate = useNavigate()
  const pinInputRef = useRef(null)
  const [selectedNinja, setSelectedNinja] = useState(null)
  const [pin, setPin] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [pinError, setPinError] = useState('')
  const [attempts, setAttempts] = useState(0)
  // First-run setup: 'choose' collects a new PIN, 'confirm' collects it again.
  // Null means this ninja already has a PIN and we are verifying instead.
  const [setupStage, setSetupStage] = useState(null)
  const [chosenPin, setChosenPin] = useState('')
  // Which tile is waiting on its PIN-status lookup, and whether a PIN is
  // currently in flight. Both exist to keep a slow network from looking like
  // an unresponsive screen, and to block a second submit landing mid-request.
  const [checkingNinjaId, setCheckingNinjaId] = useState(null)
  const [verifying, setVerifying] = useState(false)

  // Loading sequence effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
      setTimeout(() => {
        setShowContent(true)
      }, 200)
    }, 3000) // Show loading for 3 seconds

    return () => clearTimeout(timer)
  }, [])

  const getNinjaCardClass = (ninja) => {
    switch (ninja.name) {
      case 'Shilpha': return 'ninja-avatar-emerald'
      case 'Suhas': return 'ninja-avatar-crimson'
      case 'Sudeep': return 'ninja-avatar-azure'
      case 'Aneesh': return 'ninja-avatar-gold'
      default: return 'ninja-avatar-card'
    }
  }

  const getNinjaRole = (ninja) => {
    switch (ninja.name) {
      case 'Shilpha': return 'Vault Keeper'
      case 'Suhas': return 'Mission Commander'
      case 'Sudeep': return 'Treasury Guardian'
      case 'Aneesh': return 'Council Strategist'
      default: return 'Vault Keeper'
    }
  }

  const getNinjaGlowContainerClass = (ninja) => {
    switch (ninja.name) {
      case 'Shilpha': return 'ninja-glow-emerald'
      case 'Suhas': return 'ninja-glow-crimson'
      case 'Sudeep': return 'ninja-glow-azure'
      case 'Aneesh': return 'ninja-glow-gold'
      default: return 'ninja-glow-emerald'
    }
  }

  const getNinjaEnterButtonClass = (ninja) => {
    switch (ninja.name) {
      case 'Shilpha': return 'text-green-400 border-green-400 hover:bg-green-400 hover:text-dark-bg'
      case 'Suhas': return 'text-red-400 border-red-400 hover:bg-red-400 hover:text-dark-bg'
      case 'Sudeep': return 'text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-dark-bg'
      case 'Aneesh': return 'text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-dark-bg'
      default: return 'text-green-400 border-green-400 hover:bg-green-400 hover:text-dark-bg'
    }
  }

  const getNinjaButtonClass = (ninja) => {
    switch (ninja.name) {
      case 'Shilpha': return 'ninja-button-emerald'
      case 'Suhas': return 'ninja-button-crimson'
      case 'Sudeep': return 'ninja-button-azure'
      case 'Aneesh': return 'ninja-button-gold'
      default: return 'ninja-button-primary'
    }
  }

  /**
   * Which screen a ninja gets depends on whether anyone has set their PIN yet,
   * and that answer lives in the database — so this waits for it rather than
   * showing a guess. Failing to reach the vault keeps us on the selection
   * screen: dropping into setup here would invite someone to choose a PIN that
   * could not be saved, or worse, replace one that already exists.
   */
  const handleNinjaSelect = async (ninja) => {
    if (checkingNinjaId) return

    setCheckingNinjaId(ninja.id)

    try {
      const claimed = await checkHasPin(ninja.id)

      setSelectedNinja(ninja)
      setShowPinInput(true)
      setPinError('')
      setPin('')
      setAttempts(0)
      setSetupStage(claimed ? null : 'choose')
      setChosenPin('')
    } catch (error) {
      console.error('Could not check PIN status:', error.message)
      showError('Could not reach the vault. Check your connection and try again.')
    } finally {
      setCheckingNinjaId(null)
    }
  }

  const handleBackToSelection = () => {
    setSelectedNinja(null)
    setShowPinInput(false)
    setPin('')
    setPinError('')
    setAttempts(0)
    setSetupStage(null)
    setChosenPin('')
  }

  // Failed attempts only apply to signing in. Locking someone out of choosing
  // their first PIN would strand them with no way in at all.
  const lockedOut = !setupStage && attempts >= 3

  const enterVault = () => {
    setIsEntering(true)
    setTimeout(() => navigate('/dashboard'), 1200)
  }

  const attemptLogin = async (candidate) => {
    setVerifying(true)
    const loginResult = await login(selectedNinja, candidate)
    setVerifying(false)

    if (loginResult.success) {
      enterVault()
      return
    }

    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    setPin('')

    if (newAttempts >= 3) {
      setPinError('Too many failed attempts. Choose your ninja again.')
      setTimeout(handleBackToSelection, 2500)
    } else {
      setPinError(loginResult.error)
      pinInputRef.current?.focus()
    }
  }

  /**
   * Routes a completed four-digit entry, which means one of three things
   * depending on where we are: the first half of a new PIN, the confirmation
   * of it, or a sign-in attempt.
   */
  const submitPin = async (digits) => {
    if (setupStage === 'choose') {
      setChosenPin(digits)
      setPin('')
      setSetupStage('confirm')
      return
    }

    if (setupStage === 'confirm') {
      if (digits !== chosenPin) {
        // Start the whole choice over rather than letting them retry the
        // confirmation: we do not know which of the two entries was the slip.
        setPinError('Those did not match. Pick your PIN again.')
        setChosenPin('')
        setPin('')
        setSetupStage('choose')
        return
      }

      setVerifying(true)
      const saved = await updateNinjaPin(selectedNinja.id, digits)

      if (!saved.success) {
        // Stay in setup so the PIN can be re-entered once the reason is fixed.
        setVerifying(false)
        setPin('')
        setChosenPin('')
        setSetupStage('choose')
        setPinError(saved.error)
        return
      }

      // Go through login so the session is stored in exactly one place.
      const result = await login(selectedNinja, digits)
      setVerifying(false)

      if (result.success) enterVault()
      else setPinError(result.error)

      return
    }

    await attemptLogin(digits)
  }

  // A PIN is always four digits, so the fourth keystroke submits itself —
  // except when choosing a new one, where committing on the last digit would
  // leave the Continue button permanently disabled and give no chance to
  // start over. There, the button is the way forward.
  //
  // Bails once locked out: typing would otherwise clear the lockout message
  // and land another guess before the screen resets. Also bails while a check
  // is in flight, so a fast typist cannot queue a second attempt.
  const handlePinChange = (e) => {
    if (isEntering || lockedOut || verifying) return

    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(digits)
    setPinError('')

    if (digits.length === 4 && setupStage !== 'choose') {
      submitPin(digits)
    }
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()

    if (pin.length === 4 && !isEntering && !lockedOut && !verifying) {
      submitPin(pin)
    }
  }

  if (showPinInput && selectedNinja) {
    const accent = getNinjaAccent(selectedNinja)

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="panel fade-in w-full max-w-sm p-6">
          <button
            type="button"
            onClick={handleBackToSelection}
            className="ninja-button-ghost -ml-2 h-9 px-2 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Choose a different ninja
          </button>

          <div className="mt-4 flex flex-col items-center text-center">
            <img
              src={selectedNinja.avatar}
              alt=""
              className="h-20 w-20 rounded-full object-contain p-1"
              style={{ border: `2px solid ${accent}`, background: 'var(--surface-base)' }}
            />
            <h1 className="mt-4 text-xl font-semibold text-strong">
              {setupStage ? `Welcome, ${selectedNinja.name}` : `Welcome back, ${selectedNinja.name}`}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Shield className="h-3.5 w-3.5" />
              {setupStage === 'choose' && 'Choose a 4-digit PIN'}
              {setupStage === 'confirm' && 'Enter it again to confirm'}
              {!setupStage && 'Enter your 4-digit PIN'}
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="mt-6">
            {/* One real input sitting invisibly over four painted slots: keeps
                the numeric keypad and paste, without a caret drifting through
                the middle of the dots. */}
            <label className="relative block cursor-text">
              <span className="sr-only">4-digit PIN</span>
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={handlePinChange}
                maxLength={4}
                disabled={isEntering || lockedOut || verifying}
                aria-invalid={Boolean(pinError)}
                aria-describedby={pinError ? 'pin-error' : undefined}
                className="absolute inset-0 h-full w-full opacity-0"
                autoFocus
              />
              {/* Remounted whenever the message changes so a repeat failure
                  replays the shake. Typing clears pinError in between, so two
                  identical errors in a row still animate twice. */}
              <div
                key={`${attempts}-${pinError}`}
                className={`flex justify-center gap-3 ${pinError ? 'animate-shake' : ''}`}
              >
                {[0, 1, 2, 3].map((slot) => {
                  // The next slot to fill is always the highlighted one: there
                  // is nothing else on this screen to focus.
                  const active = pin.length === slot

                  return (
                    <div
                      key={slot}
                      className="inset flex h-14 w-12 items-center justify-center transition-colors duration-150"
                      style={{
                        borderColor: pinError ? '#EF4444' : active ? accent : undefined,
                        boxShadow: active ? `0 0 0 3px ${accent}1f` : undefined
                      }}
                    >
                      {pin.length > slot && (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: accent }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </label>

            {pinError ? (
              <p id="pin-error" role="alert" className="mt-3 text-center text-sm text-red-400">
                {pinError}
                {!setupStage && attempts < 3 && (
                  <span className="mt-0.5 block text-xs text-red-400/70">
                    {3 - attempts} {3 - attempts === 1 ? 'try' : 'tries'} left
                  </span>
                )}
              </p>
            ) : setupStage === 'choose' ? (
              <p className="mt-3 text-center text-xs text-faint">
                Only you will know this. It works on every device.
              </p>
            ) : (
              // Nothing to say while confirming or signing in: the heading
              // above already carries the instruction.
              <p className="mt-3 h-4" aria-hidden="true" />
            )}

            <button
              type="submit"
              disabled={pin.length !== 4 || isEntering || lockedOut || verifying}
              className={`${getNinjaButtonClass(selectedNinja)} mt-5 w-full`}
            >
              {verifying
                ? 'Checking...'
                : setupStage === 'choose'
                  ? 'Continue'
                  : setupStage === 'confirm'
                    ? 'Set PIN & Enter'
                    : 'Enter Vault'}
            </button>
          </form>
        </div>

        {/* Success feedback. This used to live on the selection screen, where
            isEntering can never be true, so the wait had no feedback at all. */}
        {isEntering && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/95 backdrop-blur-sm">
            <div className="text-center">
              <img
                src="/images/vault-door.png"
                alt=""
                className="ninja-logo-glow mx-auto h-24 w-24 animate-spin rounded-full object-cover"
              />
              <h2 className="mt-4 text-lg font-semibold text-strong">Unlocking the vault</h2>
              <p className="mt-1 text-sm text-muted">Welcome, {selectedNinja.name}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-dark-bg flex items-center justify-center z-50">
        <div className="vault-loading-container">
          <img 
            src="/images/vault-door.png"
            alt="Loading Vault"
            className="vault-loading-logo"
          />
          <div className="loading-text">
            <h1 className="text-2xl md:text-4xl font-bold text-dark-text mb-2">
              Initializing Vault...
            </h1>
            <div className="loading-dots">
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-dark-bg flex items-center justify-center mobile-padding relative overflow-hidden transition-all duration-1000 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated Background Elements - Reduced on mobile */}
      <div className="absolute inset-0 opacity-5 hidden md:block">
        <div className="absolute top-1/4 left-1/6 w-72 h-72 bg-ninja-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-glow-pulse"></div>
        <div className="absolute top-1/3 right-1/6 w-72 h-72 bg-ninja-crimson-500 rounded-full mix-blend-multiply filter blur-xl animate-glow-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-ninja-azure-500 rounded-full mix-blend-multiply filter blur-xl animate-glow-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-ninja-gold-500 rounded-full mix-blend-multiply filter blur-xl animate-glow-pulse" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="w-full max-w-sm md:max-w-6xl text-center relative z-10">
        {/* Header - Premium Logo */}
        <div className="text-center mb-6 md:mb-8 fade-in">
          {/* Vault Door Logo */}
          <div className="flex justify-center mb-2 md:mb-3">
            <div className={`ninja-vault-logo ${isLoading ? 'vault-loading' : 'vault-normal'}`}>
              <img 
                src="/images/vault-door.png"
                alt="Naalak Ninjas Vault"
                className="vault-door-logo animate-bounce-subtle filter drop-shadow-2xl object-cover rounded-full"
              />
              <div className="absolute inset-0 bg-gradient-radial from-yellow-500/20 to-transparent rounded-full blur-3xl"></div>
            </div>
          </div>
          
          {/* Tagline */}
          <p className="text-sm md:text-xl text-dark-muted font-light tracking-wide mb-2 md:mb-3">
            Four Friends. One Fund. Infinite Support.
          </p>
          
          {/* Call to Action */}
          <div className="mt-4 md:mt-6">
            <h2 className="text-xl md:text-3xl font-bold text-dark-text mb-1">The Council Awaits</h2>
            <p className="text-sm md:text-lg text-dark-muted">Select Your Ninja</p>
          </div>
        </div>

        {/* Mobile-First Ninja Selection Grid */}
        <div className="mobile-ninja-grid md:ninja-selection-mobile mb-6 md:mb-16">
          {ninjas.map((ninja, index) => (
            <div
              key={ninja.id}
              className={`mobile-ninja-card md:ninja-avatar-mobile ${getNinjaCardClass(ninja)} slide-up group ${
                selectedNinja?.id === ninja.id ? 'ninja-selected' : ''
              }`}
              style={{animationDelay: `${index * 0.1}s`}}
              onClick={() => handleNinjaSelect(ninja)}
            >
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="mobile-ninja-avatar mb-3">
                  {ninja.avatar ? (
                    <img 
                      src={ninja.avatar} 
                      alt={ninja.name}
                      className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="transition-all duration-300 group-hover:scale-110">
                      <img 
                        src="/images/vault-door.png" 
                        alt="Vault Door"
                        className="w-16 h-16 object-cover rounded-full ninja-logo-glow"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mobile-ninja-title">
                  NINJA {ninja.name === 'Shilpha' ? 'EMERALD' : ninja.name === 'Suhas' ? 'CRIMSON' : ninja.name === 'Sudeep' ? 'AZURE' : 'GOLD'}
                </div>
                <div className="mobile-ninja-name">
                  {ninja.name}
                </div>
                <div className="mobile-ninja-role">
                  {checkingNinjaId === ninja.id ? 'Checking...' : getNinjaRole(ninja)}
                </div>
                
                {/* Selection Indicator */}
                {selectedNinja?.id === ninja.id && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 animate-pulse">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Desktop Layout (Hidden on mobile) */}
              <div className="hidden md:block text-center relative">
                <div className="mb-2 md:mb-4 relative flex justify-center">
                  <div className={`ninja-avatar-container ${getNinjaGlowContainerClass(ninja)}`}>
                    {ninja.avatar ? (
                      <img 
                        src={ninja.avatar} 
                        alt={ninja.name}
                        className="ninja-character-avatar transition-all duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="relative transition-all duration-500 group-hover:scale-110">
                        <img 
                          src="/images/vault-door.png" 
                          alt="Vault Door"
                          className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-full ninja-logo-glow"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs md:text-sm font-bold tracking-widest uppercase mb-1 opacity-90">
                      NINJA {ninja.name === 'Shilpha' ? 'EMERALD' : ninja.name === 'Suhas' ? 'CRIMSON' : ninja.name === 'Sudeep' ? 'AZURE' : 'GOLD'}
                    </h3>
                    <p className="text-base md:text-xl font-bold text-dark-text mb-1">
                      {ninja.name}
                    </p>
                    <p className="text-xs md:text-sm text-dark-muted opacity-80">
                      {getNinjaRole(ninja)}
                    </p>
                  </div>
                  
                  {checkingNinjaId === ninja.id ? (
                    <div className="mt-3 text-xs font-medium text-dark-muted">
                      Checking...
                    </div>
                  ) : selectedNinja?.id === ninja.id ? (
                    <div className="mt-3 text-xs font-medium text-green-400">
                      ✓ Selected
                    </div>
                  ) : (
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105">
                      <span className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-300 ${getNinjaEnterButtonClass(ninja)}`}>
                        Enter Vault →
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedNinja?.id === ninja.id && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 animate-pulse">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl md:rounded-3xl"></div>
            </div>
          ))}
        </div>

        {/* Footer - Compact Security Badge */}
        <div className="text-center fade-in" style={{animationDelay: '0.6s'}}>
          <div className="flex justify-center items-center gap-2 text-dark-muted">
            <Shield className="w-3 h-3 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm">Secure • Private • Trusted</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NinjaSelection
