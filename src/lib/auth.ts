import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Temporarily disable adapter to fix build issues
  // adapter: FirestoreAdapter(firebaseConfig),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token, user }) {
      // Add user ID to the session
      if (token && token.sub) {
        session.user.id = token.sub;
      } else if (user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add custom claims to the JWT
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  debug: process.env.NODE_ENV === "development",
};