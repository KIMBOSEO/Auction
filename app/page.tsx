import { supabase } from "@/lib/supabase";
import ItemCard from "../components/ItemCard";

export const revalidate = 0;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string }>;
}) {
  const { query, category } = await searchParams;

  // 1. 기본 쿼리 시작
  let supabaseQuery = supabase.from("items").select("*").order("created_at", { ascending: false });

  // 2. 카테고리 필터 적용
  if (category && category !== "전체") {
    supabaseQuery = supabaseQuery.eq("category", category);
  }

  // 3. 검색어 필터 적용
  if (query) {
    supabaseQuery = supabaseQuery.ilike("title", `%${query}%`);
  }

  const { data: items, error } = await supabaseQuery;

  const categories = ["전체", "전자기기", "스포츠/레저", "패션/잡화", "취미", "기타"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* 검색 및 카테고리 영역 */}
      <div className="mb-12 space-y-6">
        <form action="/" method="get" className="relative max-w-2xl mx-auto">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="어떤 보물을 찾으시나요?"
            className="w-full p-5 pl-14 rounded-3xl border-2 border-gray-100 shadow-xl outline-none focus:border-blue-500 transition-all text-lg"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
        </form>

        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/?category=${cat}${query ? `&query=${query}` : ""}`}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                (category === cat || (!category && cat === "전체"))
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-gray-500 border hover:bg-gray-50"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* 아이템 그리드 */}
      {!items || items.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <span className="text-6xl mb-4 block">🔍</span>
          <p className="text-xl font-bold text-gray-400">검색 결과가 없습니다.</p>
          <a href="/" className="text-blue-600 underline mt-2 inline-block font-bold">전체 보기</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}