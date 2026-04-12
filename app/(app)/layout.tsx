import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Nav } from '@/components/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="pt-14 pb-24 max-w-2xl mx-auto px-4">
        {children}
      </main>
    </div>
  )
}
