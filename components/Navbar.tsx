'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
      <Link href="/" className="text-xl font-bold text-blue-600">
        🐟 가물치 경매
      </Link>
      <div className="flex gap-4 items-center">
        {session ? (
          <>
            {/* ✨ 여기 '물건 올리기' 버튼이 추가됐어요! */}
            <Link href="/create" className="font-semibold text-blue-600 hover:text-blue-800 mr-2">
              + 물건 올리기
            </Link>
            <Link href="/mypage" className="text-gray-600 hover:text-black">마이페이지</Link>
            <button 
              onClick={() => signOut()}
              className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link href="/api/auth/signin" className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
            로그인
          </Link>
        )}
      </div>
    </nav>
  );
}