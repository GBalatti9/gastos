import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { MobileNav } from '@/components/mobile-nav'
import { ScrollToTop } from '@/components/scroll-to-top'
import { NuevoGastoDeepLink } from '@/components/gastos/nuevo-gasto-deeplink'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getUserByEmail, getOtherUser } from '@/lib/users'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const email = session.user?.email || ''
  const usuario = getUserByEmail(email)
  const otroUsuario = getOtherUser(email)

  const usuarios = {
    usuarioEmail: email,
    usuarioNombre: usuario?.nombre || session.user?.name || '',
    otroUsuarioEmail: otroUsuario?.email || '',
    otroUsuarioNombre: otroUsuario?.nombre || '',
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar {...usuarios} />
      <SidebarInset>
        <SiteHeader />
        {/* En mobile dejamos lugar para la barra inferior + safe area */}
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6 lg:p-6 lg:pb-6">
          {children}
        </div>
      </SidebarInset>
      <MobileNav {...usuarios} />
      <ScrollToTop />
      <Suspense fallback={null}>
        <NuevoGastoDeepLink {...usuarios} />
      </Suspense>
    </SidebarProvider>
  )
}
