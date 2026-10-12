'use client'

import { useEffect } from 'react'

/** Registra el service worker (push). No cachea nada. */
export function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => console.warn('No se pudo registrar el service worker', err))
  }, [])
  return null
}
