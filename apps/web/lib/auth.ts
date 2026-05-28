import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

        const res = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!res.ok) return null

        const data = await res.json() as { token: string; user: { id: string; name: string; email: string; roles: string[] } }

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          roles: data.user.roles,
          accessToken: data.token,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roles = (user as typeof user & { roles: string[] }).roles
        token.accessToken = (user as typeof user & { accessToken: string }).accessToken
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.roles = token.roles as string[]
      session.user.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
