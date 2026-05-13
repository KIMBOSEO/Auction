'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ItemCard from '@/components/ItemCard';

type TabType = 'uploaded' | 'liked' | 'bidding' | 'history';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('uploaded');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMyData = async (tab: TabType) => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { router.push('/login'); return; }
    setUser(currentUser);

    const now = new Date().toISOString();
    let query = supabase.from('items').select('*');

    if (tab === 'uploaded') query = query.eq('user_id', currentUser.id).gt('end_at', now);
    else if (tab === 'history') query = query.eq('user_id', currentUser.id).lt('end_at', now);
    else if (tab === 'liked') {
      const { data: likedData } = await supabase.from('likes').select('item_id').eq('user_id', currentUser.id);
      query = query.in('id', likedData?.map(d => d.item_id) || []);
    } else if (tab === 'bidding') {
      const { data: bidData } = await supabase.from('bids').select('item_id').eq('user_email', currentUser.email);
      const itemIds = Array.from(new Set(bidData?.map(d => d.item_id) || []));
      query = query.in('id', itemIds).gt('end_at', now);
    }

    const { data } = await query.order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMyData(activeTab); }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">👤</div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">{user?.email?.split('@')[0]}님</h2>
            <p className="text-sm text-gray-400 font-bold">가물치 경매장 멤버</p>
          </div>
        </div>
        <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="px-5 py-2 rounded-xl text-red-500 font-bold">로그아웃</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-10 bg-gray-100 p-2 rounded-[2rem] w-fit">
        {[
          { id: 'uploaded', label: '진행 중' },
          { id: 'history', label: '판매 기록' },
          { id: 'liked', label: '관심 상품' },
          { id: 'bidding', label: '입찰 현황' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`px-6 py-3 rounded-2xl font-black transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{tab.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center font-bold text-gray-300">목록을 불러오고 있어요...</div>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 rounded-[3rem] py-32 text-center text-gray-400 font-bold">비어있습니다. 🎣</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}