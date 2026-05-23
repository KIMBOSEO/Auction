'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BidHistory({ itemId }: { itemId: string }) {
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    if (!itemId) return;

    // 1. 초기 입찰 데이터 불러오기
    const fetchBids = async () => {
      const { data } = await supabase
        .from('bids')
        .select('*')
        .eq('item_id', itemId)
        .order('amount', { ascending: false });
      setBids(data || []);
    };
    fetchBids();

    // 2. 실시간 새로운 입찰 구독
    const channel = supabase
      .channel(`bids-pool-${itemId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `item_id=eq.${itemId}` }, 
        (payload) => {
          setBids((prev) => [payload.new, ...prev].sort((a, b) => b.amount - a.amount));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [itemId]);

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm max-h-[300px] overflow-y-auto">
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">입찰 히스토리 🔨</h3>
      
      {bids.length === 0 ? (
        <p className="text-center text-sm font-bold text-gray-300 py-10">첫 입찰의 주인공이 되어보세요!</p>
      ) : (
        <div className="space-y-3">
          {bids.map((bid, index) => (
            <div 
              key={bid.id} 
              className={`flex justify-between items-center p-3 rounded-xl text-sm transition-all ${
                index === 0 ? 'bg-blue-50/50 font-black text-blue-600 border border-blue-100' : 'text-gray-600 font-bold'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{index === 0 ? '👑' : '•'}</span>
                {/* 🌟 개인정보 수호: 닉네임이 있으면 닉네임 표기, 없으면 이메일 앞부분 마스킹 */}
                <span>
                  {bid.user_nickname || (bid.user_email ? `${bid.user_email.split('@')[0].slice(0, 3)}***` : '익명의 가물치')}
                </span>
              </div>
              <span>₩{bid.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}