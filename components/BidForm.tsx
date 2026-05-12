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
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    getUser();
  }, []);

  const handleBid = async () => {
    if (!user) return alert("로그인이 필요합니다! 🎣");
    if (bidAmount <= currentPrice) return alert("현재가보다 높은 금액을 입력해주세요!");

    setLoading(true);

    // 🌟 핵심: itemId가 UUID 형식이 아니면(예: '2') 여기서 에러가 납니다.
    const { error: bidError } = await supabase
      .from('bids')
      .insert([{ item_id: itemId, user_email: user.email, amount: bidAmount }]);

    if (bidError) {
      console.error("Bids Insert Error:", bidError);
      alert("입찰 실패: " + bidError.message);
      setLoading(false);
      return;
    }

    const { error: itemError } = await supabase
      .from('items')
      .update({ price: bidAmount })
      .eq('id', itemId);

    if (itemError) {
      alert("가격 업데이트 실패!");
    } else {
      new Audio('/sounds/bid-sound.mp3').play().catch(() => {});
      alert("입찰 성공! 🎉");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₩</span>
        <input 
          type="number" 
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          className="w-full border-2 border-gray-100 p-5 pl-12 rounded-2xl outline-none focus:border-blue-500 font-black text-2xl text-blue-600 bg-gray-50"
        />
      </div>
      <button 
        onClick={handleBid}
        disabled={loading || !user}
        className={`w-full p-6 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95
          ${!user ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {!user ? "로그인 후 이용 가능" : (loading ? "처리 중..." : "지금 입찰하기 🔨")}
      </button>
    </div>
  );
}