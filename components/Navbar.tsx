'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, []);

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고: 모바일에서는 글자를 줄이거나 아이콘만 보여줄 수도 있음 */}
        <Link href="/" className="text-xl md:text-2xl font-black text-blue-600 tracking-tighter">
          GA-MUL-CHI <span className="hidden sm:inline">🎣</span>
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          <Link 
            href="/create" 
            className="text-sm md:text-base font-bold text-gray-600 hover:text-blue-600 transition"
          >
            물건 올리기
          </Link>
          
          {isLoggedIn ? (
            <Link 
              href="/mypage" 
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm md:text-base font-bold hover:bg-gray-200 transition"
            >
              마이페이지
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm md:text-base font-bold hover:bg-blue-700 transition"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}