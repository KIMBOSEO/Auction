import { supabase } from "@/lib/supabase";
import ItemCard from "../components/ItemCard";
import SortSelect from "../components/SortSelect"; 

export const revalidate = 0; // 실시간 데이터 유지

interface Props {
  searchParams: Promise<{ query?: string; category?: string; sort?: string; status?: string }>;
}

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const category = searchParams?.category || "전체";
  const sort = searchParams?.sort || "newest";
  const status = searchParams?.status || 'ongoing'; // 'ongoing' | 'completed'

  const now = new Date().toISOString();

  // 1. 기본 쿼리 설정: 탭 상태(status)에 따라 마감 필터
  let supabaseQuery: any;
  if (status === 'ongoing') {
    supabaseQuery = supabase.from('items').select('*').gt('end_at', now);
  } else {
    supabaseQuery = supabase.from('items').select('*').lte('end_at', now);
  }

  // 2. 카테고리 & 검색어 필터링
  if (category && category !== "전체") {
    supabaseQuery = supabaseQuery.eq("category", category);
  }
  if (query) {
    supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,user_nickname.ilike.%${query}%`);
  }

  // 3. 정렬 조건 분기
  switch (sort) {
    case "closing":
      supabaseQuery = supabaseQuery.order("end_at", { ascending: true });
      break;
    case "price_low":
      supabaseQuery = supabaseQuery.order("price", { ascending: true });
      break;
    case "price_high":
      supabaseQuery = supabaseQuery.order("price", { ascending: false });
      break;
    case "bids":
      supabaseQuery = supabaseQuery.order("bids", { ascending: false });
      break;
    case "newest":
    default:
      supabaseQuery = supabaseQuery.order("created_at", { ascending: false });
      break;
  }

  const { data: items } = await supabaseQuery;
  const categories = ["전체", "희귀카드", "전자기기", "스포츠/레저", "패션/잡화", "취미", "기타"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 dark:bg-gray-950 transition-colors duration-200">
      
      {/* 검색 및 카테고리 헤더 */}
      <div className="mb-12 space-y-8 text-center">
        <h1 className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-2 tracking-tighter">GA-MUL-CHI</h1>
        <p className="text-gray-400 dark:text-gray-500 font-medium font-mono uppercase tracking-widest text-xs">Real-time Auction Platform</p>
        
        {/* 검색 폼 내부 상태 유지 보정 */}
        <form action="/" method="get" className="relative max-w-2xl mx-auto mt-8">
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="status" value={status} /> {/* 🌟 검색 시에도 탭 상태 고정 */}
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="어떤 보물을 낚으러 오셨나요?"
            className="w-full p-6 pl-14 rounded-[2rem] border-2 border-gray-100 dark:border-gray-700 shadow-xl outline-none focus:border-blue-500 transition-all text-lg bg-gray-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-800 dark:text-white"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all">
            검색
          </button>
        </form>

        {/* 🌟 [1번 요구사항] 경매 진행 중 / 완료 상태 탭 디자인 (절대 안 깨지게 배치) */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex rounded-2xl bg-gray-100 dark:bg-gray-900 p-1.5 shadow-inner border dark:border-gray-800">
            <a 
              href={`/?status=ongoing&category=${category}${query ? `&query=${query}` : ''}&sort=${sort}`} 
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${status === 'ongoing' ? 'bg-blue-600 text-white shadow-md scale-102' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              경매 진행 중 🔥
            </a>
            <a 
              href={`/?status=completed&category=${category}${query ? `&query=${query}` : ''}&sort=${sort}`} 
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${status === 'completed' ? 'bg-gray-800 dark:bg-gray-700 text-white shadow-md scale-102' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              경매 완료 ⏳
            </a>
          </div>
        </div>

        {/* 카테고리 필터 라인 */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {categories.map((cat) => (
            <a
              key={cat}
              /* 🌟 주소창에 status 유실을 방지하도록 싹 다 연결 */
              href={`/?status=${status}&category=${cat}${query ? `&query=${query}` : ""}&sort=${sort}`}
              className={`px-5 py-2.5 rounded-full text-xs font-black transition-all border ${
                category === cat
                  ? "bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg border-transparent"
                  : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* 정렬 및 현황 출력 바 */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-gray-100 dark:border-gray-800 pb-4 flex-wrap gap-4">
        <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white">
          {status === 'ongoing' ? '실시간 경매장' : '과거 낙찰 기록실'} 
          <span className="text-blue-600 dark:text-blue-400 ml-2">{items?.length || 0}</span>
        </h2>
        
        <SortSelect currentSort={sort} />
      </div>

      {/* 아이템 리스트 출력 */}
      {!items || items.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
          <span className="text-6xl mb-4 block">🎣</span>
          <p className="text-xl font-bold text-gray-400 dark:text-gray-500">조건에 맞는 가물치가 없습니다.</p>
          <a href={`/?status=${status}`} className="text-blue-600 dark:text-blue-400 underline mt-4 inline-block font-bold">전체 필터 초기화</a>
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