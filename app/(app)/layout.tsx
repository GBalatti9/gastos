import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getUserByEmail, getOtherUser } from '@/lib/users'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const email = session.user?.email || ''
  const usuario = getUserByEmail(email)
  const otroUsuario = getOtherUser(email)

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar
        usuarioEmail={email}
        usuarioNombre={usuario?.nombre || session.user?.name || ''}
        otroUsuarioEmail={otroUsuario?.email || ''}
        otroUsuarioNombre={otroUsuario?.nombre || ''}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
