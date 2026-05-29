'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface NotificationLog {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotificationLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🌟 1번 요구사항: 내 계정 전용 누적 로그 리스트 쿼리
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setLogs(data || []);
    };

    fetchNotificationLogs();

    // 실시간 알림 로그 수신기 가동
    const channel = supabase
      .channel('realtime-notification-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          setLogs((prev) => [payload.new as NotificationLog, ...prev]);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = logs.filter(l => !l.is_read).length;

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setLogs((prev) => prev.map(l => ({ ...l, is_read: true })));
  };

  return (
    <div className="relative">
      <button onClick={() => { setIsOpen(!isOpen); markAllAsRead(); }} className="relative p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:scale-105 transition-all">
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-4 z-50 max-h-[400px] overflow-y-auto">
          <div className="flex justify-between items-center mb-3 border-b pb-2 border-gray-100 dark:border-gray-800">
            <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">알림 기록 보관실 🗄️</h4>
            <span className="text-[10px] font-bold text-gray-400">총 {logs.length}건</span>
          </div>

          {logs.length === 0 ? (
            <p className="text-center text-xs font-bold text-gray-300 py-8">누적된 알림 기록이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className={`p-3 rounded-2xl border text-left transition-all ${log.is_read ? 'bg-gray-50/50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-800' : 'bg-blue-50/40 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900'}`}>
                  <p className="text-xs font-black text-gray-800 dark:text-gray-100 mb-1">{log.title}</p>
                  <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{log.message}</p>
                  <span className="text-[9px] text-gray-400 block mt-1.5 font-bold">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}