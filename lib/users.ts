export interface AppUser {
  email: string
  nombre: string
}

export function getUsers(): [AppUser, AppUser] {
  const user1: AppUser = {
    email: process.env.USER_1_EMAIL!,
    nombre: process.env.USER_1_NAME!,
  }
  const user2: AppUser = {
    email: process.env.USER_2_EMAIL!,
    nombre: process.env.USER_2_NAME!,
  }
  return [user1, user2]
}

export function getOtherUser(emailActual: string): AppUser {
  const [u1, u2] = getUsers()
  return emailActual === u1.email ? u2 : u1
}

export function getUserByEmail(email: string): AppUser | undefined {
  const [u1, u2] = getUsers()
  if (email === u1.email) return u1
  if (email === u2.email) return u2
  return undefined
}

export function getAllowedEmails(): string[] {
  return (process.env.NEXTAUTH_ALLOWED_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
}
