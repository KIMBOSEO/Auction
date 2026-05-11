import Link from 'next/link';

export default function ItemCard({ item }: { item: any }) {
  return (
    <Link href={`/items/${item.id}`} className="block"> {/* 이 부분이 추가/수정됨! */}
      <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="aspect-video bg-gray-200 flex items-center justify-center text-gray-500">
          이미지 준비 중
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500 mb-3">현재가: <span className="text-blue-600 font-semibold">{item.price.toLocaleString()}원</span></p>
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>입찰 {item.bids}건</span>
            <span className="bg-red-50 text-red-500 px-2 py-1 rounded">2시간 남음</span>
          </div>
        </div>
      </div>
    </Link>
  );
}