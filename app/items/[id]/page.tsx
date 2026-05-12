import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import BidForm from "@/components/BidForm";
import ChatRoom from "@/components/ChatRoom";
import Timer from "@/components/Timer"; // 타이머 컴포넌트 추가 예정

export const revalidate = 0;

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { user } } = await supabase.auth.getUser();
  const { data: item, error } = await supabase.from('items').select('*').eq('id', id).single();

  if (error || !item) return notFound();

  // 경매 종료 여부 확인
  const isEnded = new Date(item.end_at) < new Date();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video bg-gray-100 rounded-3xl overflow-hidden border relative">
            {isEnded && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <span className="text-white text-4xl font-black border-4 border-white px-8 py-4 rotate-[-10deg]">경매 종료</span>
              </div>
            )}
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🐟</div>
            )}
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-50">
            <h2 className="text-3xl font-black mb-4">{item.title}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border-2 border-blue-600 shadow-xl">
            {/* 타이머 컴포넌트 호출 */}
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-400 mb-1">남은 시간</p>
              <Timer targetDate={item.end_at} />
            </div>

            <p className="text-blue-600 font-bold mb-1">현재 최고가</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-black text-blue-600">{item.price.toLocaleString()}</span>
              <span className="text-xl font-bold text-blue-600">원</span>
            </div>
            
            {/* 경매 종료 시 입찰 폼 숨기기 */}
            {!isEnded ? (
              <BidForm itemId={item.id} currentPrice={item.price} />
            ) : (
              <div className="bg-gray-100 p-4 rounded-xl text-center font-bold text-gray-500">
                종료된 경매입니다.
              </div>
            )}
          </div>

          <ChatRoom itemId={item.id} userEmail={user?.email} />
        </div>
      </div>
    </div>
  );
}