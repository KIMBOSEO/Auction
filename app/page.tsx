import { supabase } from "@/lib/supabase";
import ItemCard from "../components/ItemCard";

export const revalidate = 0; // 항상 최신 데이터 유지

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string; sort?: string }>;
}) {
  const { query, category, sort = "newest" } = await searchParams; // 기본 정렬: 최신순
  const now = new Date().toISOString();

  // 1. 기본 쿼리: 살아있는 아이템만
  let supabaseQuery = supabase.from("items").select("*").gt("end_at", now);

  // 2. 카테고리 & 검색어 필터 적용
  if (category && category !== "전체") {
    supabaseQuery = supabaseQuery.eq("category", category);
  }
  if (query) {
    supabaseQuery = supabaseQuery.ilike("title", `%${query}%`);
  }

  // 3. 🌟 정렬 로직 적용
  switch (sort) {
    case "closing": // 마감 임박순 (end_at이 현재와 가장 가까운 순)
      supabaseQuery = supabaseQuery.order("end_at", { ascending: true });
      break;
    case "price_low": // 현재가 낮은순
      supabaseQuery = supabaseQuery.order("price", { ascending: true });
      break;
    case "price_high": // 현재가 높은순
      supabaseQuery = supabaseQuery.order("price", { ascending: false });
      break;
    case "bids": // 입찰 많은순 (인기순)
      supabaseQuery = supabaseQuery.order("bids", { ascending: false });
      break;
    case "newest": // 최신 등록순 (기본)
    default:
      supabaseQuery = supabaseQuery.order("created_at", { ascending: false });
      break;
  }

  // 데이터 가져오기
  const { data: items, error } = await supabaseQuery;

  // 카테고리 배열
  const categories = ["전체", "전자기기", "스포츠/레저", "패션/잡화", "취미", "희귀카드", "기타"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* 🌟 헤더 및 검색/필터 영역 */}
      <div className="mb-12 space-y-6 text-center">
        <h1 className="text-5xl font-black text-blue-600 mb-2 tracking-tighter drop-shadow-sm">GA-MUL-CHI</h1>
        <p className="text-gray-400 font-medium font-mono uppercase tracking-widest text-xs">Real-time Auction Platform</p>
        
        <form action="/" method="get" className="relative max-w-2xl mx-auto mt-8">
          <input type="hidden" name="category" value={category || ""} />
          <input type="hidden" name="sort" value={sort} />
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="어떤 보물을 낚으러 오셨나요?"
            className="w-full p-6 pl-14 rounded-[2rem] border-2 border-gray-100 shadow-xl outline-none focus:border-blue-500 transition-all text-lg bg-gray-50 focus:bg-white"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95">
            검색
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/?category=${cat}${query ? `&query=${query}` : ""}&sort=${sort}`}
              className={`px-8 py-3 rounded-full font-black transition-all ${
                (category === cat || (!category && cat === "전체"))
                  ? "bg-gray-800 text-white shadow-lg scale-105"
                  : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* 🌟 정렬 콤보박스 영역 */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-800">
          실시간 경매장 <span className="text-blue-600 ml-2">{items?.length || 0}</span>
        </h2>
        
        <form action="/" method="get" className="flex items-center gap-2">
          <input type="hidden" name="category" value={category || ""} />
          <input type="hidden" name="query" value={query || ""} />
          <span className="text-xs font-bold text-gray-400 uppercase">정렬 기준:</span>
          <select 
            name="sort" 
            defaultValue={sort} 
            onChange={(e) => e.target.form?.submit()} // 선택 시 자동 제출
            className="bg-white border-2 border-gray-100 font-bold text-gray-700 py-2 px-4 rounded-xl outline-none cursor-pointer hover:border-blue-500 transition-colors"
          >
            <option value="newest">최신 등록순 ✨</option>
            <option value="closing">마감 임박순 ⏳</option>
            <option value="bids">입찰 많은순 🔥</option>
            <option value="price_low">현재가 낮은순 📉</option>
            <option value="price_high">현재가 높은순 📈</option>
          </select>
        </form>
      </div>

      {/* 아이템 그리드 */}
      {!items || items.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <span className="text-6xl mb-4 block">🎣</span>
          <p className="text-xl font-bold text-gray-400">조건에 맞는 가물치가 없습니다.</p>
          <a href="/" className="text-blue-600 underline mt-4 inline-block font-bold">초기화하기</a>
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