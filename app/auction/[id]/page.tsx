'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { useSession, SessionProvider } from 'next-auth/react';

function AuctionDetailContent() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [item, setItem] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  // --- 여기서부터 useEffect(감시 카메라) 시작 ---
  useEffect(() => {
    // 1. 처음 들어왔을 때 데이터 가져오기
    const fetchItem = async () => {
      const { data } = await supabase.from('auctions').select('*').eq('id', id).single();
      if (data) {
        setItem(data);
        setBidAmount(data.current_price + 1000);
      }
    };
    fetchItem();

    // 2. 실시간 구독 (누군가 입찰하면 내 화면도 즉시 업데이트)
    const channel = supabase
      .channel(`auction-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${id}` },
        (payload) => {
          console.log('실시간 데이터 수신!', payload.new);
          setItem(payload.new); // 물건 정보 업데이트
          setBidAmount(payload.new.current_price + 1000); // 내 입찰가 창도 최신가+1000원으로 자동 세팅
        }
      )
      .subscribe();

    // 3. 타이머 기능 (1초마다 남은 시간 계산)
    const timer = setInterval(() => {
      if (!item?.end_at) return;
      const now = new Date().getTime();
      const end = new Date(item.end_at).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('경매 종료');
        clearInterval(timer);
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${hours}시간 ${mins}분 ${secs}초 남음`);
      }
    }, 1000);

    // 페이지 나갈 때 감시 해제
    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [id, item?.end_at]);
  // --- 여기까지 useEffect 끝 ---

  const handleBid = async () => {
    if (!session) return alert('로그인이 필요합니다!');

    // [중요] 입찰 전 최신가 한 번 더 확인 (아까 만든 방어 로직)
    const { data: latest } = await supabase.from('auctions').select('current_price').eq('id', id).single();
    if (latest && bidAmount <= latest.current_price) {
      alert(`그새 가격이 올랐어요! 현재가는 ${latest.current_price}원입니다.`);
      return;
    }

    const { error } = await supabase
      .from('auctions')
      .update({ current_price: bidAmount, last_bidder: session.user?.name })
      .eq('id', id);

    if (error) alert('입찰 실패!');
    else alert('입찰 성공!');
  };

  if (!item) return <div style={{ padding: '50px', textAlign: 'center' }}>데이터를 불러오는 중...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
        {/* 1. 제목 영역 */}
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
        {item.title}
        </h1>
        
        {/* 2. 타이머 영역 */}
        <p style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>
        {timeLeft}
        </p>

        {/* ⭐ 3. 이미지 영역 (여기에 추가!) */}
        {item.image_url && (
        <div style={{ 
            width: '100%', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '16px', 
            overflow: 'hidden',
            marginBottom: '25px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #eee'
        }}>
            <img 
            src={item.image_url} 
            alt={item.title}
            style={{ 
                width: '100%', 
                maxHeight: '450px', // 너무 길어지지 않게 제한
                objectFit: 'contain', // 해상도 유지를 위해 contain 권장
            }} 
            />
        </div>
        )}

        {/* 4. 입찰 정보 카드 영역 (이미지 아래에 위치해야 함) */}
        <div style={{ 
          padding: '25px', 
          borderRadius: '20px', 
          backgroundColor: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          marginTop: '20px' 
        }}>
          <p style={{ color: '#666' }}>현재 입찰가</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{item.current_price.toLocaleString()}원</p>
          
          {/* ⭐ 이 부분이 살아있어야 합니다! */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <input 
              type="number" 
              value={bidAmount} 
              onChange={(e) => setBidAmount(Number(e.target.value))} // 👈 Number()로 감싸기
              placeholder="금액 입력"
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
            <button 
              onClick={handleBid} 
              style={{ padding: '12px 24px', backgroundColor: '#000', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              입찰하기
            </button>
          </div>
        </div>
    </div>
    );
}

export default function AuctionDetail() {
  return (
    <SessionProvider>
      <AuctionDetailContent />
    </SessionProvider>
  );
}