import { supabase } from "@/lib/supabase"; // 또는 "../../../lib/supabase" (경로 확인!)
import { notFound } from "next/navigation";
import BidForm from "@/components/BidForm"; // 또는 "../../../components/BidForm"

export const revalidate = 0;

// Next.js 15의 비동기 params 대응을 포함한 풀 코드입니다.
export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  
  // 1. 주소창의 id를 안전하게 기다려서(await) 가져옵니다.
  const { id } = await params;

  // 2. Supabase에서 해당 물건의 정보를 가져옵니다.
  const { data: item, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  // 3. 물건이 없거나 에러가 나면 404 페이지로 보냅니다.
  if (error || !item) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* 왼쪽: 이미지 영역 */}
        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden border shadow-inner">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <span className="text-6xl block mb-2">🐟</span>
              <p className="text-sm text-gray-400 font-medium">이미지 준비 중</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 상세 정보 및 입찰 영역 */}
        <div className="flex flex-col justify-center">
          <div className="mb-6">
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Auction Active
            </span>
            <h2 className="text-4xl font-extrabold mt-4 text-gray-900 tracking-tight">
              {item.title}
            </h2>
          </div>

          {/* 가격 정보 창 */}
          <div className="bg-gray-50 p-7 rounded-2xl mb-8 border border-gray-100">
            <p className="text-gray-500 font-medium mb-1">현재 최고 입찰가</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-blue-600">
                {item.price.toLocaleString()}
              </span>
              <span className="text-2xl font-bold text-blue-600">원</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              현재 {item.bids}명이 경쟁 중입니다
            </div>
          </div>
          
          {/* 🌟 핵심 포인트: 입찰 폼 컴포넌트 연결 🌟 */}
          <BidForm itemId={item.id} currentPrice={item.price} />

          <p className="text-center text-xs text-gray-400 mt-6">
            입찰은 취소할 수 없으니 신중하게 결정해주세요! 🔨
          </p>
        </div>

      </div>
    </div>
  );
}