'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function SortSelect({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextSort = e.target.value;
    
    // 기존의 검색어나 카테고리 주소를 유지하면서 정렬 기준만 바꿉니다.
    const params = new URLSearchParams(searchParams?.toString());
    params.set('sort', nextSort);
    
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-black text-gray-400 uppercase">정렬 기준:</span>
      <select 
        name="sort" 
        value={currentSort}
        onChange={handleSortChange} // 🌟 defaultValue → value: URL 변경 시 select 값이 올바르게 반영됨
        className="bg-white border-2 border-gray-100 font-bold text-gray-700 py-2 px-4 rounded-xl outline-none cursor-pointer hover:border-blue-500 transition-colors"
      >
        <option value="newest">최신 등록순 ✨</option>
        <option value="closing">마감 임박순 ⏳</option>
        <option value="bids">입찰 많은순 🔥</option>
        <option value="price_low">현재가 낮은순 📉</option>
        <option value="price_high">현재가 높은순 📈</option>
      </select>
    </div>
  );
}