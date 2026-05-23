'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useParams, useRouter } from 'next/navigation';
import BidForm from "@/components/BidForm";
import ChatRoom from "@/components/ChatRoom";
import Timer from "@/components/Timer";
import BidHistory from "@/components/BidHistory";
import ImageGallery from "@/components/ImageGallery";
import FollowButton from "@/components/FollowButton";

export default function ItemDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
      if (!error && data) {
        setItem(data);
        setEditDesc(data.description);
      }
      loading && setLoading(false);
    };
    fetchData();

    const channel = supabase.channel(`item-${id}`).on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
      (payload) => setItem(payload.new)
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleUpdate = async () => {
    const { error } = await supabase.from('items').update({ description: editDesc }).eq('id', id);
    if (!error) {
      alert("설명이 수정되었습니다! ✨");
      setIsEditing(false);
      router.refresh();
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-blue-600 animate-pulse">가물치 낚는 중...</div>;
  if (!item) return notFound();

  const isEnded = new Date(item.end_at) < new Date();
  const isOwner = user?.id === item.user_id;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
      {/* 🌟 레이아웃 파괴 방지용 대형 격자(Grid) 배치 시스템 고정 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start">
        
        {/* 🖼️ [왼쪽 구역] 이미지 및 글 설명 (대화면 기준 2칸 차지) */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-8 w-full overflow-hidden">
          <ImageGallery 
            itemId={item.id}
            images={item.image_urls || [item.image_url]}
            isOwner={isOwner}
            isEnded={isEnded}
            onImagesUpdate={(newImages) => setItem({...item, image_urls: newImages, image_url: newImages[0]})}
          />
          
          {/* 🌟 법적 고지문 추가 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
              ⚠️ <strong>법적 고지:</strong> 본 서비스는 경매 중개 플랫폼으로서 경매 과정 및 최종 결과에 대해 어떠한 민형사상 책임도 지지 않으며, 모든 거래는 개인 간의 책임 하에 진행됩니다.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-800">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block">{item.category}</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 break-all">{item.title}</h2>
            
            {/* 🌟 판매자 정보 섹션 */}
            {!isOwner && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                    {item.user_nickname?.charAt(0).toUpperCase() || '판'}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase">판매자</p>
                    <p className="font-bold text-gray-900 dark:text-white">{item.user_nickname || '닉네임 미설정'}</p>
                  </div>
                </div>
                <FollowButton sellerId={item.user_id} sellerNickname={item.user_nickname || ''} />
              </div>
            )}
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                  className="w-full p-5 border-2 border-blue-100 dark:border-blue-800 rounded-[2rem] outline-none h-60 font-medium bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-700 transition-all resize-none"
                />
                <div className="flex gap-3">
                  <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black hover:bg-blue-700 transition">저장</button>
                  <button onClick={() => setIsEditing(false)} className="px-6 bg-gray-100 dark:bg-gray-800 text-gray-400 p-4 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition">취소</button>
                </div>
              </div>
            ) : (
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-all">{item.description}</p>
            )}
          </div>
        </div>

        {/* 🔨 [오른쪽 구역 A] 입찰 및 타이머 박스 */}
        <div className="space-y-6 w-full">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-blue-600 shadow-xl relative w-full">
            <div className="mb-6">
              <p className="text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">남은 시간</p>
              <Timer targetDate={item.end_at} />
            </div>

            <div className="mb-6">
              <p className="text-blue-600 font-bold mb-1">현재 최고가</p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter break-all">{item.price.toLocaleString()}</span>
                <span className="text-sm font-bold text-blue-600">원</span>
              </div>
            </div>

            {/* 즉시 구매가 (판매자가 설정한 경우만 표시) */}
            {item.instantly_buy_price && (
              <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-black text-green-600 dark:text-green-400">⚡ 즉시 구매가</p>
                <p className="text-xl font-black text-green-600 dark:text-green-400">₩{item.instantly_buy_price.toLocaleString()}</p>
              </div>
            )}
            
            {isOwner ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 text-center text-xs font-bold">본인의 등록 상품입니다</div>
                <button onClick={() => setIsEditing(true)} className="w-full p-4 bg-gray-800 text-white rounded-2xl font-black text-base hover:bg-black transition-all">설명 수정하기 ✍️</button>
                <button className="w-full p-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-base cursor-not-allowed">기간 연장 (유료 상품)</button>
              </div>
            ) : !isEnded ? (
              <BidForm itemId={item.id} currentPrice={item.price} instantlyBuyPrice={item.instantly_buy_price} />
            ) : (
              <div className="bg-gray-100 p-4 rounded-xl text-center font-black text-gray-400">경매 종료되었습니다.</div>
            )}
          </div>

          {/* 입찰 내역 */}
          <BidHistory itemId={item.id} />
        </div>

        {/* 💬 [오른쪽 구역 B] 실시간 채팅방 (대화면 기준 독립 칸 배치로 레이아웃 보장) */}
        <div className="w-full lg:col-span-3 xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}