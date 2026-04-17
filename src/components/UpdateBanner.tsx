import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => registration.update(), 60_000)
    },
  })

  if (!needRefresh) return null

  function handleUpdate() {
    // Tell the waiting SW to activate immediately, then force a reload.
    // The reload is belt-and-suspenders: in some browsers the SW's
    // controllerchange event doesn't trigger window.location.reload() reliably.
    updateServiceWorker(true)
    setTimeout(() => window.location.reload(), 400)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-800 border border-purple-500/50 text-sm font-medium rounded-xl px-4 py-3 shadow-xl shadow-black/50 animate-fadeUp">
      <span className="text-gray-300">New version available</span>
      <button
        onClick={handleUpdate}
        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
      >
        Update now
      </button>
    </div>
  )
}
