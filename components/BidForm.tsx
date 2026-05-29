'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BidForm({ itemId, currentPrice, instantlyBuyPrice }: { itemId: string; currentPrice: number; instantlyBuyPrice?: number }) {
  const router = useRouter();
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getNextBidPrice = (price: number) => {
    if (price < 10000) return price + 500;
    if (price < 500000) return price + 1000;
    if (price < 1000000) return price + 5000;
    return price + 10000;
  };

  const nextPrice = getNextBidPrice(currentPrice);

  const handleBid = async (targetAmount: number, isInstantlyBuy = false) => {
    if (isSubmitting) return;
    
    if (targetAmount <= currentPrice) {
      alert(`현재가(₩${currentPrice.toLocaleString()}원)보다 높은 금액을 입력해주세요.`);
      return;
    }

    if (instantlyBuyPrice && targetAmount > instantlyBuyPrice) {
      alert(`즉시 낙찰가(₩${instantlyBuyPrice.toLocaleString()}원)를 초과할 수 없습니다.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('로그인 후 참여할 수 있습니다! 🔒');
        setIsSubmitting(false);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
      const userNickname = profile?.nickname || user.email?.split('@')[0] || '사냥꾼';

      const { error: bidError } = await supabase.from('bids').insert([{
        item_id: itemId,
        user_id: user.id,
        user_email: user.email, 
        user_nickname: userNickname,
        amount: targetAmount
      }]);

      if (bidError) throw new Error(bidError.message);

      if (isInstantlyBuy) {
        alert(`🎉 축하합니다! ₩${targetAmount.toLocaleString()}원에 즉시 낙찰받으셨습니다! ⚡`);
      } else {
        alert(`🔨 ₩${targetAmount.toLocaleString()}원 입찰 성공!`);
      }
      
      setCustomBidAmount('');
      router.refresh();
    } catch (err: any) {
      alert('입찰 처리 중 오류가 발생했습니다.\n' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(customBidAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amount)) return alert('정확한 금액을 입력해주세요.');
    handleBid(amount);
  };

  return (
    <div className="w-full space-y-3 md:space-y-4">
      
      {/* 1. 일반 입찰 버튼 (패딩 및 텍스트 크기 반응형 조정) */}
      <button
        onClick={() => handleBid(nextPrice)}
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 md:py-4 rounded-xl md:rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex justify-between items-center px-4 md:px-6 gap-2"
      >
        <span className="text-sm md:text-base whitespace-nowrap">일반 입찰</span>
        <span className="text-base md:text-lg tracking-tight">₩{nextPrice.toLocaleString()}</span>
      </button>

      {/* 2. 직접 금액 입력 폼 (min-w-0 속성으로 입력창 삐져나감 100% 방지) */}
      <form onSubmit={handleCustomBid} className="flex gap-2 relative w-full">
        <input
          type="text"
          value={customBidAmount}
          onChange={(e) => setCustomBidAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder={`최소 ₩${nextPrice.toLocaleString()}`}
          className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 md:px-4 py-3 text-sm md:text-base font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors placeholder:text-xs md:placeholder:text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting || !customBidAmount}
          className="bg-gray-900 dark:bg-gray-700 text-white font-black px-4 md:px-6 rounded-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 shrink-0 text-sm md:text-base whitespace-nowrap"
        >
          입찰
        </button>
      </form>

      {/* 3. 즉시 낙찰 버튼 */}
      {instantlyBuyPrice && instantlyBuyPrice > currentPrice && (
        <button
          onClick={() => handleBid(instantlyBuyPrice, true)}
          disabled={isSubmitting}
          className="w-full mt-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-black py-3 md:py-4 rounded-xl md:rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex justify-between items-center px-4 md:px-6 gap-2"
        >
          <span className="text-sm md:text-base whitespace-nowrap">⚡ 즉시 낙찰</span>
          <span className="text-base md:text-lg tracking-tight">₩{instantlyBuyPrice.toLocaleString()}</span>
        </button>
      )}
      
      <div className="text-[10px] text-gray-400 font-bold text-center mt-2 break-keep">
        ⚠️ 낙찰 후 거래 파기 시 플랫폼 이용이 제한될 수 있습니다.
      </div>
    </div>
  );
}