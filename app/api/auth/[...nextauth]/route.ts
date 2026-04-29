import NextAuth from "next-auth";
import LineProvider from "next-auth/providers/line";

const handler = NextAuth({
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, account, profile }) {
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
