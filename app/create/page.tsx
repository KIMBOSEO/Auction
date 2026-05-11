'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateItem() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null); // 파일 상태 추가
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("제목과 가격은 필수입니다!");

    setLoading(true);
    let imageUrl = '';

    // 1. 이미지가 있다면 Storage에 먼저 업로드
    if (file) {
      const fileName = `${Date.now()}_${file.name}`; // 파일명 중복 방지
      const { data, error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);

      if (uploadError) {
        alert("이미지 업로드 실패: " + uploadError.message);
        setLoading(false);
        return;
      }

      // 2. 업로드된 이미지의 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);
      
      imageUrl = publicUrl;
    }

    // 3. DB에 데이터 저장 (이미지 URL 포함)
    const { error } = await supabase
      .from('items')
      .insert([{ 
        title, 
        price: Number(price), 
        description, 
        image_url: imageUrl, // URL 저장!
        bids: 0 
      }]);

    if (error) {
      alert("등록 실패: " + error.message);
    } else {
      alert("이미지가 포함된 경매가 시작되었습니다! 🎣");
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <h2 className="text-3xl font-bold mb-8">내 물건 경매 올리기 📦</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 이미지 선택 칸 */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold">물건 사진</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border p-2 rounded-lg"
          />
        </div>

        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="상품 이름" className="border p-3 rounded-lg" />
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="경매 시작가" className="border p-3 rounded-lg" />
        <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상세 설명" className="border p-3 rounded-lg"></textarea>

        <button type="submit" disabled={loading} className={`font-bold p-4 rounded-lg text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-800'}`}>
          {loading ? "이미지 올리는 중..." : "경매 시작하기 🚀"}
        </button>
      </form>
    </div>
  );
}