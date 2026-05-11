'use client'; // 클라이언트 컴포넌트 선언!

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function BidForm({ itemId, currentPrice }: { itemId: string, currentPrice: number }) {
  const [bidAmount, setBidAmount] = useState<number>(currentPrice + 1000);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBid = async () => {
    if (bidAmount <= currentPrice) {
      alert("현재가보다 높은 금액을 입력해주세요!");
      return;
    }

    setLoading(true);

    // Supabase 데이터 업데이트!
    const { error } = await supabase
      .from('items')
      .update({ 
        price: bidAmount,
        bids: Math.floor(Math.random() * 10) + 1 // 임시로 입찰 수 증가 (나중에 로직 개선 가능)
      })
      .eq('id', itemId);

    if (error) {
      alert("입찰 실패: " + error.message);
    } else {
      alert("입찰 성공! 🎉");
      router.refresh(); // 페이지를 새로고침해서 최신 가격을 보여줍니다.
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₩</span>
        <input 
          type="number" 
          value={bidAmount}
          onChange={(e) => setBidAmount(Number(e.target.value))}
          className="w-full border-2 border-gray-200 p-4 pl-10 rounded-xl focus:border-blue-500 outline-none transition"
        />
      </div>
      <button 
        onClick={handleBid}
        disabled={loading}
        className={`w-full p-5 rounded-xl font-bold text-xl transition-all shadow-lg 
          ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'}`}
      >
        {loading ? "처리 중..." : "입찰하기 🔨"}
      </button>
    </div>
  );
}