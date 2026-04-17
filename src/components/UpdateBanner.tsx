import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Detects when a new service worker is waiting and shows a sticky banner.
 * Also polls for updates every 60 seconds so phones notice new builds quickly
 * even if the app stays open for a long time.
 */
export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Poll for new builds every 60 seconds
      setInterval(() => registration.update(), 60_000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-800 border border-purple-500/50 text-white text-sm font-medium rounded-2xl px-4 py-3 shadow-xl shadow-black/40 animate-fadeUp">
      <span className="text-purple-400">✨</span>
      <span className="text-gray-200">New version available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-all"
      >
        Update now
      </button>
    </div>
  )
}
