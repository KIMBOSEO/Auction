'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // 경로가 다르면 ../lib/supabase 로 수정
import { useRouter } from 'next/navigation';

export default function CreateItem() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 페이지 새로고침 방지
    
    if (!title || !price) {
      alert("제목과 시작가를 입력해주세요!");
      return;
    }

    setLoading(true);

    // 1. Supabase에 데이터 한 줄 넣기 (insert)
    const { error } = await supabase
      .from('items')
      .insert([
        { 
          title, 
          price: Number(price), 
          description,
          bids: 0 
        }
      ]);

    if (error) {
      alert("등록 실패: " + error.message);
    } else {
      alert("경매 물건이 등록되었습니다! 🎣");
      router.push('/'); // 메인 페이지로 이동
      router.refresh(); // 데이터 새로고침
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <h2 className="text-3xl font-bold mb-8">내 물건 경매 올리기 📦</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">상품 이름</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 전설의 대왕 가물치 낚시대" 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">경매 시작가 (원)</label>
          <input 
            type="number" 
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="예: 10000" 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">상세 설명</label>
          <textarea 
            rows={5} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="물건의 상태를 적어주세요!" 
            className="border p-3 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`font-bold text-lg p-4 rounded-lg transition shadow-md mt-4 text-white
            ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-800'}`}
        >
          {loading ? "등록 중..." : "경매 시작하기 🚀"}
        </button>
      </form>
    </div>
  );
}