'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ItemCard from '@/components/ItemCard';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      // 1. 유저 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요한 페이지입니다.");
        router.push('/login');
        return;
      }
      setUser(user);

      // 2. 내가 등록한 아이템 가져오기
      // (주의: items 테이블에 user_id 컬럼이 있어야 합니다!)
      const { data: items } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setMyItems(items || []);
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  if (loading) return <div className="p-10 text-center">정보를 불러오는 중... 🎣</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      {/* 유저 프로필 섹션 */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl">
          👤
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-800">{user.email?.split('@')[0]}님, 환영합니다!</h2>
          <p className="text-gray-500">{user.email}</p>
          <button 
            onClick={() => { supabase.auth.signOut(); router.push('/'); }}
            className="mt-4 text-sm text-red-500 font-semibold hover:underline"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 내가 올린 경매 리스트 */}
      <div className="mb-10">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          📦 내가 등록한 경매 <span className="text-blue-600">{myItems.length}</span>
        </h3>
        
        {myItems.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl py-20 text-center text-gray-400">
            아직 등록한 물건이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}