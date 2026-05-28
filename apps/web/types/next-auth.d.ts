import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    roles: string[]
    accessToken: string
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
      roles: string[]
      accessToken: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    roles: string[]
    accessToken: string
  }
}
