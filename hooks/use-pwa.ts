'use client'

import * as React from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STANDALONE_QUERY = '(display-mode: standalone)'

function subscribeStandalone(onChange: () => void) {
  const mql = window.matchMedia(STANDALONE_QUERY)
  mql.addEventListener('change', onChange)
  window.addEventListener('appinstalled', onChange)
  return () => {
    mql.removeEventListener('change', onChange)
    window.removeEventListener('appinstalled', onChange)
  }
}
const getStandalone = () => {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia(STANDALONE_QUERY).matches || nav.standalone === true
}
const getIsIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
const noop = () => () => {}
const yes = () => true
const no = () => false

/**
 * Estado de instalación de la PWA:
 * - `ready`: ya estamos en el cliente (evita desajustes de hidratación)
 * - `standalone`: ya está abierta desde la pantalla de inicio
 * - `isIOS`: Safari iOS no dispara beforeinstallprompt, hay que explicar el gesto
 * - `promptInstall`: en Chrome/Android abre el diálogo nativo de instalación
 */
export function usePwa() {
  const ready = React.useSyncExternalStore(noop, yes, no)
  const standalone = React.useSyncExternalStore(subscribeStandalone, getStandalone, no)
  const isIOS = React.useSyncExternalStore(noop, getIsIOS, no)
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null)

  React.useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
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
