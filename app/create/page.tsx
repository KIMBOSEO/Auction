'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateItem() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [instantlyBuyPrice, setInstantlyBuyPrice] = useState('');  // 즉시 구매가 (선택)
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('기타');
  const [duration, setDuration] = useState('24');
  const [files, setFiles] = useState<File[]>([]); // 🌟 단일 -> 배열로 변경
  const [previews, setPreviews] = useState<string[]>([]); // 🌟 미리보기 URL
  const [loading, setLoading] = useState(false);
  const [userNickname, setUserNickname] = useState('');
  const router = useRouter();

  const categories = ["희귀카드"];

  useEffect(() => {
    const checkUserAndNickname = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요한 서비스입니다! 🎣");
        router.push('/login');
        return;
      }
      
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

  // 🌟 다중 이미지 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > 10) {
      alert("최대 10장까지만 업로드 가능합니다!");
      return;
    }

    setFiles([...files, ...selectedFiles]);

    // 미리보기 생성
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) return alert("제목과 시작가를 입력해주세요!");
    if (files.length === 0) return alert("최소 1장의 사진을 업로드해주세요!");

    const confirmMsg = "⚠️ 등록 전 꼭 확인하세요!\n1. 시작가는 이후에 수정이 불가능합니다.\n2. 사진 순서는 변경할 수 없습니다.\n정말 등록하시겠습니까?";
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    const imageUrls: string[] = [];

    // 🌟 모든 이미지 업로드
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const safeFileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('item_images').upload(safeFileName, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('item_images').getPublicUrl(safeFileName);
        imageUrls.push(publicUrl);
      }
    }

    const endAt = new Date();
    endAt.setHours(endAt.getHours() + Number(duration));

    const { data: { user } } = await supabase.auth.getUser();
    
    // 즉시 구매가 유효성 검사
    if (instantlyBuyPrice && Number(instantlyBuyPrice) <= Number(price)) {
      setLoading(false);
      return alert('즉시 구매가는 시작가보다 높아야 합니다.');
    }

    const { error } = await supabase.from('items').insert([{ 
      title, 
      price: Number(price), 
      instantly_buy_price: instantlyBuyPrice ? Number(instantlyBuyPrice) : null,
      description, 
      category,
      image_url: imageUrls[0], // 대표 이미지 (첫 번째)
      image_urls: imageUrls, // 🌟 모든 이미지 저장
      end_at: endAt.toISOString(), 
      user_id: user?.id, 
      user_nickname: userNickname, 
      bids: 0 
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
    <div className="max-w-2xl mx-auto p-6 my-10 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-gray-800">
      <h2 className="text-3xl font-black mb-10 text-center dark:text-white">보물 등록하기 📦</h2>

      {/* 🌟 법적 고지문 */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
        <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
          ⚠️ <strong>법적 고지:</strong> 본 서비스는 경매 중개 플랫폼으로서 경매 과정 및 최종 결과에 대해 어떠한 민형사상 책임도 지지 않으며, 모든 거래는 개인 간의 책임 하에 진행됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* 🌟 다중 이미지 업로드 */}
        <div className="flex flex-col gap-3">
          <label className="font-black text-gray-700 dark:text-gray-300 ml-1">물건 사진 (최대 10장)</label>
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleFileChange} 
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer block text-center">
              <span className="text-3xl block mb-2">📸</span>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                클릭하여 이미지 선택 (여러 장 가능)
              </span>
            </label>
          </div>

          {/* 이미지 미리보기 */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img src={preview} alt={`preview-${index}`} className="w-full h-24 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}/{previews.length}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <label className="font-black text-gray-700 dark:text-gray-300 ml-1">카테고리</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="border-2 border-gray-100 dark:border-gray-700 p-4 rounded-2xl bg-white dark:bg-gray-800 dark:text-white outline-none font-bold"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-3">
            <label className="font-black text-gray-700 dark:text-gray-300 ml-1">경매 기간</label>
            <select 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)} 
              className="border-2 border-gray-100 dark:border-gray-700 p-4 rounded-2xl bg-white dark:bg-gray-800 dark:text-white outline-none font-bold"
            >
              <option value="1">1시간</option>
              <option value="6">6시간</option>
              <option value="12">12시간</option>
              <option value="24">24시간</option>
              <option value="48">48시간</option>
              <option value="72">72시간</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-black text-gray-700 dark:text-gray-300 ml-1">물건 제목</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="어떤 보물인가요?" 
            className="border-2 border-gray-100 dark:border-gray-700 p-4 rounded-2xl bg-white dark:bg-gray-800 dark:text-white outline-none font-bold focus:border-blue-500" 
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-black text-gray-700 dark:text-gray-300 ml-1">시작가</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">₩</span>
            <input 
              type="number" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="0" 
              className="w-full border-2 border-gray-100 dark:border-gray-700 p-4 pl-12 rounded-2xl bg-white dark:bg-gray-800 dark:text-white outline-none font-black text-2xl focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-black text-gray-700 dark:text-gray-300 ml-1">
            즉시 구매가 <span className="text-xs font-normal text-gray-400">(선택 — 미설정 시 자동 비활성화)</span>
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">₩</span>
            <input
              type="number"
              value={instantlyBuyPrice}
              onChange={(e) => setInstantlyBuyPrice(e.target.value)}
              placeholder="시작가보다 높은 금액"
              className="w-full border-2 border-gray-100 dark:border-gray-700 p-4 pl-12 rounded-2xl bg-white dark:bg-gray-800 dark:text-white outline-none font-black text-2xl focus:border-green-500"
            />
          </div>
          {instantlyBuyPrice && Number(instantlyBuyPrice) > 0 && Number(instantlyBuyPrice) <= Number(price) && (
            <p className="text-xs text-red-500 pl-1">⚠️ 즉시 구매가는 시작가보다 높아야 합니다.</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <label className="font-black text-gray-700 dark:text-gray-300 ml-1">설명</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="물건의 상태, 특징 등을 자세히 설명해주세요." 
            className="border-2 border-gray-100 dark:border-gray-700 p-4 rounded-2xl bg-white dark:bg-gray-800 dark:text-white outline-none font-medium h-40 resize-none focus:border-blue-500" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full p-6 rounded-2xl font-black text-xl transition-all active:scale-95 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "등록 중..." : "지금 등록하기 🚀"}
        </button>
      </form>
    </div>
  );
}
//             <label className="font-black text-gray-700 ml-1">상품명</label>
//             <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl outline-none font-bold" placeholder="상품명" />
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-6">
//           <div className="flex flex-col gap-3">
//             <label className="font-black text-gray-700 ml-1 italic text-red-400">시작가 (수정불가)</label>
//             <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl outline-none" placeholder="1,000" />
//           </div>
//           <div className="flex flex-col gap-3">
//             <label className="font-black text-gray-700 ml-1">경매 기간</label>
//             <select value={duration} onChange={(e) => setDuration(e.target.value)} className="border-2 border-gray-100 p-4 rounded-2xl bg-white font-bold">
//               <option value="1">1시간</option><option value="24">24시간</option><option value="168">7일</option><option value="0.05">3분</option>
//             </select>
//           </div>
//         </div>

//         <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="border-2 border-gray-100 p-5 rounded-3xl outline-none" placeholder="상세 설명"></textarea>
        
//         <button type="submit" disabled={loading} className="font-black text-2xl p-6 rounded-[2rem] text-white bg-blue-600 hover:bg-blue-700 shadow-2xl transition active:scale-95">
//           {loading ? "보물 검수 중..." : "경매 시작하기 🚀"}
//         </button>
//       </form>
//     </div>
//   );
// }