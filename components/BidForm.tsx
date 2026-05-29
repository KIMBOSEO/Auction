'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BidForm({ itemId, currentPrice, instantlyBuyPrice }: { itemId: string; currentPrice: number; instantlyBuyPrice?: number }) {
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 버튼 클릭 시 정해진 금액만큼 현재가에 더해서 입찰하는 핸들러
  const handleQuickBid = async (plusAmount: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. 로그인 유저 세션 정보 및 식별 ID 확보
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('로그인 후 입찰에 참여할 수 있습니다! 🔒');
        setIsSubmitting(false);
        return;
      }

      // 2. 유저 고유 닉네임 확보
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single();
      
      const userNickname = profile?.nickname || user.email?.split('@')[0] || '익명의 사냥꾼';
      const targetAmount = currentPrice + plusAmount;

      // 즉시구매가 방어 로직
      if (instantlyBuyPrice && targetAmount > instantlyBuyPrice) {
        alert(`즉시 구매가(₩${instantlyBuyPrice.toLocaleString()}원)를 초과하여 입찰할 수 없습니다.`);
        setIsSubmitting(false);
        return;
      }

      // 3. 🚨 [핵심 수정] bids 테이블에 유저 ID와 금액을 명확하게 INSERT 타격
      const { error: bidError } = await supabase
        .from('bids')
        .insert([{
          item_id: itemId,
          user_id: user.id,
          user_nickname: userNickname,
          amount: targetAmount
        }]);

      if (bidError) {
        console.error('입찰 등록 실패:', bidError.message);
        throw new Error(bidError.message);
      }

      alert(`🔨 ₩${targetAmount.toLocaleString()}원 입찰 공세 성공!`);
      setBidAmount('');
      router.refresh();
    } catch (err) {
      alert('입찰 처리 중 오류가 발생했습니다. DB 권한을 확인하세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleQuickBid(1000)}
          className="bg-gray-950 hover:bg-blue-600 text-white font-black text-xs py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          + 1천원
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleQuickBid(5000)}
          className="bg-gray-950 hover:bg-blue-600 text-white font-black text-xs py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          + 5천원
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleQuickBid(10000)}
          className="bg-gray-950 hover:bg-blue-600 text-white font-black text-xs py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          + 1만원
        </button>
      </div>
      
      <div className="text-[10px] text-gray-400 font-bold text-center">
        ⚠️ 버튼을 누르는 순간 즉시 입찰 조율이 체결됩니다.
      </div>
    </div>
  );
}