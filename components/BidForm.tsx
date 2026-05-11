'use client';

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function BidForm({ itemId, currentPrice }: { itemId: string, currentPrice: number }) {
  const [bidAmount, setBidAmount] = useState<number>(currentPrice + 1000);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // 유저 정보 상태
  const router = useRouter();

  // 1. 현재 로그인한 유저가 있는지 확인
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleBid = async () => {
    if (!user) {
      alert("로그인이 필요한 서비스입니다! 로그인 페이지로 이동할까요?");
      router.push('/login'); // 로그인 페이지가 있다면 이동
      return;
    }

    if (bidAmount <= currentPrice) {
      alert("현재가보다 높은 금액을 입력해주세요!");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('items')
      .update({ price: bidAmount, bids: Math.floor(Math.random() * 10) + 1 })
      .eq('id', itemId);

    if (error) {
      alert("입찰 실패: " + error.message);
    } else {
      alert("입찰 성공! 🎉");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <input 
        type="number" 
        value={bidAmount}
        onChange={(e) => setBidAmount(Number(e.target.value))}
        className="w-full border-2 p-4 rounded-xl outline-none"
      />
      <button 
        onClick={handleBid}
        disabled={loading}
        className={`w-full p-5 rounded-xl font-bold text-xl text-white
          ${!user ? 'bg-gray-400' : (loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700')}`}
      >
        {!user ? "로그인 후 입찰 가능" : (loading ? "처리 중..." : "입찰하기 🔨")}
      </button>
    </div>
  );
}