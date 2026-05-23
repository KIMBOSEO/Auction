// 🌟 알림 센터 유틸리티

export type NotificationType = 
  | 'outbid' // 상위 입찰자 등장
  | 'liked_ending' // 관심 상품 마감 임박
  | 'keyword_match' // 키워드 매칭
  | 'follow_new_item'; // 팔로우한 판매자 신규 상품

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_item_id?: string;
  related_user_id?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * 상위 입찰자 등장 알림 생성
 */
export async function createOutbidNotification(
  supabase: any,
  itemId: string,
  previousBidderId: string,
  newHighestAmount: number,
  itemTitle: string
) {
  return await supabase.from('notifications').insert([{
    user_id: previousBidderId,
    type: 'outbid',
    title: '더 높은 입찰가 등장!',
    message: `"${itemTitle}"에서 더 높은 가격(₩${newHighestAmount.toLocaleString()})으로 입찰되었습니다.`,
    related_item_id: itemId,
    is_read: false
  }]);
}

/**
 * 관심 상품 마감 임박 알림 (마감 1시간 전)
 */
export async function checkAndNotifyLikedItemsEnding(
  supabase: any,
  userId: string
) {
  const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const twoHoursBefore = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  // 마감 시간이 1~2시간 사이인 찜한 상품 가져오기
  const { data: likedItems } = await supabase
    .from('likes')
    .select('item_id, items(id, title, end_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!likedItems) return;

  for (const { items: item } of likedItems) {
    if (!item) continue;

    const endTime = new Date(item.end_at).getTime();
    const now = new Date().getTime();
    const timeLeft = endTime - now;

    // 마감 1시간 전이고, 아직 알림을 보내지 않은 경우
    if (timeLeft > 0 && timeLeft < 60 * 60 * 1000) {
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('related_item_id', item.id)
        .eq('type', 'liked_ending')
        .single();

      if (!existingNotification) {
        await supabase.from('notifications').insert([{
          user_id: userId,
          type: 'liked_ending',
          title: '관심 상품 마감 임박!',
          message: `"${item.title}"의 경매가 곧 종료됩니다.`,
          related_item_id: item.id,
          is_read: false
        }]);
      }
    }
  }
}

/**
 * 키워드 알림 생성
 */
export async function createKeywordMatchNotification(
  supabase: any,
  userId: string,
  keyword: string,
  itemId: string,
  itemTitle: string
) {
  return await supabase.from('notifications').insert([{
    user_id: userId,
    type: 'keyword_match',
    title: `'${keyword}' 상품 등록!`,
    message: `검색 키워드 "${keyword}"와 일치하는 상품 "${itemTitle}"이 등록되었습니다.`,
    related_item_id: itemId,
    is_read: false
  }]);
}

/**
 * 팔로우한 판매자 신규 상품 알림
 */
export async function notifyFollowedSellerNewItem(
  supabase: any,
  sellerId: string,
  sellerNickname: string,
  itemId: string,
  itemTitle: string
) {
  // 이 판매자를 팔로우한 모든 사용자 찾기
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', sellerId);

  if (!followers || followers.length === 0) return;

  // 각 팔로워에게 알림 생성
  const notifications = followers.map(({ follower_id }) => ({
    user_id: follower_id,
    type: 'follow_new_item',
    title: `${sellerNickname}님의 신규 상품!`,
    message: `팔로우한 판매자 "${sellerNickname}"님이 새로운 상품 "${itemTitle}"을 등록했습니다.`,
    related_item_id: itemId,
    related_user_id: sellerId,
    is_read: false
  }));

  return await supabase.from('notifications').insert(notifications);
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  supabase: any,
  notificationId: string
) {
  return await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadNotificationCount(
  supabase: any,
  userId: string
) {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  return count || 0;
}
