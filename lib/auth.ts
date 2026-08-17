import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });

          if (!user?.password || !user.isActive) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name:
              [user.firstName, user.lastName].filter(Boolean).join(" ") ||
              user.email,
            role: user.role,
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error("Auth database error:", error);

          if (
            message.includes("Authentication failed") ||
            message.includes("P1000") ||
            message.includes("ECONNREFUSED")
          ) {
            throw new Error("DATABASE_UNAVAILABLE");
          }

          return null;
        }
      },
    }),
    // TODO: Add Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    // TODO: Add Microsoft OAuth (MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET)
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
