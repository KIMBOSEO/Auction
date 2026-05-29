'use client';

import Link from 'next/link';

// 메인 페이지에서 정의한 AuctionItem 규격과 싱크 맞춤
interface AuctionItem {
  id: string;
  title: string;
  price: number;
  category: string;
  image_url: string;
  image_urls?: string[];
  end_at: string;
  user_nickname: string;
  bids: number;
}

export default function ItemCard({ item }: { item: AuctionItem }) {
  // 경매 마감 여부 확인 변수
  const isEnded = new Date(item.end_at) < new Date();

  return (
    <Link href={`/items/${item.id}`} className="group block w-full">
      <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-4 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full relative overflow-hidden">
        
        {/* 🖼️ 이미지 컨테이너 구역 */}
        <div className="relative aspect-square w-full bg-gray-50 dark:bg-gray-950 rounded-[1.5rem] overflow-hidden mb-4 flex items-center justify-center">
          
          {/* 🌟 [요구사항 완벽 반영] 블러 필터 관련 tailwind 속성을 전면 박멸했습니다! */}
          <img
            src={item.image_urls?.[0] || item.image_url || "/api/placeholder/400/400"}
            alt={item.title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />

          {/* 🎨 마감 뱃지 레이어 (선명한 이미지 위에 우측 상단 뱃지만 세련되게 부착) */}
          {isEnded ? (
            <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-md uppercase tracking-wider">
              SOLD OUT ⏳
            </div>
          ) : (
            <div className="absolute top-3 right-3 z-10 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-md uppercase tracking-wider">
              BIDDING 🔥
            </div>
          )}

          {/* 카테고리 태그 왼쪽 상단 부착 */}
          <span className="absolute top-3 left-3 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs text-[10px] font-black text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
            {item.category}
          </span>
        </div>

        {/* 📝 상품 메타 텍스트 구역 */}
        <div className="flex-1 flex flex-col justify-between px-1">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors break-all">
              {item.title}
            </h3>
            <p className="text-[11px] font-bold text-gray-400 mb-3 flex items-center gap-1">
              👤 {item.user_nickname || '보물 사냥꾼'}
            </p>
          </div>

          <div className="border-t border-gray-50 dark:border-gray-800 pt-3 mt-1 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">현재 최고가</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400 tracking-tight">
                {item.price.toLocaleString()}<span className="text-xs ml-0.5 font-bold">원</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-gray-100 dark:border-gray-800">
                🔨 입찰 {item.bids || 0}회
              </span>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}