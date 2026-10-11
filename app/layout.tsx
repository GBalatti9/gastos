import type { Metadata, Viewport } from 'next'
import { DM_Sans, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Gastos',
  description: 'Gastos compartidos',
  applicationName: 'Gastos',
  appleWebApp: {
    capable: true,
    title: 'Gastos',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Para que el contenido llegue hasta los bordes en modo standalone y
  // podamos respetar las safe areas (notch, barra de inicio) con env().
  viewportFit: 'cover',
  themeColor: '#2E86C1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${instrumentSerif.variable} font-sans bg-background min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
