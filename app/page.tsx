import { supabase } from "@/lib/supabase";
import ItemCard from "../components/ItemCard";

export const revalidate = 0; // 매번 새로운 데이터를 가져오도록 설정

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string }>;
}) {
  const { query, category } = await searchParams;
  const now = new Date().toISOString(); // 현재 시간을 ISO 형식으로 가져옴

  // 1. 기본 쿼리: 마감 시간이 현재 시간보다 큰(남은) 것만 필터링 ( .gt = Greater Than )
  let supabaseQuery = supabase
    .from("items")
    .select("*")
    .gt("end_at", now) 
    .order("created_at", { ascending: false });

  // 2. 카테고리 필터 적용
  if (category && category !== "전체") {
    supabaseQuery = supabaseQuery.eq("category", category);
  }

  // 3. 검색어 필터 적용
  if (query) {
    supabaseQuery = supabaseQuery.ilike("title", `%${query}%`);
  }

  const { data: items, error } = await supabaseQuery;

  const categories = ["전체", "전자기기", "스포츠/레저", "패션/잡화", "취미", "희귀카드", "기타"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* 상단 검색 및 필터 영역 */}
      <div className="mb-12 space-y-6 text-center">
        <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tighter">GA-MUL-CHI</h1>
        <p className="text-gray-400 font-medium font-mono uppercase tracking-widest text-xs">Real-time Auction Platform</p>
        
        <form action="/" method="get" className="relative max-w-2xl mx-auto mt-8">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="사라진 가물치를 대신할 보물을 찾으세요"
            className="w-full p-6 pl-14 rounded-[2rem] border-2 border-gray-100 shadow-2xl outline-none focus:border-blue-500 transition-all text-lg"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </form>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/?category=${cat}${query ? `&query=${query}` : ""}`}
              className={`px-8 py-3 rounded-full font-black transition-all ${
                (category === cat || (!category && cat === "전체"))
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105"
                  : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* 아이템 그리드 */}
      {!items || items.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <span className="text-6xl mb-4 block">🎣</span>
          <p className="text-xl font-bold text-gray-400">현재 참여 가능한 경매가 없습니다.</p>
          <a href="/" className="text-blue-600 underline mt-4 inline-block font-bold">새로고침</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}