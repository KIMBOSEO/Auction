'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BidForm({ itemId, currentPrice, instantlyBuyPrice }: { itemId: string; currentPrice: number; instantlyBuyPrice?: number }) {
  const router = useRouter();
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 1. 뿌요님 기획 원안 복구: 구간별 자동 입찰가 증가 로직
  const getNextBidPrice = (price: number) => {
    if (price < 10000) return price + 500;
    if (price < 500000) return price + 1000;
    if (price < 1000000) return price + 5000;
    return price + 10000;
  };

  const nextPrice = getNextBidPrice(currentPrice);

  // 🌟 통합 입찰 처리 엔진
  const handleBid = async (targetAmount: number, isInstantlyBuy = false) => {
    if (isSubmitting) return;
    
    // 검증 1: 현재가보다 낮거나 같은 금액 입찰 방어
    if (targetAmount <= currentPrice) {
      alert(`현재가(₩${currentPrice.toLocaleString()}원)보다 높은 금액을 입력해주세요.`);
      return;
    }

    // 검증 2: 즉시 구매가가 설정되어 있는데, 그보다 높게 부르는 것 방어
    if (instantlyBuyPrice && targetAmount > instantlyBuyPrice) {
      alert(`즉시 낙찰가(₩${instantlyBuyPrice.toLocaleString()}원)를 초과할 수 없습니다. 즉시 낙찰 버튼을 이용해주세요!`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('로그인 후 입찰에 참여할 수 있습니다! 🔒');
        setIsSubmitting(false);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
      const userNickname = profile?.nickname || user.email?.split('@')[0] || '익명의 사냥꾼';

      // 🚨 앞서 SQL로 권한을 열어주었으므로 이제 정상적으로 INSERT 됩니다!
      const { error: bidError } = await supabase.from('bids').insert([{
        item_id: itemId,
        user_id: user.id,
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
      console.error(err);
      alert('입찰 처리 중 오류가 발생했습니다. DB 권한을 확인하세요.\n에러 내용: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🌟 2. 새로 추가된 [직접 금액 입력] 제출 핸들러
  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    // 쉼표나 문자가 섞여있어도 숫자만 순수하게 추출
    const amount = parseInt(customBidAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(amount)) return alert('정확한 금액을 입력해주세요.');
    handleBid(amount);
  };

  return (
    <div className="w-full space-y-4">
      
      {/* 1. 자동 증가 일반 입찰 버튼 (원버튼 방식) */}
      <button
        onClick={() => handleBid(nextPrice)}
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex justify-between items-center px-6"
      >
        <span>일반 입찰하기</span>
        <span className="text-lg">₩{nextPrice.toLocaleString()}</span>
      </button>

      {/* 2. 원하는 금액 직접 입력 폼 */}
      <form onSubmit={handleCustomBid} className="flex gap-2 relative">
        <input
          type="text"
          value={customBidAmount}
          // 숫자만 입력되도록 실시간 정규식 제어
          onChange={(e) => setCustomBidAmount(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder={`최소 ₩${nextPrice.toLocaleString()}원 이상 입력`}
          className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting || !customBidAmount}
          className="bg-gray-900 dark:bg-gray-700 text-white font-black px-6 rounded-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          입찰
        </button>
      </form>

      {/* 3. 즉시 낙찰 (Max Bidding) 버튼 */}
      {instantlyBuyPrice && instantlyBuyPrice > currentPrice && (
        <button
          onClick={() => handleBid(instantlyBuyPrice, true)}
          disabled={isSubmitting}
          className="w-full mt-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-black py-4 rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex justify-between items-center px-6"
        >
          <span>⚡ 즉시 낙찰 (Max Bidding)</span>
          <span className="text-lg">₩{instantlyBuyPrice.toLocaleString()}</span>
        </button>
      )}
      
      <div className="text-[10px] text-gray-400 font-bold text-center mt-2">
        ⚠️ 낙찰 후 거래 파기 시 플랫폼 이용이 제한될 수 있습니다.
      </div>
    </div>
  );
}