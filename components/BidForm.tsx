'use client';

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function BidForm({ itemId, currentPrice }: { itemId: string, currentPrice: number }) {
  const [bidAmount, setBidAmount] = useState<number>(currentPrice + 1000);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 🔊 효과음 재생 함수
  const playBidSound = () => {
    const audio = new Audio('/sounds/bid-sound.mp3'); // public/sounds/ 폴더의 파일
    audio.play().catch(e => console.log("오디오 재생 차단됨:", e));
  };

  const handleBid = async () => {
    if (!user) return alert("로그인 후 이용해주세요!");
    if (bidAmount <= currentPrice) return alert("현재가보다 높아야 합니다!");

    setLoading(true);

    // 1. bids 테이블에 기록 추가
    const { error: bidError } = await supabase
      .from('bids')
      .insert([{ item_id: itemId, user_email: user.email, amount: bidAmount }]);

    if (bidError) {
      alert("입찰 기록 실패: " + bidError.message);
      setLoading(false);
      return;
    }

    // 2. items 테이블의 현재가 업데이트
    const { error: itemError } = await supabase
      .from('items')
      .update({ price: bidAmount })
      .eq('id', itemId);

    if (itemError) {
      alert("가격 업데이트 실패!");
    } else {
      playBidSound(); // 🎉 성공 시 소리 재생!
      alert("입찰 성공! 🎉");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₩</span>
        <input 
          type="number" 
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          className="w-full border-2 border-blue-100 p-4 pl-10 rounded-2xl outline-none focus:border-blue-500 transition-all font-black text-xl text-blue-600"
        />
      </div>
      <button 
        onClick={handleBid}
        disabled={loading || !user}
        className={`w-full p-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95
          ${!user ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'}`}
      >
        {!user ? "로그인이 필요합니다" : (loading ? "입찰 처리 중..." : "지금 입찰하기 🔨")}
      </button>
    </div>
  );
}