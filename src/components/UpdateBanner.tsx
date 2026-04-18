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
    updateServiceWorker(true)
    setTimeout(() => window.location.reload(), 400)
  }

  return (
    <div className="agora-update-banner">
      <span style={{ color: 'var(--fg2)' }}>Update available</span>
      <button onClick={handleUpdate} className="agora-btn agora-btn-primary agora-btn-sm">
        Update
      </button>
      <button onClick={() => {}} style={{ background: 'none', border: 'none', color: 'var(--fg4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>
        ×
      </button>
    </div>
  )
}
