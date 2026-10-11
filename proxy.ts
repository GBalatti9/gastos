export { auth as proxy } from '@/lib/auth'

export const config = {
  // Público: API (valida sesión por su cuenta), assets de Next, login y todo
  // lo que necesita el navegador para instalar la PWA sin sesión
  // (manifest, service worker, íconos). Si el manifest redirige a /login,
  // iOS/Android no ofrecen "Agregar a inicio".
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|manifest.webmanifest|sw.js|icons/|icon.png|apple-icon.png).*)',
  ],
}
