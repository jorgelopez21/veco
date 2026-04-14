import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    /**
     * @warning BYPASS DE DESARROLLO - SOLO PARA AMBIENTES LOCALES
     * Permite loguearse con el usuario seed sin necesidad de OAuth.
     */
    ...(process.env.NODE_ENV === "development"
      ? [
        Credentials({
          id: "dev-login",
          name: "Developer Bypass",
          credentials: {},
          async authorize() {
            // Usar un usuario de pruebas fijo para no mezclar con la cuenta real del dev
            return {
              id: "clx-demo-user-id-veco",
              name: "Demo VECO",
              email: "contacto@minube.dev",
              image: "https://ui-avatars.com/api/?name=Demo+Veco&background=10b981&color=fff",
            };
          },
        }),
      ]
      : []),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isOnHome = nextUrl.pathname === "/";

      if (isOnHome) return true; // Allow access to home page (it handles its own auth state)

      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
