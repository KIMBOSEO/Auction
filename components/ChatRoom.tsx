'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  user_email?: string;
  user_nickname?: string;
  message: string;
  created_at: string;
  is_system?: boolean; // 시스템 메시지 구분을 위한 속성
}

export default function ChatRoom({ itemId, userEmail }: { itemId: string; userEmail?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [myNickname, setMyNickname] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemId) return;

    // 1. 내 닉네임 정보 미리 긁어오기
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

    // 3. 🌟 실시간 채널 통합 관리 (유저 채팅 + 입찰 시스템 중계)
    const channel = supabase
      .channel(`room-${itemId}`)
      // (A) 유저가 보내는 실시간 일반 메시지 구독
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `item_id=eq.${itemId}` }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      // (B) 🌟 실시간 입찰(bids) 발생 시 채팅창에 즉시 공지 메시지 인젝션!
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

  // 스크롤 항상 하단 유지
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userEmail) return;

    const { error } = await supabase.from('messages').insert([{
      item_id: itemId,
      user_email: userEmail,
      user_nickname: myNickname || userEmail.split('@')[0], // 닉네임 우선 적용
      message: input.trim()
    }]);

    if (!error) setInput('');
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4">실시간 경매 중계방 💬</h3>
      
      {/* 메시지 출력창 */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
        {messages.map((msg) => {
          if (msg.is_system) {
            // 📢 시스템 중계 메시지 UI 디자인
            return (
              <div key={msg.id} className="text-center my-3 animate-bounce">
                <span className="bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-md inline-block">
                  {msg.message}
                </span>
              </div>
            );
          }

          // 일반 유저 채팅 UI 디자인
          const isMe = msg.user_email === userEmail;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-400 font-bold mb-1 px-1">
                {msg.user_nickname || msg.user_email?.split('@')[0]}
              </span>
              <div className={`p-4 rounded-[1.5rem] max-w-[80%] text-sm font-medium shadow-sm ${
                isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* 입력창 (로그인 한 사람만 활성화) */}
      {userEmail ? (
        <form onSubmit={sendMessage} className="flex gap-2 bg-white p-2 rounded-2xl border-2 border-gray-100 focus-within:border-blue-500 transition-all">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="경매장 사람들과 대화해보세요!"
            className="flex-1 px-3 py-2 outline-none text-sm font-bold text-gray-700 bg-transparent"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-black transition-all">
            전송
          </button>
        </form>
      ) : (
        <div className="text-center text-xs font-bold text-gray-400 bg-gray-100 p-4 rounded-xl">
          로그인 후 실시간 채팅에 참여할 수 있습니다. 🔒
        </div>
      )}
    </div>
  );
}