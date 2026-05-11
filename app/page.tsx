import ItemCard from "../components/ItemCard";

const MOCK_ITEMS = [
  { id: 1, title: "갓 잡은 대왕 가물치", price: 45000, bids: 12 },
  { id: 2, title: "황금 낚시찌 세트", price: 15000, bids: 5 },
  { id: 3, title: "고급 민물낚시 의자", price: 89000, bids: 8 },
  { id: 4, title: "전설의 낚시꾼 모자", price: 5000, bids: 20 },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">진행 중인 경매 🎣</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {MOCK_ITEMS.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}