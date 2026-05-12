import Link from 'next/link';
import LikeButton from './LikeButton';

export default function ItemCard({ item }: { item: any }) {
  return (
    <Link href={`/items/${item.id}`} className="group">
      <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 relative">
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐟</div>
          )}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-blue-600 shadow-sm uppercase tracking-tighter">
            {item.category || '기타'}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-black text-gray-800 text-lg truncate flex-1 pr-2">{item.title}</h3>
            <LikeButton itemId={item.id} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-600">{item.price.toLocaleString()}</span>
            <span className="text-sm font-bold text-blue-600">원</span>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Bids {item.bids}</span>
            <span className="text-xs font-black text-blue-500 group-hover:translate-x-1 transition-transform">BID NOW →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}