'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LikeButton({ itemId }: { itemId: string }) {
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLike = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('likes').select('*').eq('user_id', user.id).eq('item_id', itemId).single();
        setIsLiked(!!data);
      }
      setLoading(false);
    };
    checkLike();
  }, [itemId]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다!");

    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('item_id', itemId);
      setIsLiked(false);
    } else {
      await supabase.from('likes').insert([{ user_id: user.id, item_id: itemId }]);
      setIsLiked(true);
    }
  };

  if (loading) return null;

  return (
    <button onClick={toggleLike} className="transition-transform active:scale-125">
      <span className={`text-2xl ${isLiked ? 'text-red-500' : 'text-gray-300 hover:text-red-300'}`}>
        {isLiked ? '❤️' : '🤍'}
      </span>
    </button>
  );
}