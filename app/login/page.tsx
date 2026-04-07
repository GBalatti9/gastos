import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="text-4xl mb-2">💸</div>
          <CardTitle className="text-2xl">Gastos Compartidos</CardTitle>
          <CardDescription>
            Solo para nosotros dos. Iniciá sesión con tu cuenta de Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              No se pudo iniciar sesión. Intentá de nuevo.
            </div>
          )}
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  )
}
