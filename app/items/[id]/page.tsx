'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // 경로 주의! @/lib/supabase 인지 확인하세요.
import BidForm from '@/components/BidForm';

export default function AuctionDetail({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    // 1. 초기 데이터 가져오기
    const fetchItem = async () => {
      const { data } = await supabase
        .from('items')
        .select('*')
        .eq('id', params.id)
        .single();
      setItem(data);
    };
    fetchItem();

    // 2. 🌟 실시간 구독 (Realtime) 설정!
    // items 테이블에 변화(UPDATE)가 생기면 바로 알려줘!
    const channel = supabase
      .channel('item-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${params.id}` },
        (payload) => {
          console.log('실시간 업데이트 감지!', payload.new);
          setItem(payload.new); // 화면의 정보를 새로운 데이터로 교체!
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // 페이지 나갈 때 구독 해제
    };
  }, [params.id]);

  if (!item) return <div className="p-10 text-center">불러오는 중... 🎣</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      {/* 화면 UI는 이전과 동일... item.price 등을 보여줌 */}
      <h2 className="text-4xl font-bold">{item.title}</h2>
      <p className="text-5xl font-black text-blue-600 my-4">{item.price.toLocaleString()}원</p>
      
      <BidForm itemId={item.id} currentPrice={item.price} />
    </div>
  );
}