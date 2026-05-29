import Link from 'next/link';
import LikeButton from './LikeButton';

export default function ItemCard({ item }: { item: any }) {
  const isEnded = item.end_at && new Date(item.end_at) <= new Date();
  return (
    <Link href={`/items/${item.id}`} className="group">
      <div className={`bg-white rounded-[1.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative ${isEnded ? 'filter blur-sm opacity-80' : ''}`}>
        
        {/* 📸 이미지 컨테이너: 1:1 비율 고정 */}
        <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100">🐟</div>
          )}
          
          {/* 카테고리 뱃지 */}
          <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-blue-600 shadow-sm">
            {item.category || '기타'}
          </div>

          {isEnded && (
            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md">경매 마감</div>
          )}
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-gray-800 text-base truncate flex-1">{item.title}</h3>
            <LikeButton itemId={item.id} />
          </div>
          
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-gray-900">{item.price.toLocaleString()}</span>
            <span className="text-xs font-bold text-gray-900">원</span>
          </div>

          <div className="mt-4 flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
            <span>입찰 {item.bids || 0}회</span>
            <span className="text-blue-500 group-hover:underline">상세보기 →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}