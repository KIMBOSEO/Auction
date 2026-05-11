export default function ItemDetail({ params }: { params: { id: string } }) {
  // 나중에는 params.id 를 가지고 Supabase에서 진짜 데이터를 불러올 거예요!
  const itemId = params.id;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 왼쪽: 이미지 영역 */}
        <div className="aspect-square bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 text-xl font-bold">
          물건 ID: {itemId} 번 이미지
        </div>

        {/* 오른쪽: 정보 및 입찰 영역 */}
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-4">여기에 물건 이름이 들어갑니다</h2>
          <div className="border-t border-b py-4 my-4">
            <p className="text-gray-500 mb-2">현재 최고 입찰가</p>
            <p className="text-4xl font-bold text-blue-600">45,000원</p>
          </div>
          
          <div className="space-y-4 mt-4">
            <input 
              type="number" 
              placeholder="입찰할 금액을 입력하세요" 
              className="w-full border p-3 rounded-lg"
            />
            <button className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition">
              입찰하기 🔨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}