'use client';

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { getBidIncrement, getMinBidAmount, roundUpToValidBid } from "@/lib/bidUtils";

interface BidFormProps {
  itemId: string;
  currentPrice: number;
  instantlyBuyPrice?: number;
}

export default function BidForm({ itemId, currentPrice, instantlyBuyPrice }: BidFormProps) {
  const minBid = getMinBidAmount(currentPrice);
  const increment = getBidIncrement(currentPrice);

  const [bidAmount, setBidAmount] = useState<number>(minBid);
  const [maxBidAmount, setMaxBidAmount] = useState<number>(minBid);
  const [isAutoBid, setIsAutoBid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
  }, []);

  // currentPrice 변경 시 최소 입찰가 갱신
  useEffect(() => {
    setBidAmount(getMinBidAmount(currentPrice));
    setMaxBidAmount(getMinBidAmount(currentPrice));
  }, [currentPrice]);

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  // 포커스 잃을 때 호가 단위에 맞게 자동 올림
  const handleBidAmountBlur = () => {
    const rounded = roundUpToValidBid(bidAmount, currentPrice);
    if (rounded !== bidAmount) {
      alert(`호가 단위(₩${increment.toLocaleString()})에 맞게 ₩${rounded.toLocaleString()}으로 자동 조정됩니다.`);
      setBidAmount(rounded);
    }
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

  const handleSubmit = async () => {
    if (!user) return alert("로그인이 필요합니다!");

    if (isAutoBid && maxBidAmount < minBid) {
      return alert(`최대 입찰가는 최소 ₩${minBid.toLocaleString()} 이상이어야 합니다.`);
    }
    if (!isAutoBid && bidAmount < minBid) {
      const adj = roundUpToValidBid(bidAmount, currentPrice);
      setBidAmount(adj);
      return alert(`최소 입찰가는 ₩${minBid.toLocaleString()} 입니다.`);
    }

    setLoading(true);
    try {
      const result = await callBidAPI(
        isAutoBid
          ? { isAutoBid: true, maxBidAmount }
          : { amount: bidAmount }
      );
      if (!result) return;

      if (!result.ok || result.error) {
        alert(result.error || '입찰 처리 중 오류가 발생했습니다.');
      } else if (result.message) {
        alert(result.message);
        router.refresh();
      } else {
        new Audio('/sounds/bid-sound.mp3').play().catch(() => {});
        alert(isAutoBid ? '자동 입찰 예약 완료! 🤖' : '입찰 성공! 🎉');
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
      {/* 자동 입찰 토글 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
        <div>
          <p className="text-sm font-black text-gray-700 dark:text-gray-300">🤖 자동 입찰 모드</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">최대금액 한도 내 자동 응찰</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAutoBid(v => !v)}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
            isAutoBid ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            isAutoBid ? 'translate-x-8' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* 입찰 금액 입력 */}
      {isAutoBid ? (
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">내가 낼 수 있는 최대 금액</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₩</span>
            <input
              type="number"
              value={maxBidAmount}
              onChange={e => setMaxBidAmount(Number(e.target.value))}
              className="w-full border-2 border-gray-100 dark:border-gray-700 p-5 pl-12 rounded-2xl outline-none focus:border-blue-500 font-black text-2xl text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 pl-1">
            최소 예약가: ₩{minBid.toLocaleString()} | 호가: ₩{increment.toLocaleString()}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 pl-1">💡 경쟁자 등장 시 최저가로 자동 응찰됩니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₩</span>
            <input
              type="number"
              value={bidAmount}
              onChange={e => setBidAmount(Number(e.target.value))}
              onBlur={handleBidAmountBlur}
              className="w-full border-2 border-gray-100 dark:border-gray-700 p-5 pl-12 rounded-2xl outline-none focus:border-blue-500 font-black text-2xl text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 pl-1">
            최소 입찰가: ₩{minBid.toLocaleString()} | 호가: ₩{increment.toLocaleString()}
          </p>
        </div>
      )}

      {/* 입찰 제출 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full p-6 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '처리 중...' : isAutoBid ? '자동 입찰 예약하기 🤖' : '지금 입찰하기 🔨'}
      </button>

      {/* 즉시 구매 버튼 (판매자가 설정한 경우에만 표시) */}
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