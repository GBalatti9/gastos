'use client'

import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/gastos': 'Gastos',
  '/personal': 'Mis finanzas',
  '/configuracion': 'Ajustes',
}

function getTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname]
  if (pathname.startsWith('/gastos/')) return 'Detalle del gasto'
  if (pathname.startsWith('/gastos')) return 'Gastos'
  return 'Gastos'
}

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-30 flex h-[calc(var(--header-height)+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur transition-[width,height] ease-linear supports-[backdrop-filter]:bg-background/80 group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:static md:bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* En mobile la navegación es la barra inferior: sin trigger del sidebar */}
        <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
        <Separator
          orientation="vertical"
          className="mx-2 hidden data-[orientation=vertical]:h-4 md:block"
        />
        <h1 className="text-base font-medium">{getTitle(pathname)}</h1>
      </div>
    </header>
  )
}
