import { supabase } from './supabase';

// 🌟 알림 전송을 위한 인터페이스 구조 정의
interface CreateNotificationParams {
  userId: string;
  type: 'outbid' | 'liked_ending' | 'keyword_match' | 'follow_new_item';
  title: string;
  message: string;
  relatedItemId?: string;
  relatedUserId?: string;
}

/**
 * 1. 단일 알림 생성 유틸리티 함수
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedItemId,
  relatedUserId,
}: CreateNotificationParams) {
  const { error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      type,
      title,
      message,
      related_item_id: relatedItemId,
      related_user_id: relatedUserId,
      is_read: false,
    },
  ]);

  if (error) {
    console.error('알림 생성 실패:', error.message);
  }
  return { success: !error, error };
}

/**
 * 2. 상위 입찰자 등장 시 기존 최고 입찰자에게 알림 발송
 */
export async function notifyOutbid(itemId: string, itemTitle: string, previousBidderId: string, newAmount: number) {
  if (!previousBidderId) return;

  return createNotification({
    userId: previousBidderId,
    type: 'outbid',
    title: '👑 상위 입찰자 등장!',
    message: `[${itemTitle}] 상품에 더 높은 입찰가(₩${newAmount.toLocaleString()})가 등장했습니다. 🔨`,
    relatedItemId: itemId,
  });
}

/**
 * 3. 찜한 상품의 마감 임박 알림 (서버 및 클라이언트 배치용)
 */
export async function notifyLikedItemEnding(itemId: string, itemTitle: string, userId: string) {
  return createNotification({
    userId,
    type: 'liked_ending',
    title: '⏳ 관심 상품 마감 임박!',
    message: `찜해두신 보물 [${itemTitle}]의 경매 마감 시간이 얼마 남지 않았습니다! 🎣`,
    relatedItemId: itemId,
  });
}

/**
 * 4. 🌟 판매자가 신규 상품을 올렸을 때 팔로워들에게 단체 알림 발송 (에러 해결 구역)
 */
export async function notifyFollowersNewItem(sellerId: string, sellerNickname: string, itemId: string, itemTitle: string) {
  // 나를 팔로우하는 사람들의 리스트 확보
  const { data: followersData, error: fetchError } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', sellerId);

  if (fetchError || !followersData) {
    console.error('팔로워 조회 실패:', fetchError?.message);
    return;
  }

  // 🌟 [해결의 열쇠] 구조 분해 할당을 위해 데이터 타입을 명확히 타이핑해 줍니다.
  const followers = followersData as { follower_id: string }[];

  if (followers.length === 0) return;

  // 각 팔로워에게 보낼 알림 객체 배열 생성 (타입 안정성 확보! 🎯)
  const notificationRows = followers.map(({ follower_id }) => ({
    user_id: follower_id,
    type: 'follow_new_item',
    title: `🔔 ${sellerNickname}님의 신규 보물!`,
    message: `팔로우하신 ${sellerNickname}님이 새 경매 물품 [${itemTitle}]을 등록하셨습니다. 🚀`,
    related_item_id: itemId,
    related_user_id: sellerId,
    is_read: false,
  }));

  // 대량 벌크 인서트(Bulk Insert)로 한 번에 알림 발송
  const { error: insertError } = await supabase
    .from('notifications')
    .insert(notificationRows);

  if (insertError) {
    console.error('팔로워 단체 알림 발송 실패:', insertError.message);
  }
}