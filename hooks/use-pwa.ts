'use client'

import * as React from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Estado de instalación de la PWA:
 * - `standalone`: ya está abierta desde la pantalla de inicio
 * - `isIOS`: Safari iOS no dispara beforeinstallprompt, hay que explicar el gesto
 * - `promptInstall`: en Chrome/Android abre el diálogo nativo de instalación
 */
export function usePwa() {
  const [standalone, setStandalone] = React.useState(false)
  const [isIOS, setIsIOS] = React.useState(false)
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)')
    const nav = window.navigator as Navigator & { standalone?: boolean }
    setStandalone(mql.matches || nav.standalone === true)
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    setReady(true)

    const onChange = () => setStandalone(mql.matches)
    mql.addEventListener('change', onChange)

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    const onInstalled = () => {
      setDeferred(null)
      setStandalone(true)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      mql.removeEventListener('change', onChange)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = React.useCallback(async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
    return outcome === 'accepted'
  }, [deferred])

  return { ready, standalone, isIOS, canPrompt: deferred !== null, promptInstall }
}
