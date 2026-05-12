'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateItem() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('기타');
  const [duration, setDuration] = useState('24');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const categories = ["전자기기", "스포츠/레저", "패션/잡화", "취미", "기타"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("제목과 가격은 필수입니다!");

    setLoading(true);
    let imageUrl = '';

    if (file) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage.from('item-images').upload(fileName, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    const endAt = new Date();
    endAt.setHours(endAt.getHours() + Number(duration));

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('items').insert([{ 
      title, price: Number(price), description, category,
      image_url: imageUrl, end_at: endAt.toISOString(), user_id: user?.id, bids: 0 
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
      <h2 className="text-3xl font-black mb-8">새 보물 등록하기 📦</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-2 border-dashed p-6 rounded-2xl text-sm" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border p-4 rounded-xl bg-white outline-none focus:border-blue-500">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700">상품명</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-4 rounded-xl outline-none" placeholder="상품명" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="border p-4 rounded-xl" placeholder="시작가" />
          <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border p-4 rounded-xl bg-white">
            <option value="1">1시간</option><option value="24">24시간</option><option value="168">7일</option>
          </select>
        </div>

        <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="border p-4 rounded-xl" placeholder="상세 설명"></textarea>
        
        <button type="submit" disabled={loading} className="font-black text-xl p-5 rounded-2xl text-white bg-blue-600 hover:bg-blue-700 transition">
          {loading ? "보물 검수 중..." : "경매 시작하기 🚀"}
        </button>
      </form>
    </div>
  );
}