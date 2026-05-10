import { getServerSession } from "next-auth";

export default async function MyPage() {
  const session = await getServerSession();

  if (!session) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">마이페이지</h1>
      <div className="mt-5 border p-5 rounded-lg">
        <img src={session.user?.image || ""} alt="프로필" className="w-20 h-20 rounded-full" />
        <p className="mt-4">이름: {session.user?.name}</p>
        <p>이메일: {session.user?.email}</p>
      </div>
    </div>
  );
}