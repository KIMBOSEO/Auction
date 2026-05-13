'use client';

import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) alert("로그인 에러: " + error.message);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-50 text-center max-w-md w-full">
        <h2 className="text-4xl font-black mb-4">반가워요! 🎣</h2>
        <p className="text-gray-400 font-medium mb-10">가물치 경매장에 로그인하고<br/>희귀카드를 낚아보세요.</p>
        
        <button 
          onClick={handleKakaoLogin}
          className="w-full bg-[#FEE500] text-[#3c1e1e] p-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span className="text-2xl">💬</span> 카카오로 1초 로그인
        </button>
      </div>
    </div>
  );
}