export default function CreateItem() {
  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <h2 className="text-3xl font-bold mb-8">내 물건 경매 올리기 📦</h2>
      
      <form className="flex flex-col gap-6">
        {/* 1. 사진 등록 영역 (나중에 Supabase Storage와 연결할 곳!) */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500 hover:bg-gray-50 transition cursor-pointer">
          📸 클릭해서 물건 사진을 업로드하세요 (기능 준비 중)
        </div>

        {/* 2. 상품 이름 */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">상품 이름</label>
          <input 
            type="text" 
            placeholder="예: 전설의 대왕 가물치 낚시대" 
            className="border p-3 rounded-lg focus:outline-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
          />
        </div>

        {/* 3. 시작 가격 */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">경매 시작가 (원)</label>
          <input 
            type="number" 
            placeholder="예: 10000" 
            className="border p-3 rounded-lg focus:outline-blue-500 focus:ring-2 focus:ring-blue-200 transition" 
          />
        </div>

        {/* 4. 상세 설명 */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-gray-700">상세 설명</label>
          <textarea 
            rows={5} 
            placeholder="물건의 상태나 사연을 매력적으로 적어주세요!" 
            className="border p-3 rounded-lg focus:outline-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          ></textarea>
        </div>

        {/* 5. 제출 버튼 */}
        <button 
          type="button" 
          className="bg-blue-600 text-white font-bold text-lg p-4 rounded-lg hover:bg-blue-800 transition shadow-md mt-4"
        >
          경매 시작하기 🚀
        </button>
      </form>
    </div>
  );
}