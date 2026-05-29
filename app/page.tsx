'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ItemCard from '@/components/ItemCard';

export default function HomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<'all' | 'bidding' | 'ended'>('bidding');
  const [searchQuery, setSearchQuery] = useState('');

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
  const filteredItems = items.filter((item) => {
    const isEnded = new Date(item.end_at) < new Date();
    
    // 1. 경매 진행 상태별 분기 매칭
    if (statusTab === 'bidding' && isEnded) return false;
    if (statusTab === 'ended' && !isEnded) return false;

    // 2. 검색어 텍스트 매칭
    if (searchQuery.trim() !== '') {
      const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || descMatch;
    }

    return true;
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

      {/* 🧭 경매 상황별 메인 이원화 제어 탭 구역 */}
      <div className="flex justify-center gap-4 mb-10 border-b border-gray-50 dark:border-gray-800 pb-4">
        <button
          onClick={() => setStatusTab('bidding')}
          className={`px-6 py-2.5 rounded-2xl text-xs font-black tracking-wider transition-all ${
            statusTab === 'bidding'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-gray-600'
          }`}
        >
          진행중인 경매 🔥
        </button>
        <button
          onClick={() => setStatusTab('ended')}
          className={`px-6 py-2.5 rounded-2xl text-xs font-black tracking-wider transition-all ${
            statusTab === 'ended'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-gray-600'
          }`}
        >
          과거 낙찰 기록실 ⏳
        </button>
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