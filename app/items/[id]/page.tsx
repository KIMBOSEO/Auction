'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [viewerCount, setViewerCount] = useState<number>(1);

  // 🌟 1번 요구사항: 300% 돋보기 세팅
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
      if (!error && data) {
        setItem(data);
      }
      setLoading(false);

      const presenceChannel = supabase.channel(`viewers-${id}`, {
        config: { presence: { key: currentUser?.id || 'guest-' + Math.random().toString(36).substr(2, 5) } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          setViewerCount(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ online_at: new Date().toISOString() });
          }
        });
    };
    
    fetchData();

    // 실시간 아이템 갱신 채널
    const itemChannel = supabase.channel(`item-${id}`).on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
      (payload) => setItem(payload.new)
    ).subscribe();

    return () => { 
      supabase.removeChannel(itemChannel); 
    };
  }, [id]);

  // 🌟 1번 요구사항: 300% 정밀 확대 좌표 계산 및 내부 간섭 제거
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${item?.image_url || item?.image_urls?.[0]})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '300%', // 🚀 뿌요님 의견 수렴: 300% 고정
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  if (loading) return <div className="p-20 text-center font-black text-blue-600 animate-pulse">가물치 낚는 중...</div>;
  if (!item) return notFound();

  const isEnded = new Date(item.end_at) < new Date();
  const isOwner = user?.id === item.user_id;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 dark:bg-gray-950 transition-colors duration-200">
      
      <div className="mb-6 flex justify-end">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 block animate-pulse"></span>
          <span className="text-xs font-black text-red-600 dark:text-red-400">현재 {viewerCount}명 시청 중 👁️</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start">
        
        {/* [왼쪽 구역] 미디어 플레이어 및 설명문 */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-8 w-full overflow-hidden">
          
          <div 
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 border-4 border-white dark:border-gray-800 shadow-xl group"
          >
            {/* 🌟 3번 요구사항: 블러(Blur) 전면 삭제! 선명하게 보여주고 우측 상단 뱃지만 강조 */}
            {isEnded && (
              <div className="absolute top-4 right-4 z-40 bg-red-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg uppercase tracking-wider">
                SOLD OUT ⏳
              </div>
            )}
            
            <ImageGallery 
              itemId={item.id}
              images={item.image_urls || [item.image_url]}
              isOwner={isOwner}
              isEnded={isEnded}
              onImagesUpdate={(newImages) => setItem({...item, image_urls: newImages, image_url: newImages[0]})}
            />
            
            {/* 🌟 1번 요구사항: pointer-events-none을 걸어 화살표 클릭을 방해하지 않는 돋보기 창 */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-[2.5rem] hidden lg:block z-20 shadow-2xl border border-white/10"
              style={zoomStyle}
            />
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
              ⚠️ <strong>법적 고지:</strong> 본 서비스는 경매 중개 플랫폼으로서 경매 과정 및 최종 결과에 대해 어떠한 민형사상 책임도 지지 않으며, 모든 거래는 개인 간의 책임 하에 진행됩니다.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-800">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block">{item.category}</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 break-all">{item.title}</h2>
            
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
            
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-all">{item.description}</p>
          </div>
        </div>

        {/* [오른쪽 구역 A] 입찰 폼 및 타이머 */}
        <div className="space-y-6 w-full">
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[2.5rem] border-2 border-blue-600 shadow-xl relative w-full">
            <div className="mb-6">
              <p className="text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">남은 시간</p>
              <Timer targetDate={item.end_at} />
            </div>

            <div className="mb-6">
              <p className="text-blue-600 dark:text-blue-400 font-bold mb-1">현재 최고가</p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter break-all">{item.price.toLocaleString()}</span>
                <span className="text-sm font-bold text-blue-600">원</span>
              </div>
            </div>

            <div className="space-y-4">
              {isOwner ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 text-center text-xs font-black">
                  본인이 등록한 보물입니다 💎
                </div>
              ) : !isEnded ? (
                <BidForm itemId={item.id} currentPrice={item.price} instantlyBuyPrice={item.instantly_buy_price} />
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center font-black text-gray-400 dark:text-gray-500">
                  경매가 완료(마감)되었습니다.
                </div>
              )}
            </div>
          </div>

          {/* 🌟 2번 요구사항: 실시간 입찰 히스토리 정상 출력소 배정 */}
          <BidHistory itemId={item.id} key={item.price} /> 
        </div>

        {/* 💬 [오른쪽 구역 B] 실시간 채팅방 (판매자 완벽 왼쪽 배치 버전) */}
        <div className="w-full lg:col-span-3 xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} item={item} />
        </div>

      </div>
    </div>
  );
}