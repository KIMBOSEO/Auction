'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  user_email?: string;
  user_nickname?: string;
  message: string;
  created_at: string;
  is_system?: boolean;
}

// 🌟 item 객체 자체를 통째로 넘겨받아 판매자(seller) 정보를 확실하게 인지하게 합니다.
export default function ChatRoom({ itemId, userEmail, item }: { itemId: string; userEmail?: string; item: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [myNickname, setMyNickname] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 판매자의 이메일 위치 확보 (단일 호환성 포함)
  const sellerEmail = item?.user_email || item?.email; 

  useEffect(() => {
    if (!itemId) return;

    // 1. 내 닉네임 정보 받아오기
    const getMyNickname = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
        if (data?.nickname) setMyNickname(data.nickname);
      }
    };
    getMyNickname();

    // 2. 기존 채팅 데이터 로드
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    // 3. 실시간 채널 구독
    const channel = supabase
      .channel(`room-${itemId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `item_id=eq.${itemId}` }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `item_id=eq.${itemId}` },
        (payload) => {
          const newBid = payload.new;
          const systemMsg: Message = {
            id: `system-${newBid.id}`,
            message: `📢 [입찰 공지] ${newBid.user_nickname || '누군가'}님이 ₩${newBid.amount.toLocaleString()}원에 입찰하셨습니다! 🔥`,
            created_at: newBid.created_at,
            is_system: true
          };
          setMessages((prev) => [...prev, systemMsg]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [itemId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userEmail) return;

    const { error } = await supabase.from('messages').insert([{
      item_id: itemId,
      user_email: userEmail,
      user_nickname: myNickname || userEmail.split('@')[0],
      message: input.trim()
    }]);

    if (!error) setInput('');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-sm flex flex-col h-[500px] w-full">
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">실시간 경매 중계방 💬</h3>
      
      {/* 메시지 뷰어 구역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin">
        {messages.map((msg) => {
          if (msg.is_system) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="bg-blue-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-md inline-block">
                  {msg.message}
                </span>
              </div>
            );
          }

          // 🌟 [6번 요구사항 검증 완료] 판매자(업로더) 이메일과 비교하여 위치 정렬
          const isSeller = msg.user_email && sellerEmail && msg.user_email === sellerEmail;
          
          return (
            <div key={msg.id} className={`flex flex-col ${isSeller ? 'items-start' : 'items-end'}`}>
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] text-gray-400 font-bold">
                  {msg.user_nickname || msg.user_email?.split('@')[0]}
                </span>
                {isSeller && (
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                    판매자 👑
                  </span>
                )}
              </div>
              <div className={`p-4 rounded-[1.5rem] max-w-[85%] text-sm font-medium shadow-sm break-all ${
                isSeller 
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700' 
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* 대화 입력 폼 */}
      {userEmail ? (
        <form onSubmit={sendMessage} className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border-2 border-gray-100 dark:border-gray-700 focus-within:border-blue-500 transition-all">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="경매장 사람들과 대화해보세요!"
            className="flex-1 px-3 py-2 outline-none text-sm font-bold text-gray-700 dark:text-gray-200 bg-transparent"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-black transition-all">
            전송
          </button>
        </form>
      ) : (
        <div className="text-center text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
          로그인 후 실시간 채팅에 참여할 수 있습니다. 🔒
        </div>
      )}
    </div>
  );
}