'use client';

import { useEffect, useState } from 'react';
import { signIn, signOut, useSession, SessionProvider } from "next-auth/react";
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';

function HomeContent() {
  const { data: session } = useSession();
  const [auctions, setAuctions] = useState<any[]>([]);

  // ⭐ 전광판용 상태 추가
  const [tickerMessage, setTickerMessage] = useState("가물치 경매에 오신 것을 환영합니다! 활기찬 경매를 즐겨보세요 🛶");
  
  useEffect(() => {
    // 1. 초기 데이터 로드
    async function fetchAuctions() {
      const { data } = await supabase.from('auctions').select('*').order('created_at', { ascending: false });
      if (data) setAuctions(data);
    }
    fetchAuctions();

    // 2. ⭐ 실시간 전광판 구독 설정
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions' },
        (payload) => {
          console.log('전광판 업데이트 포착!', payload.new);
          
          // 전광판 메시지 업데이트
          const { title, last_bidder, current_price } = payload.new;
          setTickerMessage(`📣 [입찰 발생] ${last_bidder}님이 '${title}' 물건에 ${current_price.toLocaleString()}원을 입찰했습니다!`);
          
          // 목록 데이터도 실시간으로 반영 (새로고침 없이 가격 반영)
          setAuctions((prev) => 
            prev.map(item => item.id === payload.new.id ? payload.new : item)
          );
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff' }}>
      {/* 1. 애니메이션 정의 (style 태그) */}
      <style>{`
        @keyframes ticker-swipe {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .ticker-container {
          background-color: #333;
          color: #fff;
          padding: 15px 0;
          border-radius: 12px;
          margin-bottom: 25px;
          overflow: hidden; /* 영역 밖으로 나가는 글자 숨기기 */
          position: relative;
          display: flex;
        }
        .ticker-text {
          display: inline-block;
          white-space: nowrap;
          font-weight: bold;
          font-size: 15px;
          padding-left: 100%; /* 시작 위치 설정 */
          animation: ticker-swipe 15s linear infinite; /* 15초 동안 무한 반복 */
        }
        .ticker-text:hover {
          animation-play-state: paused; /* 마우스 올리면 멈추는 센스! */
          cursor: default;
        }
      `}</style>
      {/* 헤더 영역 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>🔨 가물치 경매</h1>
        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span><strong>{session.user?.name}</strong>님</span>
            <button 
              onClick={() => signOut()} 
              style={{ cursor: 'pointer', padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <button 
            onClick={() => signIn('kakao')} 
            style={{ backgroundColor: '#FEE500', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            카카오 로그인
          </button>
        )}
      </header>
        {/* ⭐ 실시간 전광판 UI */}
      <div style={{ 
        backgroundColor: '#333', 
        color: '#fff', 
        padding: '12px 20px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          animation: 'ticker 15s linear infinite' // 나중에 CSS 애니메이션 추가 가능
        }}>
          {tickerMessage}
        </div>
      </div>
      {/* 등록 유도 배너 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '25px', borderRadius: '20px', marginBottom: '40px', border: '1px solid #eee' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', color: '#222' }}>잠자고 있는 물건이 있나요?</h3>
          <p style={{ margin: 0, color: '#666' }}>지금 바로 경매에 등록하고 새로운 주인을 찾아주세요.</p>
        </div>
        <Link href="/create">
          <button style={{ padding: '15px 30px', backgroundColor: '#000', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            + 경매 등록하기
          </button>
        </Link>
      </div>

      <h2 style={{ marginBottom: '25px', fontSize: '22px' }}>🔥 현재 진행 중인 경매</h2>
      
      {/* 경매 물건 리스트 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {auctions.length > 0 ? (
          auctions.map((item) => (
            <div key={item.id} style={{ border: '1px solid #f0f0f0', padding: '15px', borderRadius: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', backgroundColor: 'white', transition: 'transform 0.2s' }}>
              
              {/* ⭐ 이미지 영역: 1:1 박스 안에서 원본 비율 유지 */}
              <div style={{ 
                width: '100%', 
                aspectRatio: '1 / 1', // 👈 박스 전체는 정사각형으로 고정하여 목록의 줄을 맞춤
                backgroundColor: '#f8f9fa', // 여백을 채워줄 깔끔한 연회색
                borderRadius: '20px', 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '15px',
                border: '1px solid #f0f0f0'
              }}>
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain', // 👈 비율 왜곡 절대 없음 (원본 유지)
                    }} 
                  />
                ) : (
                  <div style={{ color: '#ccc', fontSize: '14px' }}>이미지 준비 중</div>
                )}
              </div>

              {/* 텍스트 정보 영역 */}
              <div style={{ padding: '0 5px' }}>
                <h3 style={{ fontSize: '19px', margin: '0 0 10px 0', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ margin: '0', color: '#888', fontSize: '13px' }}>현재 입찰가</p>
                    <p style={{ margin: '0', color: '#ff4d4f', fontWeight: 'bold', fontSize: '20px' }}>
                      {item.current_price.toLocaleString()}원
                    </p>
                  </div>
                  <p style={{ margin: '0', fontSize: '12px', color: '#bbb' }}>
                    {new Date(item.end_at).toLocaleDateString()} 마감
                  </p>
                </div>
                
                <Link href={`/auction/${item.id}`}>
                  <button style={{ width: '100%', padding: '14px', marginTop: '20px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
                    자세히 보기
                  </button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: '#ccc' }}>
            <p style={{ fontSize: '18px' }}>아직 등록된 경매가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}