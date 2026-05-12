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
      // 1. 사용자 정보
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // 2. 아이템 정보 (id 기반 검색)
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error("아이템 로드 에러:", error);
      } else {
        setItem(data);
      }
      setLoading(false);
    };

    fetchData();

    // 3. 실시간 가격 변동 구독
    const channel = supabase
      .channel(`item-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
        (payload) => {
          setItem(payload.new);
          // (선택) 누군가 입찰하면 소리 재생
          new Audio('/sounds/update-sound.mp3').play().catch(() => {});
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">정보 불러오는 중... 🎣</div>;
  if (!item) return notFound();

  const isEnded = new Date(item.end_at) < new Date();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ======================================================== */}
        {/* 왼쪽: 이미지 & 정보 (2칸 차지) */}
        {/* ======================================================== */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* 🌟 해상도 개선된 이미지 영역 */}
          <div className="aspect-[4/3] w-full bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg relative">
            {isEnded && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                <span className="text-white text-4xl font-black border-4 border-white px-8 py-3 rotate-[-5deg]">판매 종료</span>
              </div>
            )}
            
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.title} 
                // object-contain: 사진 짤림 없이 다 보여줌 (배경은 bg-gray-50 처리)
                // object-cover로 바꾸시면 빈틈없이 꽉 채워집니다.
                className="w-full h-full object-contain" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">🐟</div>
            )}
          </div>
          
          {/* 텍스트 설명 영역 */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block">
              {item.category}
            </span>
            <h2 className="text-3xl font-black text-gray-900 mb-4">{item.title}</h2>
            <div className="w-12 h-1 bg-gray-200 mb-6 rounded-full"></div>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>

        </div>

        {/* ======================================================== */}
        {/* 오른쪽: 입찰 조작 & 채팅 (1칸 차지) */}
        {/* ======================================================== */}
        <div className="space-y-6">
          
          {/* 입찰 박스 */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-xl relative">
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 mb-1">경매 남은 시간</p>
              <Timer targetDate={item.end_at} />
            </div>

            <div className="mb-6">
              <p className="text-sm font-bold text-gray-600 mb-1">현재 최고가</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-indigo-600 tracking-tight">{item.price.toLocaleString()}</span>
                <span className="text-lg font-bold text-gray-400">원</span>
              </div>
            </div>
            
            {/* 입찰 폼 (BidForm 컴포넌트 호출) */}
            {!isEnded ? (
              <BidForm itemId={item.id} currentPrice={item.price} />
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl text-center font-bold text-gray-400">종료된 경매입니다.</div>
            )}
          </div>

          {/* 입찰 기록 */}
          <BidHistory itemId={item.id} />
          
          {/* 채팅방 */}
          <ChatRoom itemId={item.id} userEmail={user?.email} />
          
        </div>

      </div>
    </div>
  );
}