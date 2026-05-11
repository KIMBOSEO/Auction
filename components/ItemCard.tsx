import Link from 'next/link';

interface Item {
  id: string;
  title: string;
  price: number;
  bids: number;
  image_url?: string;
}

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Link href={`/items/${item.id}`} className="group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        
        {/* 1. 이미지 영역 */}
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🐟
            </div>
          )}
          
          {/* ✨ 실시간 애니메이션 뱃지 (이미지 위에 둥둥) */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* 2. 정보 영역 */}
        <div className="p-5">
          <h3 className="font-bold text-gray-800 text-lg mb-1 truncate group-hover:text-blue-600 transition-colors">
            {item.title}
          </h3>
          
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-blue-600">
                {item.price.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-blue-600">원</span>
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-gray-400 font-medium">
                입찰 {item.bids}건
              </span>
              <span className="text-xs font-bold text-blue-500 group-hover:underline">
                입찰하러 가기 →
              </span>
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}