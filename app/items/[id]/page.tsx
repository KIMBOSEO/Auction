'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound, useParams, useRouter } from 'next/navigation';
import BidForm from "@/components/BidForm";
import ChatRoom from "@/components/ChatRoom";
import Timer from "@/components/Timer";
import BidHistory from "@/components/BidHistory";

export default function ItemDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [item, setItem] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
      if (error || !data) console.error("로드 실패");
      else {
        setItem(data);
        setEditDesc(data.description);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase.channel(`item-${id}`).on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, 
      (payload) => setItem(payload.new)
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleUpdate = async () => {
    const { error } = await supabase.from('items').update({ description: editDesc }).eq('id', id);
    if (error) alert("수정 실패");
    else {
      alert("설명이 수정되었습니다!");
      setIsEditing(false);
      router.refresh();
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-blue-600">가물치 로딩 중...</div>;
  if (!item) return notFound();

  const isEnded = new Date(item.end_at) < new Date();
  const isOwner = user?.id === item.user_id;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* 왼쪽: 이미지 영역 (해상도 최적화) */}
        <div className="xl:col-span-2 space-y-8">
          <div className="aspect-[4/3] bg-gray-900 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl relative">
            {isEnded && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                <span className="text-white text-5xl font-black border-8 border-white px-10 py-5 rotate-[-10deg]">SOLD OUT</span>
              </div>
            )}
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl bg-gray-200">🐟</div>
            )}
          </div>
          
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50">
            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block">{item.category}</span>
            <h2 className="text-4xl font-black text-gray-900 mb-6">{item.title}</h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full p-5 border-2 border-blue-100 rounded-2xl outline-none h-40 font-medium" />
                <div className="flex gap-2">
                  <button onClick={handleUpdate} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">저장하기</button>
                  <button onClick={() => setIsEditing(false)} className="bg-gray-100 px-6 py-3 rounded-xl font-bold">취소</button>
                </div>
              </div>
            ) : (
              <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            )}
          </div>
        </div>

        {/* 오른쪽: 제어 박스 (수정/입찰 분기) */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border-2 border-blue-600 shadow-2xl relative">
            <div className="mb-8">
              <p className="text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">경매 남은 시간</p>
              <Timer targetDate={item.end_at} />
            </div>

            <div className="mb-8">
              <p className="text-blue-600 font-bold mb-1">현재 최고가</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-blue-600 tracking-tighter">{item.price.toLocaleString()}</span>
                <span className="text-xl font-bold text-blue-600">원</span>
              </div>
            </div>
            
            {isOwner ? (
              <div className="space-y-3">
                <p className="text-xs text-center font-bold text-gray-400 mb-4">본인이 등록한 상품입니다</p>
                <button onClick={() => setIsEditing(true)} className="w-full p-5 bg-gray-800 text-white rounded-[1.5rem] font-black text-lg hover:bg-black transition-all">설명 수정하기</button>
                <button className="w-full p-5 bg-indigo-50 text-indigo-600 rounded-[1.5rem] font-black text-lg cursor-not-allowed">기간 연장 (유료 상품 준비 중)</button>
              </div>
            ) : !isEnded ? (
              <BidForm itemId={item.id} currentPrice={item.price} />
            ) : (
              <div className="bg-gray-100 p-6 rounded-2xl text-center font-black text-gray-400 text-xl">경매 종료</div>
            )}
          </div>
          <BidHistory itemId={item.id} />
        </div>

        <div className="xl:col-span-1">
          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>
      </div>
    </div>
  );
}