import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginButton } from '@/components/login-button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Wordmark */}
        <div className="text-center space-y-2">
          <h1 className="font-display italic text-5xl text-foreground tracking-tight">gastos</h1>
          <p className="text-sm text-muted-foreground">solo para nosotros dos</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-400/10 border border-red-400/20 px-3 py-2.5 text-sm text-red-400">
              No se pudo iniciar sesión. Intentá de nuevo.
            </div>
          )}
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
