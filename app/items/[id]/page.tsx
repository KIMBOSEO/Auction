'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useParams } from 'next/navigation';
import BidForm from "@/components/BidForm";
import ChatRoom from "@/components/ChatRoom";
import Timer from "@/components/Timer";
import BidHistory from "@/components/BidHistory";

export default function ItemDetail() {
  const params = useParams();
  const id = params?.id as string;
  
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error("아이템 로드 실패:", error);
      } else {
        setItem(data);
      }
      setLoading(false);
    };

    fetchData();

    // 실시간 입찰 업데이트 구독
    const channel = supabase
      .channel(`item-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
        (payload) => {
          setItem(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <div className="p-20 text-center font-black text-blue-600">가물치 낚는 중... 🎣</div>;
  if (!item) return notFound();

  const isEnded = new Date(item.end_at) < new Date();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* 왼쪽: 이미지 영역 */}
        <div className="xl:col-span-2 space-y-8">
          <div className="aspect-[4/3] bg-gray-100 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative">
            {isEnded && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                <span className="text-white text-5xl font-black border-8 border-white px-10 py-5 rotate-[-10deg]">SOLD OUT</span>
              </div>
            )}
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 이미지 로드 실패 시 대체 이미지 (CORS 문제일 때 유용)
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Check+Supabase+Storage+CORS';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl bg-gray-200">🐟</div>
            )}
          </div>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50">
            <span className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block">
              {item.category}
            </span>
            <h2 className="text-4xl font-black text-gray-900 mb-6">{item.title}</h2>
            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        {/* 오른쪽: 입찰 정보 */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border-2 border-blue-600 shadow-2xl relative">
            <div className="mb-8">
              <p className="text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">남은 시간</p>
              <Timer targetDate={item.end_at} />
            </div>

            <div className="mb-8">
              <p className="text-blue-600 font-bold mb-1">현재 최고가</p>
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

        <div className="xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}