'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ItemCard from '@/components/ItemCard';

type TabType = 'uploaded' | 'liked' | 'bidding';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('uploaded');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMyData = async (tab: TabType) => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    let query = supabase.from('items').select('*');

    if (tab === 'uploaded') {
      // 1. 내가 등록한 상품
      query = query.eq('user_id', currentUser.id);
    } else if (tab === 'liked') {
      // 2. 내가 찜한 상품 (likes 테이블 조인)
      const { data: likedData } = await supabase
        .from('likes')
        .select('item_id')
        .eq('user_id', currentUser.id);
      
      const itemIds = likedData?.map(d => d.item_id) || [];
      query = query.in('id', itemIds);
    } else if (tab === 'bidding') {
      // 3. 내가 입찰에 참여 중인 상품 (bids 테이블 조인)
      const { data: bidData } = await supabase
        .from('bids')
        .select('item_id')
        .eq('user_email', currentUser.email);
      
      const itemIds = Array.from(new Set(bidData?.map(d => d.item_id) || []));
      query = query.in('id', itemIds);
    }

    const { data } = await query.order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyData(activeTab);
  }, [activeTab]);

  const handleDelete = async (itemId: string, imageUrl?: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop();
      if (fileName) await supabase.storage.from('item_images').remove([fileName]);
    }
    
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (error) alert("삭제 권한이 없습니다.");
    else fetchMyData(activeTab);
  };

  if (!user && loading) return <div className="p-20 text-center font-black">가물치 창고 여는 중... 🎣</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      {/* 프로필 섹션 */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">👤</div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">{user?.email?.split('@')[0]}님</h2>
            <p className="text-sm text-gray-400 font-bold">가물치 경매장 멤버</p>
          </div>
        </div>
        <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="px-5 py-2 rounded-xl border-2 border-red-50 text-red-400 font-bold hover:bg-red-50 transition-colors">로그아웃</button>
      </div>

      {/* 🌟 탭 메뉴 */}
      <div className="flex gap-4 mb-8 bg-gray-100 p-2 rounded-3xl w-fit">
        {[
          { id: 'uploaded', label: '내 등록물' },
          { id: 'liked', label: '관심 상품' },
          { id: 'bidding', label: '입찰 현황' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-8 py-3 rounded-[1.2rem] font-black transition-all ${
              activeTab === tab.id 
              ? 'bg-white text-blue-600 shadow-md scale-105' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 아이템 그리드 */}
      {loading ? (
        <div className="py-20 text-center font-bold text-gray-300">목록을 불러오고 있어요...</div>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 rounded-[3rem] py-32 text-center">
          <p className="text-xl font-bold text-gray-400 mb-4">비어있습니다. 🎣</p>
          <a href="/" className="text-blue-600 font-black underline">보물 찾으러 가기</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <ItemCard item={item} />
              {activeTab === 'uploaded' && (
                <button 
                  onClick={(e) => { e.preventDefault(); handleDelete(item.id, item.image_url); }}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-red-500 w-10 h-10 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all z-20 flex items-center justify-center hover:bg-red-500 hover:text-white"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}