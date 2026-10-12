'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Al cambiar de página, arrancar arriba (el detalle no debe heredar el scroll de la lista). */
export function ScrollToTop() {
  const pathname = usePathname()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}
