'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getMinBidAmount } from "@/lib/bidUtils";

interface BidFormProps {
  itemId: string;
  currentPrice: number;
  instantlyBuyPrice?: number;
}

export default function BidForm({ itemId, currentPrice, instantlyBuyPrice }: BidFormProps) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
  }, []);

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const callBidAPI = async (payload: object) => {
    const token = await getAuthToken();
    if (!token) { alert("인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요."); return null; }
    const res = await fetch('/api/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itemId, ...payload }),
    });
    return res.json().then(data => ({ ok: res.ok, ...data }));
  };

  const handleOneClickBid = async () => {
    if (!user) return alert("로그인이 필요합니다!");
    const amount = getMinBidAmount(currentPrice);
    if (!confirm(`₩${amount.toLocaleString()}에 입찰하시겠습니까?`)) return;

    setLoading(true);
    try {
      const result = await callBidAPI({ amount });
      if (!result) return;
      if (!result.ok || result.error) {
        alert(result.error || '입찰 처리 중 오류가 발생했습니다.');
      } else {
        new Audio('/sounds/bid-sound.mp3').play().catch(() => {});
        alert('입찰 성공! 🎉');
        router.refresh();
      }
    } catch {
      alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) return alert("로그인이 필요합니다!");
    if (!instantlyBuyPrice) return;
    if (!confirm(`₩${instantlyBuyPrice.toLocaleString()}에 즉시 구매하시겠습니까?\n\n경매가 즉시 종료되며 되돌릴 수 없습니다.`)) return;

    setLoading(true);
    try {
      const result = await callBidAPI({ isBuyNow: true });
      if (!result) return;
      if (!result.ok || result.error) {
        alert(result.error || '즉시 구매 처리 중 오류가 발생했습니다.');
      } else {
        alert(`🎉 즉시 구매 완료! 낙찰가: ₩${result.finalPrice?.toLocaleString()}`);
        router.refresh();
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">다음 유효 입찰가: ₩{getMinBidAmount(currentPrice).toLocaleString()}</div>
      <button
        onClick={handleOneClickBid}
        disabled={loading}
        className="w-full p-6 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '처리 중...' : '원클릭 입찰하기 🔨'}
      </button>

      {instantlyBuyPrice && (
        <button
          onClick={handleBuyNow}
          disabled={loading}
          className="w-full p-4 rounded-2xl font-black text-lg transition-all border-2 border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 active:scale-95 disabled:opacity-50"
        >
          ₩{instantlyBuyPrice.toLocaleString()}에 즉시 구매하기 ⚡
        </button>
      )}
    </div>
  );
}