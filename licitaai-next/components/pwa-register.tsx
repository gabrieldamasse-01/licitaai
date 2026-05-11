"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Registrar service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // silencioso — SW não é crítico
      })
    }

    // Exibir banner de instalação
    const dismissed = localStorage.getItem("pwa_dismissed")
    if (dismissed) return

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === "dismissed") {
      localStorage.setItem("pwa_dismissed", "1")
    }
    setShowBanner(false)
    setInstallPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem("pwa_dismissed", "1")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-slate-900 border-t border-slate-700 px-4 py-3 shadow-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          L
        </div>
        <p className="text-sm text-slate-300 truncate">
          Instale o LicitaAI no seu celular
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="text-xs text-slate-500 hover:text-slate-400 px-2 py-1"
        >
          Agora não
        </button>
        <button
          onClick={handleInstall}
          className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md"
        >
          Instalar
        </button>
      </div>
    </div>
  )
}
