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

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setMyItems(items || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // 🌟 삭제 핸들러
  const handleDelete = async (itemId: string, imageUrl?: string) => {
    if (!confirm("정말로 이 경매를 삭제하시겠습니까? 관련 데이터가 모두 사라집니다.")) return;

    // 1. 이미지 삭제 (Storage)
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('item-images').remove([fileName]);
      }
    }

    // 2. DB 데이터 삭제
    const { error } = await supabase.from('items').delete().eq('id', itemId);

    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("성공적으로 삭제되었습니다.");
      fetchUserData(); // 목록 새로고침
    }
  };

  if (loading) return <div className="p-20 text-center font-black">로드 중... 🎣</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl">👤</div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-black text-gray-800">{user.email?.split('@')[0]}님</h2>
          <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="text-sm text-red-500 font-bold mt-2">로그아웃</button>
        </div>
      </div>

      <h3 className="text-2xl font-black mb-8 flex items-center gap-2">내가 등록한 경매 <span className="text-blue-600">{myItems.length}</span></h3>
      
      {myItems.length === 0 ? (
        <div className="bg-gray-50 rounded-[3rem] py-24 text-center text-gray-400 font-bold">등록한 물건이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {myItems.map((item) => (
            <div key={item.id} className="relative group">
              <ItemCard item={item} />
              {/* 🌟 카드 위에 삭제 버튼 얹기 */}
              <button 
                onClick={(e) => { e.preventDefault(); handleDelete(item.id, item.image_url); }}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                title="삭제하기"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}