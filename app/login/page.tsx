'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return alert("이메일을 입력해주세요!");

    setLoading(true);
    setMessage('');

    // Supabase Magic Link 로그인 (이메일로 로그인 링크 발송)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 로그인 성공 시 돌아올 주소 (Vercel 배포 시 해당 도메인으로 설정 필요)
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setMessage("❌ 에러 발생: " + error.message);
    } else {
      setMessage("✅ 이메일이 발송되었습니다! 메일함의 링크를 클릭해서 로그인하세요.");
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-blue-600 mb-2">가물치 경매장 🎣</h1>
        <p className="text-gray-500 font-medium">이메일 하나로 간편하게 시작하세요</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">이메일 주소</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="puyo@example.com" 
            className="w-full border-2 border-gray-200 p-4 rounded-xl outline-none focus:border-blue-500 transition"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full p-4 rounded-xl font-bold text-white text-lg transition-all shadow-md
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
        >
          {loading ? "메일 보내는 중..." : "로그인 링크 받기 🚀"}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-xl text-center text-sm font-bold ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        비밀번호가 필요 없는 매직 링크 방식입니다.<br/>
        처음 오신 분도 이메일만 입력하면 가입됩니다.
      </p>
    </div>
  );
}