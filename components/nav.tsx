'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Home, List, PlusCircle, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/gastos', label: 'Gastos', icon: List },
  { href: '/gastos/nuevo', label: 'Nuevo', icon: PlusCircle },
]

export function Nav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary font-display italic text-xl tracking-tight">gastos</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50">
            <Avatar className="h-8 w-8 ring-1 ring-border">
              <AvatarImage src={session?.user?.image || ''} />
              <AvatarFallback className="bg-muted text-foreground text-xs">
                {session?.user?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium text-foreground">{session?.user?.name}</p>
              <p className="text-muted-foreground text-xs">{session?.user?.email}</p>
            </div>
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border flex safe-area-pb">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative group"
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
