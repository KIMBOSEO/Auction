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
  
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  // 🌟 2번 요구사항: 정밀 마우스 락인(Lock-in) 돋보기 구조
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setLoading(false);

      const presenceChannel = supabase.channel(`viewers-${id}`, {
        config: { presence: { key: currentUser?.id || 'guest-' + Math.random().toString(36).substr(2, 5) } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          setViewerCount(Object.keys(presenceChannel.presenceState()).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ online_at: new Date().toISOString() });
          }
        });
    };
    
    fetchData();

    const itemChannel = supabase.channel(`item-live-sync-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
        (payload) => setItem(payload.new)
      ).subscribe();

    return () => { supabase.removeChannel(itemChannel); };
  }, [id]);

  // 🌟 2번 요구사항: 마우스가 '순수 이미지 면적' 안에서만 놀도록 가두는 초정밀 좌표 마술
  // 🌟 마우스가 '순수 이미지 면적' 안에서만 놀도록 가두는 초정밀 좌표 마술
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    
    // 마우스가 순수 이미지 경계 바깥으로 나가면 돋보기 즉시 차단
    if (e.clientX < left || e.clientX > left + width || e.clientY < top || e.clientY > top + height) {
      setZoomStyle({ display: 'none' });
      return;
    }

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    // 🚀 [핵심 수정] 무조건 0번째 이미지가 아니라, 현재 imageRef가 가리키고 있는(화면에 보이는) 실제 이미지 주소를 가져옵니다.
    const currentImageUrl = imageRef.current.src;
    
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${currentImageUrl})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%', 
    });
  };

  const handleUpdate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/items/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ id, description: editDesc })
      });
      if (!res.ok) return alert('수정 실패');
      alert('보물 설명이 깔끔하게 수정되었습니다! ✨');
      setIsEditing(false);
      setItem({ ...item, description: editDesc });
    } catch (err) {
      alert('수정 중 오류 발생');
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-blue-600 animate-pulse">가물치 로딩 중...</div>;
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
        
        {/* [왼쪽 구역] 슬라이더 및 본문 설명 */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-8 w-full overflow-hidden">
          
          {/* 🌟 2번 요구사항: 양옆 여백(px-12)을 배치하여 화살표와 사진 등록 전용 인프라 완전 격리 보호 */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoomStyle({ display: 'none' })}
            className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 border-4 border-white dark:border-gray-800 shadow-xl px-12 py-6 flex items-center justify-center group"
          >
            {/* 🌟 4번 요구사항: 블러 전면 박멸 및 오로지 SOLD OUT 솔드아웃 딱지만 상단 배치 */}
            {isEnded && (
              <div className="absolute top-6 right-6 z-40 bg-red-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg uppercase tracking-wider">
                SOLD OUT ⏳
              </div>
            )}
            
            <ImageGallery 
              itemId={item.id}
              images={item.image_urls || [item.image_url]}
              isOwner={isOwner}
              isEnded={isEnded}
              onImagesUpdate={(newImages) => setItem({...item, image_urls: newImages, image_url: newImages[0]})}
              imageRef={imageRef} // 이미지 정밀 축 추적용 포인터 바인딩
            />
            
            {/* 🌟 2번 요구사항: 오직 이미지 안쪽 영역만 거울처럼 보여주는 초강력 돋보기 데코레이터 */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-[2.5rem] hidden lg:block z-10 shadow-inner border border-white/10"
              style={zoomStyle}
            />
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
              ⚠️ <strong>법적 고지:</strong> 본 서비스는 경매 중개 플랫폼으로서 모든 거래는 개인 간의 책임 하에 진행됩니다.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-800">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block">{item.category}</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 break-all">{item.title}</h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                  className="w-full p-5 border-2 border-blue-100 dark:border-blue-800 rounded-[2rem] outline-none h-60 font-medium bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white transition-all resize-none"
                />
                <div className="flex gap-3">
                  <button onClick={handleUpdate} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black hover:bg-blue-700 transition">저장하기</button>
                  <button onClick={() => setIsEditing(false)} className="px-6 bg-gray-100 dark:bg-gray-800 text-gray-400 p-4 rounded-2xl font-black hover:bg-gray-200 transition">취소</button>
                </div>
              </div>
            ) : (
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-all">{item.description}</p>
            )}
          </div>
        </div>

        {/* [오른쪽 구역 A] 가격 폼 및 실시간 입찰 히스토리 창고 */}
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
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 text-center text-xs font-black">본인이 등록한 보물입니다 💎</div>
                  <button onClick={() => !isEnded && setIsEditing(true)} disabled={isEnded} className="w-full p-4 bg-gray-800 dark:bg-gray-700 text-white rounded-2xl font-black text-base hover:bg-black transition-all disabled:opacity-30">
                    설명 수정하기 ✍️
                  </button>
                </div>
              ) : !isEnded ? (
                <BidForm itemId={item.id} currentPrice={item.price} instantlyBuyPrice={item.instantly_buy_price} />
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center font-black text-gray-400">경매가 완료되었습니다.</div>
              )}
            </div>
          </div>

          {/* 🌟 3번 요구사항: 실시간 상호 레이싱을 완벽 중계하는 기록실 */}
          <BidHistory itemId={item.id} key={item.price} /> 
        </div>

        {/* 💬 [오른쪽 구역 B] 실시간 채팅 중계방 */}
        <div className="w-full lg:col-span-3 xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} item={item} />
        </div>

      </div>
    </div>
  );
}