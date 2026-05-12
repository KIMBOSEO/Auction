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

  const categories = ["전자기기", "스포츠/레저", "패션/잡화", "취미", "희귀카드", "기타"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("제목과 가격은 필수입니다!");

    setLoading(true);
    let imageUrl = '';

    if (file) {
      // 🌟 핵심: 한글 파일명을 안전한 이름으로 변환 (타임스탬프 + 확장자만 유지)
      const fileExt = file.name.split('.').pop();
      const safeFileName = `${Date.now()}.${fileExt}`; 

      const { data, error: uploadError } = await supabase.storage
        .from('item_images')
        .upload(safeFileName, file);

      if (uploadError) {
        alert("이미지 저장 실패: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('item_images')
        .getPublicUrl(safeFileName);
      
      imageUrl = publicUrl;
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
      alert("성공적으로 등록되었습니다! 🚀");
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 my-10 bg-white rounded-[2.5rem] shadow-xl border border-gray-50">
      <h2 className="text-3xl font-black mb-10 text-center">경매 물건 등록 📦</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="font-black text-gray-700 ml-1">물건 사진</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-2 border-dashed p-10 rounded-3xl text-sm bg-gray-50 hover:bg-gray-100 transition cursor-pointer" />
          <p className="text-xs text-gray-400 px-2">* 한글 파일명도 이제 안전하게 변환되어 저장됩니다!</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <label className="font-black text-gray-700 ml-1">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl bg-white outline-none font-bold">
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-3">
            <label className="font-black text-gray-700 ml-1">상품명</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl outline-none font-bold" placeholder="상품명" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl outline-none" placeholder="시작가" />
          <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl bg-white font-bold">
            <option value="1">1시간</option><option value="24">24시간</option><option value="168">7일</option>
          </select>
        </div>

        <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="border-2 border-gray-100 p-5 rounded-3xl outline-none" placeholder="상세 설명"></textarea>
        
        <button type="submit" disabled={loading} className="font-black text-2xl p-6 rounded-[2rem] text-white bg-blue-600 hover:bg-blue-700 shadow-2xl transition active:scale-95">
          {loading ? "보물 등록 중..." : "경매 시작하기 🚀"}
        </button>
      </form>
    </div>
  );
}