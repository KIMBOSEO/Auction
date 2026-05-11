import { supabase } from "@/lib/supabase";
import ItemCard from "../components/ItemCard";

export const revalidate = 0;

export default async function Home() {
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500">에러 발생: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">진행 중인 경매 🔥</h2>
          <p className="text-gray-500 text-sm md:text-base mt-1">지금 바로 입찰해보세요!</p>
        </div>
      </div>
      
      {!items || items.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed">
          <span className="text-4xl mb-4 block">텅!</span>
          <p className="text-gray-500">아직 등록된 경매가 없습니다.</p>
        </div>
      ) : (
        /* 핵심: 모바일 1열, 태블릿 2열, 데스크탑 3~4열로 자동 조절 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}