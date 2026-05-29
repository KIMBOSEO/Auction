'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Bid {
  id: string;
  amount: number;
  user_nickname: string;
  created_at: string;
}

export default function BidHistory({ itemId }: { itemId: string }) {
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (!itemId) return;

    const fetchBids = async () => {
      const { data } = await supabase
        .from('bids')
        .select('id, amount, user_nickname, created_at')
        .eq('item_id', itemId)
        .order('amount', { ascending: false });
      setBids(data || []);
    };
    fetchBids();

    // 실시간 새 입찰 감지 및 목록 갱신
    const channel = supabase
      .channel(`bids-history-${itemId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `item_id=eq.${itemId}` }, 
        (payload) => {
          setBids((prev) => [payload.new as Bid, ...prev].sort((a, b) => b.amount - a.amount));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [itemId]);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full">
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4">실시간 입찰 기록실 🔨</h3>
      {bids.length === 0 ? (
        <p className="text-center text-xs font-bold text-gray-300 py-6">아직 입찰에 참여한 보물 사냥꾼이 없습니다.</p>
      ) : (
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {bids.map((bid, index) => (
            <div key={bid.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border dark:border-gray-800">
              <div className="flex items-center gap-2">
                {index === 0 && <span className="text-xs animate-bounce">👑</span>}
                <span className="text-xs font-black text-gray-700 dark:text-gray-200">{bid.user_nickname || '익명'}</span>
              </div>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">₩{bid.amount.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}