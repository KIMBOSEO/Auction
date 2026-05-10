'use client'; // 이 파일은 사용자의 브라우저에서 작동한다는 뜻입니다.

import { SessionProvider } from "next-auth/react";

export default function AuthContext({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
// Next.js에서는 "이 사람이 로그인했나?"라는 정보를 모든 페이지가 실시간으로 공유해야 합니다. 
// 그러기 위해 사이트 전체에 '로그인 상태 저장소'라는 보자기를 씌워줄 거예요.