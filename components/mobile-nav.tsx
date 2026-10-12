'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, Plus, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NuevoGastoDialog } from '@/components/gastos/nuevo-gasto-dialog'
import { cn } from '@/lib/utils'

const izquierda = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: List },
]
const derecha = [
  { href: '/inversion', label: 'Inversión', icon: TrendingUp },
  { href: '/personal', label: 'Mis finanzas', icon: Wallet },
]

interface Props {
  usuarioEmail: string
  usuarioNombre: string
  otroUsuarioEmail: string
  otroUsuarioNombre: string
}

function Tab({ href, label, icon: Icon }: { href: string; label: string; icon: typeof List }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Icon className={cn('size-5', active && 'stroke-[2.25]')} />
      <span className="truncate">{label}</span>
    </Link>
  )
}

/**
 * Barra de navegación inferior para mobile, con el botón "+" al centro.
 * En desktop (md+) no se renderiza: ahí manda el sidebar.
 */
export function MobileNav(props: Props) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <div className="flex h-16 items-stretch px-2">
        {izquierda.map((t) => (
          <Tab key={t.href} {...t} />
        ))}

        <div className="flex flex-1 items-center justify-center">
          <NuevoGastoDialog
            {...props}
            trigger={
              <Button
                size="icon-lg"
                aria-label="Nuevo gasto"
                className="-mt-6 size-14 rounded-full shadow-lg shadow-primary/30"
              >
                <Plus className="size-7" />
              </Button>
            }
          />
        </div>

        {derecha.map((t) => (
          <Tab key={t.href} {...t} />
        ))}
      </div>
    </nav>
  )
}
