import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LoginButton } from '@/components/login-button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex w-full max-w-sm flex-col gap-8">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-2xl shadow-sm"
            priority
          />
          <div>
            <h1 className="font-display text-5xl italic tracking-tight text-foreground">gastos</h1>
            <p className="text-sm text-muted-foreground">solo para nosotros dos</p>
          </div>
        </div>

        {/* Card */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>No se pudo iniciar sesión. Intentá de nuevo.</AlertDescription>
            </Alert>
          )}
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
