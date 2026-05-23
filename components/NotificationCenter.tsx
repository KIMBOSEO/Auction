'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/lib/notifications';
import Link from 'next/link';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        fetchNotifications(currentUser.id);
        subscribeToNotifications(currentUser.id);
      }
    };

    getUser();
  }, []);

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
  };

  const subscribeToNotifications = (userId: string) => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'outbid': return '🔨';
      case 'liked_ending': return '⏰';
      case 'keyword_match': return '🔍';
      case 'follow_new_item': return '⭐';
      default: return '📢';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.related_item_id) {
      // 상품 상세 페이지로 이동
      window.location.href = `/items/${notification.related_item_id}`;
    }
  };

  return (
    <div className="relative">
      {/* 벨 아이콘 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        title="알림"
      >
        <span className="text-2xl">🔔</span>
        
        {/* 읽지 않은 알림 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
            <h3 className="font-black text-gray-900 dark:text-white">알림 센터</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                {unreadCount}개 미읽음
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
              <span className="text-3xl block mb-2">🎣</span>
              아직 알림이 없어요
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors ${
                    notification.is_read
                      ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-gray-900 dark:text-white text-sm">
                        {notification.title}
                        {!notification.is_read && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition"
                          >
                            읽음
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-xs px-2 py-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 font-bold transition"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 하단 액션 */}
          {notifications.length > 0 && (
            <div className="border-t dark:border-gray-800 p-3 flex gap-2">
              <button
                onClick={() => {
                  notifications.forEach(n => {
                    if (!n.is_read) markAsRead(n.id);
                  });
                }}
                className="flex-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                모두 읽음
              </button>
            </div>
          )}
        </div>
      )}

      {/* 배경 클릭 시 닫기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
