'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SettlementTabProps {
  userId: string;
}

export default function SettlementTab({ userId }: SettlementTabProps) {
  const [completedItems, setCompletedItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kakaoLink, setKakaoLink] = useState('');
  const [lastKakaoUpdate, setLastKakaoUpdate] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    fetchCompletedItems();
    fetchKakaoLink();
  }, [userId]);

  const fetchCompletedItems = async () => {
    setLoading(true);
    const now = new Date().toISOString();

    // 사용자가 판매한 물건 중 경매가 종료된 것
    const { data: soldItems } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .lt('end_at', now)
      .order('end_at', { ascending: false });

    // 사용자가 구매한 물건 (최고가 입찰)
    const { data: bidData } = await supabase
      .from('bids')
      .select('item_id, amount')
      .eq('user_email', (await supabase.auth.getUser()).data.user?.email)
      .order('amount', { ascending: false });

    if (bidData) {
      const highestBidsByItem = new Map();
      for (const bid of bidData) {
        if (!highestBidsByItem.has(bid.item_id)) {
          highestBidsByItem.set(bid.item_id, bid);
        }
      }

      const { data: purchasedItems } = await supabase
        .from('items')
        .select('*')
        .in('id', Array.from(highestBidsByItem.keys()))
        .lt('end_at', now);

      setCompletedItems([...(soldItems || []), ...(purchasedItems || [])]);
    } else {
      setCompletedItems(soldItems || []);
    }

    setLoading(false);
  };

  const fetchKakaoLink = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('kakao_link, last_kakao_update')
      .eq('id', userId)
      .single();

    if (data) {
      setKakaoLink(data.kakao_link || '');
      setLastKakaoUpdate(data.last_kakao_update);
    }
  };

  const handleKakaoLinkUpdate = async () => {
    if (!kakaoLink.trim()) return alert('카카오톡 오픈프로필 링크를 입력하세요!');

    // 🌟 하루 1회만 변경 가능
    if (lastKakaoUpdate) {
      const lastUpdate = new Date(lastKakaoUpdate);
      const now = new Date();
      const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (diffHours < 24) {
        const remainingHours = Math.ceil(24 - diffHours);
        return alert(`⏰ 카카오톡 링크는 하루에 1회만 변경 가능합니다. ${remainingHours}시간 후에 다시 시도해주세요.`);
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        kakao_link: kakaoLink.trim(),
        last_kakao_update: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      alert('카카오톡 링크가 저장되었습니다! ✨');
      setLastKakaoUpdate(new Date().toISOString());
    }
  };

  const handleSubmitReview = async (targetUserId: string, isSellerReview: boolean) => {
    if (reviewData.rating === 0 || !reviewData.comment.trim()) {
      return alert('평점과 평가 내용을 모두 입력해주세요!');
    }

    const { error } = await supabase
      .from('reviews')
      .insert([{
        reviewer_id: userId,
        reviewed_user_id: targetUserId,
        rating: reviewData.rating,
        comment: reviewData.comment.trim(),
        type: isSellerReview ? 'seller' : 'buyer',
        created_at: new Date().toISOString()
      }]);

    if (error) {
      alert('평가 저장 실패: ' + error.message);
    } else {
      alert('평가가 저장되었습니다! 감사합니다. ⭐');
      setSelectedItem(null);
      setReviewData({ rating: 5, comment: '' });
      fetchCompletedItems();
    }
  };

  return (
    <div className="space-y-6">
      {/* 카카오톡 링크 설정 */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-black text-lg mb-4 dark:text-white">🔗 안전 거래 연락처</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          경매 낙찰 후 구매자에게 카카오톡 링크를 통해 안전하게 연락할 수 있습니다. (하루 1회만 변경 가능)
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={kakaoLink}
            onChange={(e) => setKakaoLink(e.target.value)}
            placeholder="카카오톡 오픈프로필 링크 (예: https://open.kakao.com/...)"
            className="flex-1 border-2 border-gray-100 dark:border-gray-700 p-3 rounded-xl outline-none focus:border-blue-500 font-medium dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={handleKakaoLinkUpdate}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition"
          >
            저장
          </button>
        </div>
        {lastKakaoUpdate && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            마지막 수정: {new Date(lastKakaoUpdate).toLocaleString('ko-KR')}
          </p>
        )}
      </div>

      {/* 낙찰 목록 */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-black text-lg mb-4 dark:text-white">📦 거래 완료 물건</h3>
        
        {loading ? (
          <p className="text-center text-gray-400 py-8">로드 중...</p>
        ) : completedItems.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">아직 완료된 거래가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedItems.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex gap-3">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.end_at).toLocaleDateString('ko-KR')}
                    </p>
                    <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                      ₩{item.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 리뷰 작성 모달 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full space-y-4">
            <h3 className="font-black text-lg dark:text-white">거래 평가</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedItem.user_id === userId
                ? `구매자 "${selectedItem.user_nickname}"님의 거래를 평가해주세요`
                : `판매자 "${selectedItem.user_nickname}"님의 거래를 평가해주세요`}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-gray-600 dark:text-gray-400 mb-2">
                  평점 (1-5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-3xl transition ${
                        star <= reviewData.rating ? '⭐' : '☆'
                      }`}
                    >
                      {star <= reviewData.rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 dark:text-gray-400 mb-2">
                  평가 내용
                </label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="거래 경험을 자세히 공유해주세요"
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none h-20"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSubmitReview(
                  selectedItem.user_id,
                  selectedItem.user_id === userId
                )}
                className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                평가 제출
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
