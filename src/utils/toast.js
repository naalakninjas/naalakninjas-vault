// Simple toast notification system
export const showToast = (message, type = 'info') => {
  // Create toast element
  const toast = document.createElement('div')
  
  const baseClasses = 'fixed top-4 right-4 px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border z-[9999] font-medium text-white transition-all duration-300 transform translate-x-full opacity-0'
  
  const typeClasses = {
    success: 'bg-emerald-500/90 border-emerald-400/30 shadow-emerald-500/25',
    error: 'bg-red-500/90 border-red-400/30 shadow-red-500/25', 
    warning: 'bg-amber-500/90 border-amber-400/30 shadow-amber-500/25',
    info: 'bg-purple-500/90 border-purple-400/30 shadow-purple-500/25'
  }
  
  toast.className = `${baseClasses} ${typeClasses[type] || typeClasses.info}`
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  // Show toast
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0')
  }, 10)
  
  // Hide and remove toast
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0')
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

// Convenience functions
export const showSuccess = (message) => showToast(message, 'success')
export const showError = (message) => showToast(message, 'error')
export const showWarning = (message) => showToast(message, 'warning')
export const showInfo = (message) => showToast(message, 'info')