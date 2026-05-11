'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function ChatRoom({ itemId, userEmail }: { itemId: string; userEmail: string | undefined }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 기존 메시지 불러오기 및 실시간 구독
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    };

    fetchMessages();

    // 실시간 메시지 감시 시작!
    const channel = supabase
      .channel(`chat-${itemId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `item_id=eq.${itemId}` }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [itemId]);

  // 2. 새 메시지가 올 때마다 스크롤 아래로!
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. 메시지 전송
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userEmail) return;

    const { error } = await supabase.from('messages').insert([
      { text: newMessage, user_email: userEmail, item_id: itemId }
    ]);

    if (error) alert("메시지 전송 실패!");
    setNewMessage('');
  };

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="bg-gray-50 px-4 py-3 border-b">
        <h4 className="font-bold text-gray-700">실시간 입찰 중계 💬</h4>
      </div>

      {/* 메시지 리스트 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.user_email === userEmail ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-400 mb-1">{msg.user_email.split('@')[0]}</span>
            <div className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] ${
              msg.user_email === userEmail ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* 입력 영역 */}
      <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={userEmail ? "메시지를 입력하세요..." : "로그인 후 채팅 가능"}
          disabled={!userEmail}
          className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button disabled={!userEmail} className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300">
          전송
        </button>
      </form>
    </div>
  );
}