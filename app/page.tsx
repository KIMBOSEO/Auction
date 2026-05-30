'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ItemCard from '@/components/ItemCard';

type SortOrder = 'newest' | 'closing' | 'bids' | 'price_low' | 'price_high';

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'all' | 'bidding' | 'ended'>('bidding');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  useEffect(() => {
    const fetchAllItems = async () => {
      setLoading(true);
      // 전체 아이템 리스트 최신순 쿼리
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    };
    fetchAllItems();
  }, []);

  // 🌟 [교정 완료] 불필요한 카테고리 필터링 조건을 완전히 도려내고 탭/검색만 남겼습니다.
  const filteredItems = items
    .filter((item) => {
      const isEnded = new Date(item.end_at) < new Date();
      if (statusTab === 'bidding' && isEnded) return false;
      if (statusTab === 'ended' && !isEnded) return false;
      if (searchQuery.trim() !== '') {
        const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const descMatch = item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return titleMatch || descMatch;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'closing': return new Date(a.end_at).getTime() - new Date(b.end_at).getTime();
        case 'bids': return (b.bids || 0) - (a.bids || 0);
        case 'price_low': return (a.price || 0) - (b.price || 0);
        case 'price_high': return (b.price || 0) - (a.price || 0);
        default: return 0;
      }
    });

  if (loading) return <div className="p-20 text-center font-black text-blue-600 animate-pulse text-lg">가물치 경매장 개장 중... 🎣</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 dark:bg-gray-950 min-h-screen transition-colors duration-200">
      
      {/* 🔍 미니멀 전면 검색 바 */}
      <div className="mb-8 max-w-xl mx-auto">
        <div className="relative flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-2 shadow-inner">
          <span className="pl-3 pr-2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="찾으시는 보물이나 포켓몬 카드를 검색하세요!"
            className="w-full py-2 bg-transparent text-sm font-bold outline-none border-none text-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* 🧭 탭 + 정렬 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-10 border-b border-gray-50 dark:border-gray-800 pb-4">
        <div className="flex gap-3">
          <button
            onClick={() => setStatusTab('bidding')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-2xl text-xs font-black tracking-wider transition-all ${
              statusTab === 'bidding'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-gray-600'
            }`}
          >
            진행중인 경매 🔥
          </button>
          <button
            onClick={() => setStatusTab('ended')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-2xl text-xs font-black tracking-wider transition-all ${
              statusTab === 'ended'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-gray-600'
            }`}
          >
            과거 낙찰 기록실 ⏳
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-gray-400 uppercase">정렬</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="flex-1 sm:flex-none bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 font-bold text-sm text-gray-700 dark:text-gray-300 py-2 px-3 rounded-xl outline-none cursor-pointer hover:border-blue-500 transition-colors"
          >
            <option value="newest">최신 등록순 ✨</option>
            <option value="closing">마감 임박순 ⏳</option>
            <option value="bids">입찰 많은순 🔥</option>
            <option value="price_low">현재가 낮은순 📉</option>
            <option value="price_high">현재가 높은순 📈</option>
          </select>
        </div>
      </div>

      {/* 📦 메인 경매품 무한 격자 그리드 */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-sm font-black text-gray-400">조건에 부합하는 가물치 보물이 없습니다. 🎣</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}