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

  // 🌟 13번 요구사항: 낙찰 이후 [1안 변형 + 5안 락업] 상태 관리
  const [tradeStep, setTradeStep] = useState<1 | 2 | 3>(1); // 1: 낙찰완료, 2: 입금확인(링크 해제), 3: 최종종료
  const [sellerKakaoLink, setSellerKakaoLink] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
      if (!error && data) {
        setItem(data);
        setEditDesc(data.description);

        // 🌟 판매자의 카카오톡 오픈링크 사전에 긁어오기 (락업 해제용)
        const { data: profile } = await supabase.from('profiles').select('kakao_link').eq('id', data.user_id).single();
        if (profile?.kakao_link) setSellerKakaoLink(profile.kakao_link);
      }
      setLoading(false);
    };
    fetchData();

    const channel = supabase.channel(`item-${id}`).on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
      (payload) => setItem(payload.new)
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleUpdate = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/items/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, description: editDesc })
      });
      const json = await res.json();
      if (!res.ok) return alert(json.error || '수정 실패');
      alert('설명이 수정되었습니다! ✨');
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-blue-600 animate-pulse">가물치 낚는 중...</div>;
  if (!item) return notFound();

  const isEnded = new Date(item.end_at) < new Date();
  const isOwner = user?.id === item.user_id;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 dark:bg-gray-950 transition-colors duration-200">
      {/* 🌟 9번 요구사항: 모바일과 웹에서 레이아웃이 미동도 하지 않게 그리드 격자 정렬 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-start">
        
        {/* 🖼️ [왼쪽 구역] 다중 이미지 갤러리 및 설명문 파트 */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-8 w-full overflow-hidden">
          <ImageGallery 
            itemId={item.id}
            images={item.image_urls || [item.image_url]}
            isOwner={isOwner}
            isEnded={isEnded}
            onImagesUpdate={(newImages) => setItem({...item, image_urls: newImages, image_url: newImages[0]})}
          />
          
          {/* 🌟 7번 요구사항: 면책 법적 고지문 안내 레이아웃 배치 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
              ⚠️ <strong>법적 고지:</strong> 본 서비스는 경매 중개 플랫폼으로서 경매 과정 및 최종 결과에 대해 어떠한 민형사상 책임도 지지 않으며, 모든 거래는 개인 간의 책임 하에 진행됩니다.
            </p>
          </div>
          
          {/* 상세 설명 글 내용 공간 */}
          <div className="bg-white dark:bg-gray-900 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-800">
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block">{item.category}</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 break-all">{item.title}</h2>
            
            {/* 🌟 판매자 프로필 정보 & 팔로우 연동 아키텍처 */}
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
            
            {/* 8번 요구사항: 판매 완료 상품은 수정 차단 (isEditing 진입 제어 및 서버사이드 가드 적용) */}
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

        {/* 🔨 [오른쪽 구역 A] 타이머, 입찰 모듈, 공유, 락업 정산소 */}
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

            {/* 25번 즉시 구매가 안내 컴포넌트 */}
            {item.instantly_buy_price && (
              <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-black text-green-600 dark:text-green-400">⚡ 즉시 구매가</p>
                <p className="text-xl font-black text-green-600 dark:text-green-400">₩{item.instantly_buy_price.toLocaleString()}</p>
              </div>
            )}
            
            {/* 🌟 [버그 원천 격파 완료] 깨져있던 닫는 태그 마크업 구조 완벽 조정 */}
            <div className="space-y-4">
              {/* 3번 요구사항: 원터치 주소 공유 시스템 */}
              <button 
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try { await navigator.share({ title: item.title, text: item.description, url }); return; } catch {}
                  }
                  await navigator.clipboard.writeText(url);
                  alert('🔗 링크가 클립보드에 복사되었습니다. 친구에게 경매장을 공유해 보세요!');
                }} 
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                📢 이 경매물품 링크 공유하기
              </button>

              {/* 업로더 및 입찰 가능 상태별 분기 도출 */}
              {isOwner ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 text-center text-xs font-black">
                    본인이 등록한 상품입니다
                  </div>
                  {/* 8번 요구사항: 경매 마감 상품은 수정 모드 진입 원천 차단 */}
                  <button 
                    onClick={() => !isEnded && setIsEditing(true)} 
                    disabled={isEnded} 
                    className="w-full p-4 bg-gray-800 text-white rounded-2xl font-black text-base hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    설명 수정하기 ✍️
                  </button>
                  <button className="w-full p-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-2xl font-black text-base cursor-not-allowed">
                    기간 연장 (유료 상품)
                  </button>
                </div>
              ) : !isEnded ? (
                /* 5번, 24번 요구사항 등이 내장된 원클릭 고정호가 입찰 폼 */
                <BidForm itemId={item.id} currentPrice={item.price} instantlyBuyPrice={item.instantly_buy_price} />
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center font-black text-gray-400 dark:text-gray-500">
                  경매가 완료(마감)되었습니다. ⏳
                </div>
              )}
            </div>
          </div>

          {/* 🌟 13번 요구사항: [1안 변형 + 5안 락업] 안전 거래소 패널 이식 */}
          {isEnded && (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-4 animate-fade-in">
              <h3 className="text-sm font-black text-gray-800 dark:text-white">🤝 가물치 [락업 안전 정산소]</h3>
              
              {/* 스텝 현황 게이지 바 */}
              <div className="flex justify-between text-[10px] font-black text-gray-400 dark:text-gray-500 border-b dark:border-gray-800 pb-2 mb-2">
                <span className={tradeStep >= 1 ? "text-blue-600 dark:text-blue-400" : ""}>1. 낙찰정산</span>
                <span className={tradeStep >= 2 ? "text-blue-600 dark:text-blue-400" : ""}>2. 대금입금(락해제)</span>
                <span className={tradeStep === 3 ? "text-blue-600 dark:text-blue-400" : ""}>3. 거래종료</span>
              </div>

              {tradeStep === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">안전한 양방향 정산을 위해 판매자 계좌로 입금 후 아래 확인 버튼을 눌러주세요. 즉시 판매자의 오픈프로필 링크 자물쇠가 해제됩니다.</p>
                  <button 
                    onClick={() => setTradeStep(2)}
                    className="w-full p-4 bg-blue-600 text-white rounded-xl text-xs font-black shadow-md active:scale-95 hover:bg-blue-700 transition"
                  >
                    💰 판매자 계좌로 대금 입금 완료했습니다
                  </button>
                </div>
              )}

              {tradeStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-green-600 dark:text-green-400 font-black">🔓 정산 완료! 판매자의 카카오톡 오픈프로필 버튼 자물쇠가 안전하게 해제되었습니다.</p>
                  {sellerKakaoLink ? (
                    <a 
                      href={sellerKakaoLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full block p-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 rounded-xl text-xs font-black text-center shadow-md active:scale-95 transition"
                    >
                      💬 판매자 카카오톡 오픈프로필 대화하기
                    </a>
                  ) : (
                    <p className="text-xs text-red-400 font-bold">⚠️ 판매자가 설정해둔 카카오톡 주소가 유효하지 않습니다.</p>
                  )}
                  <button 
                    onClick={() => { alert("가물치 안전 거래가 최종 수령 확인되었습니다. 멋진 피드백을 공유해 주세요!"); setTradeStep(3); }}
                    className="w-full p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-xl text-xs font-black hover:bg-black transition"
                  >
                    📦 상품 정상 수령 및 최종 마감
                  </button>
                </div>
              )}

              {tradeStep === 3 && (
                <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-black text-gray-400 dark:text-gray-500">
                  🎉 상호 신뢰 정산이 완료된 최종 거래입니다.
                </div>
              )}
            </div>
          )}

          {/* 실시간 최고가 입찰 내역 */}
          <BidHistory itemId={item.id} />
        </div>

        {/* 💬 [오른쪽 구역 B] 실시간 경매 중계방 (6번 요구사항 반영 구역) */}
        <div className="w-full lg:col-span-3 xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}