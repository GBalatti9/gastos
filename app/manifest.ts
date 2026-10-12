import type { MetadataRoute } from 'next'

export const THEME_COLOR = '#2E86C1'
export const BACKGROUND_COLOR = '#FBFCFE'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gastos',
    short_name: 'Gastos',
    description: 'Gastos compartidos, solo para nosotros dos',
    lang: 'es',
    id: '/dashboard',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Nuevo gasto',
        short_name: 'Nuevo',
        description: 'Cargar un gasto',
        url: '/dashboard?nuevo=1',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Cargar cobro',
        short_name: 'Cobro',
        description: 'Registrar un cobro y ver cuánto invertir',
        url: '/inversion?cobro=1',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}
