'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  user_id: string; // 🌟 ID 비교를 위해 반드시 필요한 사양
  user_email?: string;
  user_nickname?: string;
  message: string;
  created_at: string;
}

export default function ChatRoom({ itemId, userEmail, item }: { itemId: string; userEmail?: string; item: any }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [myId, setMyId] = useState('');
  const [myNickname, setMyNickname] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemId) return;

    const getMyProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyId(user.id); // 🌟 내 고유 식별 ID 임베딩
        const { data } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
        if (data?.nickname) setMyNickname(data.nickname);
      }
    };
    getMyProfile();

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    // 실시간 채팅 채널 리스너
    const channel = supabase
      .channel(`room-messages-${itemId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `item_id=eq.${itemId}` }, 
        (payload) => {
          setMessages((prev) => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
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
    if (!input.trim() || !userEmail || !myId) return;

    const { error } = await supabase.from('messages').insert([{
      item_id: itemId,
      user_id: myId, // 🌟 인서트 시 내 고유 식별 ID 투척!
      user_email: userEmail,
      user_nickname: myNickname || userEmail.split('@')[0],
      message: input.trim()
    }]);

    if (!error) setInput('');
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-4 flex flex-col h-[480px] w-full overflow-hidden shadow-sm">
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 px-1">실시간 경매 중계방 💬</h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3 scrollbar-none">
        {messages.map((msg) => {
          -- 🌟 [4번 제안 완벽 구현] 메세지 작성자 ID와 상품 등록자 ID가 같으면 무조건 "판매자(왼쪽)"
          const isSeller = msg.user_id === item?.user_id;
          
          return (
            <div key={msg.id} className={`flex flex-col w-full ${isSeller ? 'items-start' : 'items-end'}`}>
              <div className="flex items-center gap-1.5 mb-0.5 px-1">
                <span className="text-[10px] text-gray-400 font-bold">
                  {msg.user_nickname}
                </span>
                {isSeller ? (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm">판매자 👑</span>
                ) : (
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded-md">구매자 🎣</span>
                )}
              </div>
              
              <div className={`p-3 rounded-[1.25rem] max-w-[85%] text-xs font-semibold shadow-xs break-all ${
                isSeller 
                  ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700' 
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {userEmail ? (
        <form onSubmit={sendMessage} className="w-full flex items-center gap-1.5 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner box-border">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="경매장 사람들과 대화해보세요!"
            className="flex-1 min-w-0 px-2 py-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 bg-transparent outline-none border-none"
          />
          <button type="submit" className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all">전송</button>
        </form>
      ) : (
        <div className="text-center text-[11px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">로그인 후 참여 가능합니다.</div>
      )}
    </div>
  );
}