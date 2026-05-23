'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// 🌟 알림 데이터의 규격(Type) 정의
interface Notification {
  id: string;
  user_id: string;
  type: 'outbid' | 'liked_ending' | 'keyword_match' | 'follow_new_item';
  title: string;
  message: string;
  related_item_id?: string;
  related_user_id?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let channel: any;

    const setupNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 기존 알림 목록 불러오기
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      const loadedNotifications = (data || []) as Notification[];
      setNotifications(loadedNotifications);
      setUnreadCount(loadedNotifications.filter(n => !n.is_read).length);

      // 2. 🌟 실시간 알림 채널 구독 및 타입 에러 완벽 방어
      channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${user.id}` 
          }, 
          (payload) => {
            // 🔥 [해결의 열쇠] payload.new 뒤에 'as Notification'을 붙여 타입을 명시해 줍니다!
            const newNotification = payload.new as Notification;
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();
    };

    setupNotifications();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // 알림 읽음 처리 기능
  const handleRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="relative">
      {/* 종 모양 버튼 */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-xl transition-all active:scale-90 hover:bg-gray-100"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 레이어 */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 shadow-2xl rounded-[2rem] p-4 z-50 max-h-[400px] overflow-y-auto">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3 px-2">실시간 알림 센터 📢</h3>
          {notifications.length === 0 ? (
            <p className="text-center text-xs font-bold text-gray-300 py-10">도착한 알림이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => handleRead(notif.id)}
                  className={`p-4 rounded-2xl text-left cursor-pointer transition-all border ${
                    notif.is_read 
                      ? 'bg-gray-50/50 border-transparent text-gray-400' 
                      : 'bg-blue-50/50 border-blue-100 text-gray-800 font-bold hover:bg-blue-50'
                  }`}
                >
                  <p className="text-xs font-black mb-1 text-blue-600">{notif.title}</p>
                  <p className="text-xs leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}