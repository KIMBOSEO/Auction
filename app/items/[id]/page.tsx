import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import BidForm from "@/components/BidForm";
import ChatRoom from "@/components/ChatRoom"; // 채팅방 추가!

export const revalidate = 0;

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. 유저 세션 확인 (서버사이드)
  const { data: { user } } = await supabase.auth.getUser();

  // 2. 아이템 정보 가져오기
  const { data: item, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !item) return notFound();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 왼쪽 & 중앙: 물건 정보 (2칸 차지) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🐟</div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
            <h2 className="text-3xl font-black mb-4">{item.title}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        {/* 오른쪽: 입찰 및 채팅 (1칸 차지) */}
        <div className="space-y-6">
          {/* 입찰 영역 */}
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-sm">
            <p className="text-blue-600 font-bold mb-2">현재 최고가</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-blue-600">{item.price.toLocaleString()}</span>
              <span className="text-xl font-bold text-blue-600">원</span>
            </div>
            <BidForm itemId={item.id} currentPrice={item.price} />
          </div>

          {/* 실시간 채팅방 🌟 */}
          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>

      </div>
    </div>
  );
}