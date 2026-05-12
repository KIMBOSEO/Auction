'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateItem() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('24'); // 기본 24시간
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("제목과 가격은 필수입니다!");

    setLoading(true);
    let imageUrl = '';

    // 1. 이미지 업로드 로직
    if (file) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    // 2. 마감 시간 계산 (현재 시간 + 선택한 시간)
    const endAt = new Date();
    endAt.setHours(endAt.getHours() + Number(duration));

    // 3. DB 저장
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('items')
      .insert([{ 
        title, 
        price: Number(price), 
        description, 
        image_url: imageUrl,
        end_at: endAt.toISOString(), // 마감 시간 저장!
        user_id: user?.id,
        bids: 0 
      }]);

    if (error) {
      alert("등록 실패: " + error.message);
    } else {
      alert("경매가 시작되었습니다! 🎣");
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <h2 className="text-3xl font-black mb-8">새 경매 만들기 📦</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-700">물건 사진</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-2 border-dashed p-4 rounded-xl text-sm" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-700">상품명</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="상품 이름을 입력하세요" className="border p-4 rounded-xl outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">시작가 (원)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="10,000" className="border p-4 rounded-xl outline-none focus:border-blue-500" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">경매 기간</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border p-4 rounded-xl outline-none focus:border-blue-500 bg-white">
              <option value="1">1시간</option>
              <option value="12">12시간</option>
              <option value="24">24시간(1일)</option>
              <option value="48">48시간(2일)</option>
              <option value="168">168시간(7일)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-700">상세 설명</label>
          <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="물건에 대한 설명을 적어주세요" className="border p-4 rounded-xl outline-none focus:border-blue-500"></textarea>
        </div>

        <button type="submit" disabled={loading} className={`font-black text-xl p-5 rounded-2xl text-white shadow-lg transition ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}>
          {loading ? "가물치 방류 중..." : "경매 시작하기 🚀"}
        </button>
      </form>
    </div>
  );
}