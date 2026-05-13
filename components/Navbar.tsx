'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* 🌟 로고 클릭 모션 추가 */}
        <Link 
          href="/" 
          className="flex items-center gap-2 p-2 rounded-2xl transition-all active:scale-90 active:bg-gray-100 hover:bg-gray-50"
        >
          <span className="text-2xl text-blue-600 font-black tracking-tighter">GA-MUL-CHI</span>
        </Link>

        <div className="flex items-center gap-6 font-bold text-gray-600">
          <Link href="/create" className="hover:text-blue-600 transition">물건 올리기</Link>
          {user ? (
            <Link href="/mypage" className="bg-gray-100 px-5 py-2 rounded-full hover:bg-gray-200">마이페이지</Link>
          ) : (
            <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-100">로그인</Link>
          )}
        </div>
      </div>
    </nav>
  );
}