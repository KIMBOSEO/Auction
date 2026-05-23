'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FollowButtonProps {
  sellerId: string;
  sellerNickname: string;
}

export default function FollowButton({ sellerId, sellerNickname }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkFollowStatus = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser && currentUser.id !== sellerId) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', sellerId)
          .single();

        setIsFollowing(!!data);
      }
    };

    checkFollowStatus();
  }, [sellerId]);

  const handleToggleFollow = async () => {
    if (!user) {
      alert('로그인이 필요합니다!');
      return;
    }

    if (user.id === sellerId) {
      alert('본인을 팔로우할 수 없습니다.');
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // 팔로우 해제
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', sellerId);
        setIsFollowing(false);
      } else {
        // 팔로우
        await supabase
          .from('follows')
          .insert([{
            follower_id: user.id,
            following_id: sellerId,
            created_at: new Date().toISOString()
          }]);
        setIsFollowing(true);
      }
    } catch (error) {
      alert('팔로우 처리 중 오류가 발생했습니다.');
    }

    setLoading(false);
  };

  if (!user || user.id === sellerId) return null;

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-xl font-bold transition ${
        isFollowing
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      } disabled:opacity-50`}
    >
      {loading ? '처리 중...' : isFollowing ? '✓ 팔로우 중' : '+ 팔로우'}
    </button>
  );
}
