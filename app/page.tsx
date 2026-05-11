import { supabase } from "@/lib/supabase";
import ItemCard from "../components/ItemCard";

// 항상 최신 데이터를 가져오도록 설정
export const revalidate = 0; 

export default async function Home() {
  // 1. Supabase의 'items' 테이블에서 데이터를 가져옵니다.
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .order('id', { ascending: false });

  // 에러가 났을 때 화면
  if (error) {
    return <div className="p-10 text-red-500">데이터를 불러오는 중 에러가 발생했습니다: {error.message}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">진행 중인 경매 🎣</h2>
      
      {/* 2. 데이터가 없을 때와 있을 때 화면 다르게 보여주기 */}
      {!items || items.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-xl">
          아직 등록된 경매 물건이 없네요. <br/> 
          가장 먼저 물건을 올려보시겠어요? 😊
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}