import { supabase } from "@/lib/supabase";
import ItemCard from "../components/ItemCard";
import SortSelect from "../components/SortSelect"; // 🌟 새로 만든 컴포넌트 불러오기

export const revalidate = 0; // 실시간 데이터 유지

interface Props {
  // Next.js 15+: searchParams는 반드시 await 해야 하는 Promise
  searchParams: Promise<{ query?: string; category?: string; sort?: string }>;
}

export default async function Home(props: Props) {
  // 🌟 BUG FIX: Next.js 15+에서 searchParams는 Promise이므로 await 필요
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const category = searchParams?.category || "전체";
  const sort = searchParams?.sort || "newest";
  const status = searchParams?.status || 'ongoing'; // 'ongoing' | 'completed'

  const now = new Date().toISOString();

  // 1. 기본 쿼리 설정: 탭 상태에 따라 필터
  let supabaseQuery: any;
  if (status === 'ongoing') supabaseQuery = supabase.from('items').select('*').gt('end_at', now);
  else supabaseQuery = supabase.from('items').select('*').lte('end_at', now);

  // 2. 카테고리 & 검색어 필터링
  if (category && category !== "전체") {
    supabaseQuery = supabaseQuery.eq("category", category);
  }
  if (query) {
    // 🌟 제목 또는 판매자 닉네임으로 검색 가능하도록 OR 조건 추가
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
  //const categories = ["전체", "전자기기", "스포츠/레저", "패션/잡화", "취미", "희귀카드", "기타"];
  const categories = ["희귀카드"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      {/* 검색 및 카테고리 헤더 */}
      <div className="mb-12 space-y-6 text-center">
        <h1 className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-2 tracking-tighter">GA-MUL-CHI</h1>
        <p className="text-gray-400 dark:text-gray-500 font-medium font-mono uppercase tracking-widest text-xs">Real-time Auction Platform</p>
        
        <form action="/" method="get" className="relative max-w-2xl mx-auto mt-8">
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="sort" value={sort} />
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

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <div className="absolute left-0 top-full mt-4 w-full flex justify-center">
            <div className="inline-flex rounded-2xl bg-white/60 p-1 shadow-sm">
              <a href={`/?status=ongoing&category=${category}${query ? `&query=${query}` : ''}&sort=${sort}`} className={`px-6 py-2 rounded-xl font-black ${status === 'ongoing' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>경매 진행 중</a>
              <a href={`/?status=completed&category=${category}${query ? `&query=${query}` : ''}&sort=${sort}`} className={`px-6 py-2 rounded-xl font-black ${status === 'completed' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>경매 완료</a>
            </div>
          </div>
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/?category=${cat}${query ? `&query=${query}` : ""}&sort=${sort}`}
              className={`px-8 py-3 rounded-full font-black transition-all ${
                category === cat
                  ? "bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>

      {/* 정렬 바 영역 */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-gray-100 dark:border-gray-800 pb-4">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">
          실시간 경매장 <span className="text-blue-600 dark:text-blue-400 ml-2">{items?.length || 0}</span>
        </h2>
        
        {/* 🌟 에러 메이커였던 form 대신 깔끔하게 분리된 클라이언트 컴포넌트 배치 */}
        <SortSelect currentSort={sort} />
      </div>

      {/* 아이템 리스트 */}
      {!items || items.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
          <span className="text-6xl mb-4 block">🎣</span>
          <p className="text-xl font-bold text-gray-400 dark:text-gray-500">조건에 맞는 가물치가 없습니다.</p>
          <a href="/" className="text-blue-600 dark:text-blue-400 underline mt-4 inline-block font-bold">초기화하기</a>
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