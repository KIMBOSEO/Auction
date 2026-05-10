// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";

const handler = NextAuth({
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || "",
      // 아래 내용을 추가하면 이메일이 없어도 로그인이 됩니다!
      allowDangerousEmailAccountLinking: true, 
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // 이메일 대신 카카오 고유 ID를 사용하도록 설정
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.sub; // 이메일 칸에 카카오 고유 번호를 대신 넣음
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };