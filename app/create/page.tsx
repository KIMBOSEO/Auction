'use client';

import { useState, useEffect } from 'react';
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
  const [userNickname, setUserNickname] = useState('');
  const router = useRouter();

  //const categories = ["전자기기", "스포츠/레저", "패션/잡화", "취미", "희귀카드", "기타"];
  const categories = ["희귀카드"];

  useEffect(() => {
    const checkUserAndNickname = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요한 서비스입니다! 🎣");
        router.push('/login');
        return;
      }
      
      // 🌟 닉네임이 있는지 검사
      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
      if (!profile?.nickname) {
        alert("🔒 개인정보 보호를 위해 마이페이지에서 먼저 '닉네임'을 설정해주세요!");
        router.push('/mypage');
      } else {
        setUserNickname(profile.nickname);
      }
    };
    checkUserAndNickname();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("제목과 시작가를 입력해주세요!");

    const confirmMsg = "⚠️ 등록 전 꼭 확인하세요!\n1. 시작가는 이후에 수정이 불가능합니다.\n2. 사진은 변경할 수 없습니다.\n정말 등록하시겠습니까?";
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    let imageUrl = '';

    if (file) {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('item_images').upload(safeFileName, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('item_images').getPublicUrl(safeFileName);
        imageUrl = publicUrl;
      }
    }

    const endAt = new Date();
    endAt.setHours(endAt.getHours() + Number(duration));

    const { data: { user } } = await supabase.auth.getUser();
    
    // 🌟 데이터 등록 시 user_nickname 함께 저장
    const { error } = await supabase.from('items').insert([{ 
      title, price: Number(price), description, category,
      image_url: imageUrl, end_at: endAt.toISOString(), 
      user_id: user?.id, user_nickname: userNickname, bids: 0 
    }]);

    if (error) alert("등록 실패: " + error.message);
    else {
      alert("성공적으로 등록되었습니다! 🚀");
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 my-10 bg-white rounded-[2.5rem] shadow-xl border border-gray-50">
      <h2 className="text-3xl font-black mb-10 text-center">보물 등록하기 📦</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="font-black text-gray-700 ml-1">물건 사진</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border-2 border-dashed p-10 rounded-3xl text-sm bg-gray-50 hover:bg-gray-100 transition cursor-pointer" />
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
          <div className="flex flex-col gap-3">
            <label className="font-black text-gray-700 ml-1 italic text-red-400">시작가 (수정불가)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl outline-none" placeholder="1,000" />
          </div>
          <div className="flex flex-col gap-3">
            <label className="font-black text-gray-700 ml-1">경매 기간</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl bg-white font-bold">
              <option value="1">1시간</option><option value="24">24시간</option><option value="168">7일</option><option value="0.004167">15초</option><option value="0.05">Test</option>
            </select>
          </div>
        </div>

        <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="border-2 border-gray-100 p-5 rounded-3xl outline-none" placeholder="상세 설명"></textarea>
        
        <button type="submit" disabled={loading} className="font-black text-2xl p-6 rounded-[2rem] text-white bg-blue-600 hover:bg-blue-700 shadow-2xl transition active:scale-95">
          {loading ? "보물 검수 중..." : "경매 시작하기 🚀"}
        </button>
      </form>
    </div>
  );
}