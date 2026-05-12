'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BidHistory({ itemId }: { itemId: string }) {
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    // 1. 기존 입찰 기록 가져오기
    const fetchBids = async () => {
      const { data } = await supabase
        .from('bids')
        .select('*')
        .eq('item_id', itemId)
        .order('amount', { ascending: false });
      setBids(data || []);
    };
    fetchBids();

    // 2. 실시간 새 입찰 감시
    const channel = supabase
      .channel(`bids-${itemId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `item_id=eq.${itemId}` }, 
        (payload) => {
          setBids((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [itemId]);

  return (
    <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
        <h4 className="font-bold text-gray-700">입찰 히스토리 📈</h4>
        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-lg">실시간</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {bids.length === 0 ? (
          <p className="p-10 text-center text-gray-400 text-sm">아직 입찰 기록이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {bids.map((bid, idx) => (
              <li key={idx} className={`p-4 flex justify-between items-center ${idx === 0 ? 'bg-blue-50/50' : ''}`}>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700">
                    {bid.user_email.split('@')[0]}***
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(bid.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-black ${idx === 0 ? 'text-blue-600 text-lg' : 'text-gray-600'}`}>
                    {bid.amount.toLocaleString()}원
                  </span>
                  {idx === 0 && <span className="text-[10px] font-bold text-blue-500">현재 최고가</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}