/* Service worker mínimo: solo notificaciones push. Sin cache offline a
 * propósito, así nunca se sirve HTML viejo después de un deploy. */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Gastos', body: event.data.text() }
  }
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'gastos',
    renotify: true,
    data: { url: data.url || '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(data.title || 'Gastos', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si la app ya está abierta, la enfocamos y navegamos
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) return client.navigate(url)
          return
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
