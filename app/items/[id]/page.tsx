'use client'; // 클라이언트 컴포넌트로 전환하여 더 안정적으로 params 처리

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useParams } from 'next/navigation';
import BidForm from "@/components/BidForm";
import ChatRoom from "@/components/ChatRoom";
import Timer from "@/components/Timer";
import BidHistory from "@/components/BidHistory";

export default function ItemDetail() {
  const params = useParams(); // URL에서 id를 직접 가져옴
  const id = params?.id as string;
  
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      // 1. 유저 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. 아이템 정보 가져오기
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error("데이터 로드 실패:", error);
        setItem(null);
      } else {
        setItem(data);
      }
      setLoading(false);
    };

    fetchData();

    // 실시간 업데이트 리스너
    const channel = supabase
      .channel(`item-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
        (payload) => {
          setItem(payload.new);
          // 소리 효과 (파일이 있을 경우)
          new Audio('/sounds/update-sound.mp3').play().catch(() => {});
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
      <p className="font-bold text-gray-500">가물치 낚는 중...</p>
    </div>
  );

  if (!item) return notFound(); // 아이템이 없으면 404 페이지로

  const isEnded = new Date(item.end_at) < new Date();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* 상품 이미지 및 설명 */}
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
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-black uppercase">
                {item.category}
              </span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">{item.title}</h2>
            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        {/* 입찰 정보 박스 */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-600 shadow-2xl relative">
            <div className="mb-8">
              <p className="text-xs font-black text-gray-400 uppercase mb-2">남은 시간</p>
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

        {/* 채팅방 */}
        <div className="xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}