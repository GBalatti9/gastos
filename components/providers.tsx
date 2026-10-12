'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { SwRegister } from '@/components/pwa/sw-register'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <SwRegister />
      <Toaster richColors position="top-center" />
    </SessionProvider>
  )
}
