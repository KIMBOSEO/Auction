'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ItemCard from '@/components/ItemCard';
import SettlementTab from '@/components/SettlementTab';

type TabType = 'uploaded' | 'history' | 'liked' | 'bidding' | 'settlement';

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('uploaded');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [ongoingAuctionCount, setOngoingAuctionCount] = useState(0); // 🌟 진행 중인 경매 개수
  const router = useRouter();

  const fetchMyData = async (tab: TabType) => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { router.push('/login'); return; }
    setUser(currentUser);

    // 프로필(닉네임) 가져오기
    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', currentUser.id).single();
    if (profile?.nickname) setNickname(profile.nickname);

    // 🌟 진행 중인 경매 개수 확인 (닉네임 변경 제약용)
    const now = new Date().toISOString();
    const { data: ongoingData, count: ongoingCount } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .gt('end_at', now);
    setOngoingAuctionCount(ongoingCount || 0);

    // 🌟 settlement 탭은 특별 처리
    if (tab === 'settlement') {
      setLoading(false);
      return;
    }

    let query = supabase.from('items').select('*');

    if (tab === 'uploaded') query = query.eq('user_id', currentUser.id).gt('end_at', now);
    else if (tab === 'history') query = query.eq('user_id', currentUser.id).lt('end_at', now);
    else if (tab === 'liked') {
      const { data: likedData } = await supabase.from('likes').select('item_id').eq('user_id', currentUser.id);
      query = query.in('id', likedData?.map(d => d.item_id) || []);
    } else if (tab === 'bidding') {
      const { data: bidData } = await supabase.from('bids').select('item_id').eq('user_email', currentUser.email);
      const itemIds = Array.from(new Set(bidData?.map(d => d.item_id) || []));
      query = query.in('id', itemIds).gt('end_at', now);
    }

    const { data } = await query.order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMyData(activeTab); }, [activeTab]);

  // 🌟 닉네임 저장 함수 (진행 중인 경매가 있으면 변경 불가)
  const handleSaveNickname = async () => {
    if (!nickname.trim()) return alert("닉네임을 입력해주세요!");
    
    // 🌟 진행 중인 경매가 있으면 변경 불가
    if (ongoingAuctionCount > 0) {
      return alert(`⚠️ 안전 거래를 위해 진행 중인 경매 물건(${ongoingAuctionCount}개)이 있을 때는 닉네임을 변경할 수 없습니다. 모든 경매가 종료된 후 변경해주세요!`);
    }

    setUpdating(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, nickname: nickname.trim(), updated_at: new Date().toISOString() });

    if (error) {
      if (error.message.includes('unique')) alert("이미 존재하는 닉네임입니다! 🤔");
      else alert("저장 실패: " + error.message);
    } else {
      alert("닉네임이 설정되었습니다! 이제 안전하게 경매를 즐기세요. ✨");
      window.location.reload();
    }
    setUpdating(false);
  };

  if (!user && loading) return <div className="p-20 text-center font-black">가물치 창고 여는 중... 🎣</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      {/* 🌟 개인정보 보호를 위한 닉네임 설정 섹션 */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl border border-blue-50 dark:border-gray-800 mb-10">
        {/* 진행 중인 경매가 있을 때 경고 */}
        {ongoingAuctionCount > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <p className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
              ⚠️ 현재 진행 중인 경매 물건이 {ongoingAuctionCount}개 있습니다. 모든 경매가 종료될 때까지 닉네임 변경이 제한됩니다.
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg text-white">👤</div>
            <div className="flex-1">
              <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">개인정보 보호 닉네임</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="경매장에 표시될 닉네임"
                  disabled={ongoingAuctionCount > 0}
                  className="border-2 border-gray-100 dark:border-gray-700 px-4 py-2 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-700 dark:text-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  onClick={handleSaveNickname}
                  disabled={updating || ongoingAuctionCount > 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title={ongoingAuctionCount > 0 ? "진행 중인 경매가 있을 때는 변경할 수 없습니다" : ""}
                >
                  {updating ? '변경 중...' : '변경'}
                </button>
              </div>
            </div>
          </div>
          <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="px-5 py-2 rounded-xl text-red-400 border border-red-50 dark:border-red-900/50 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition">로그아웃</button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex flex-wrap gap-3 mb-10 bg-gray-100 dark:bg-gray-800 p-2 rounded-[2rem] w-fit">
        {[
          { id: 'uploaded', label: '진행 중' },
          { id: 'history', label: '판매 기록' },
          { id: 'liked', label: '관심 상품' },
          { id: 'bidding', label: '입찰 현황' },
          { id: 'settlement', label: '최종 낙찰' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`px-6 py-3 rounded-2xl font-black transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'}`}>{tab.label}</button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      {activeTab === 'settlement' ? (
        user && <SettlementTab userId={user.id} />
      ) : (
        <>
          {/* 아이템 그리드 */}
          {loading ? (
            <div className="py-20 text-center font-bold text-gray-300 dark:text-gray-600">목록을 불러오고 있어요...</div>
          ) : items.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-[3rem] py-32 text-center text-gray-400 dark:text-gray-500 font-bold">비어있습니다. 🎣</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}