'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound } from "next/navigation";
import BidForm from "@/components/BidForm";
import ChatRoom from "@/components/ChatRoom";
import Timer from "@/components/Timer";
import BidHistory from "@/components/BidHistory";

export default function ItemDetail({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 유저 확인
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 아이템 정보
      const { data } = await supabase.from('items').select('*').eq('id', params.id).single();
      if (data) setItem(data);
      setLoading(false);
    };
    fetchData();

    // 🌟 실시간 업데이트 리스너
    const channel = supabase
      .channel(`item-${params.id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${params.id}` }, 
        (payload) => {
          setItem(payload.new);
          // 🔊 누군가 가격을 올리면 "딩동" 소리 재생!
          const audio = new Audio('/sounds/bid-sound.mp3'); 
          audio.play().catch(() => {}); // 브라우저 정책상 차단될 수 있음
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  if (loading) return <div className="p-20 text-center font-bold">가물치 불러오는 중...</div>;
  if (!item) return notFound();

  const isEnded = new Date(item.end_at) < new Date();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* 상품 정보 영역 */}
        <div className="xl:col-span-2 space-y-8">
          <div className="aspect-[4/3] bg-gray-100 rounded-[2.5rem] overflow-hidden border relative shadow-2xl">
            {isEnded && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 backdrop-blur-md">
                <span className="text-white text-6xl font-black border-8 border-white px-10 py-5 rotate-[-12deg]">SOLD OUT</span>
              </div>
            )}
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl bg-gray-200">🐟</div>
            )}
          </div>
          
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-gray-50">
            <h2 className="text-4xl font-black text-gray-900 mb-6">{item.title}</h2>
            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        {/* 입찰 & 현황 영역 */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-600 shadow-2xl relative">
            <div className="mb-8">
              <p className="text-xs font-black text-gray-400 uppercase mb-2">Auction Ends In</p>
              <Timer targetDate={item.end_at} />
            </div>

            <div className="mb-8">
              <p className="text-blue-600 font-bold mb-1">Current Price</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-blue-600">{item.price.toLocaleString()}</span>
                <span className="text-xl font-bold text-blue-600">원</span>
              </div>
            </div>
            
            {!isEnded ? (
              <BidForm itemId={item.id} currentPrice={item.price} />
            ) : (
              <div className="bg-gray-100 p-6 rounded-2xl text-center font-black text-gray-400 text-xl">경매 종료</div>
            )}
          </div>
          <BidHistory itemId={item.id} />
        </div>

        {/* 채팅 영역 */}
        <div className="xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}