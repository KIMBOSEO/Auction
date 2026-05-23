import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBidIncrement, getMinBidAmount } from '@/lib/bidUtils';

/** 서버 전용 Admin 클라이언트 (RLS 우회용) */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // SUPABASE_SERVICE_ROLE_KEY가 없으면 anon key로 폴백 (RLS 정책 별도 설정 필요)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, amount, isAutoBid, maxBidAmount, isBuyNow } = body;

    if (!itemId) return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });

    // 사용자 JWT 검증
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );
    const db = createAdminClient();

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: '인증 실패. 다시 로그인해주세요.' }, { status: 401 });

    const { data: profile } = await db.from('profiles').select('nickname').eq('id', user.id).single();
    if (!profile?.nickname) return NextResponse.json({ error: '마이페이지에서 닉네임을 먼저 설정해주세요.' }, { status: 400 });

    const userNickname = profile.nickname as string;

    const { data: item, error: itemError } = await db.from('items').select('*').eq('id', itemId).single();
    if (itemError || !item) return NextResponse.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });

    if (new Date(item.end_at) < new Date()) return NextResponse.json({ error: '경매가 이미 종료되었습니다.' }, { status: 400 });
    if (item.user_id === user.id) return NextResponse.json({ error: '본인의 상품에는 입찰할 수 없습니다.' }, { status: 400 });

    const currentPrice = item.price as number;

    // 아이템 가격 업데이트 헬퍼
    async function finalizeItem(newPrice: number, endNow = false) {
      const { count } = await db.from('bids').select('*', { count: 'exact', head: true }).eq('item_id', itemId);
      const updateData: Record<string, unknown> = { price: newPrice, bids: count || 0 };
      if (endNow) updateData.end_at = new Date().toISOString();
      await db.from('items').update(updateData).eq('id', itemId);
    }

    const hitsBuyNow = (price: number) => !!(item.instantly_buy_price && price >= item.instantly_buy_price);

    // ─── 즉시 구매 ───────────────────────────────────────────────────────────
    if (isBuyNow) {
      if (!item.instantly_buy_price) return NextResponse.json({ error: '즉시 구매가가 설정되지 않았습니다.' }, { status: 400 });
      const buyPrice = item.instantly_buy_price as number;
      await db.from('bids').insert([{ item_id: itemId, user_email: user.email, user_nickname: userNickname, amount: buyPrice }]);
      await finalizeItem(buyPrice, true);
      return NextResponse.json({ success: true, type: 'buyNow', finalPrice: buyPrice });
    }

    // ─── 자동 입찰 예약 ───────────────────────────────────────────────────────
    if (isAutoBid) {
      const maxBid = Number(maxBidAmount);
      const minBid = getMinBidAmount(currentPrice);
      if (!maxBid || maxBid < minBid) {
        return NextResponse.json({ error: `최대 입찰가는 최소 ₩${minBid.toLocaleString()} 이상이어야 합니다.` }, { status: 400 });
      }

      // 경쟁 자동 입찰자 조회 (최고 max_bid 순, 동점이면 먼저 등록한 자 우선)
      const { data: others } = await db
        .from('auto_bids').select('*')
        .eq('item_id', itemId).neq('user_id', user.id)
        .order('max_bid_amount', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);
      const topOther = others?.[0];

      // 이미 같은 금액 예약자가 있으면 동점 처리 거부
      if (topOther && maxBid === topOther.max_bid_amount) {
        return NextResponse.json({ success: false, error: '동일 금액의 자동 입찰이 이미 예약되어 있습니다. 더 높은 금액을 입력해주세요.' }, { status: 400 });
      }

      // 자동 입찰 기록 upsert
      await db.from('auto_bids').upsert(
        [{ item_id: itemId, user_id: user.id, user_email: user.email, user_nickname: userNickname, max_bid_amount: maxBid }],
        { onConflict: 'item_id,user_id' }
      );

      let initialPrice: number;

      if (topOther && maxBid < topOther.max_bid_amount) {
        // 패배: 경쟁자가 더 높은 최대가 보유 → 경쟁자가 내 max+1호가로 응찰
        const response = Math.min(maxBid + getBidIncrement(maxBid), topOther.max_bid_amount);
        await db.from('bids').insert([
          { item_id: itemId, user_email: user.email, user_nickname: `${userNickname}(자동)`, amount: maxBid },
          { item_id: itemId, user_email: topOther.user_email, user_nickname: `${topOther.user_nickname}(자동)`, amount: response },
        ]);
        const endNow = hitsBuyNow(response);
        await finalizeItem(endNow ? (item.instantly_buy_price as number) : response, endNow);
        return NextResponse.json({ success: false, type: 'autoBidOutbid', finalPrice: response, message: `다른 자동 입찰자가 더 높은 최대가를 보유해 낙찰받지 못했습니다. 현재가: ₩${response.toLocaleString()}` });

      } else if (topOther && maxBid > topOther.max_bid_amount) {
        // 승리: 내가 topOther의 max+1호가로 응찰, topOther의 자동 입찰 해제
        const response = Math.min(topOther.max_bid_amount + getBidIncrement(topOther.max_bid_amount), maxBid);
        await db.from('bids').insert([
          { item_id: itemId, user_email: topOther.user_email, user_nickname: `${topOther.user_nickname}(자동)`, amount: topOther.max_bid_amount },
          { item_id: itemId, user_email: user.email, user_nickname: `${userNickname}(자동)`, amount: response },
        ]);
        try { await db.from('notifications').insert([{ user_id: topOther.user_id, type: 'outbid', title: '자동 입찰 한도 초과!', message: `"${item.title}"의 자동 입찰 최대가를 넘는 입찰이 등록됐습니다.`, related_item_id: itemId, is_read: false }]); } catch { /* 알림 실패 무시 */ }
        await db.from('auto_bids').delete().eq('item_id', itemId).eq('user_id', topOther.user_id);
        initialPrice = response;

      } else {
        // 경쟁 자동 입찰 없음: 최소 호가로 초기 입찰
        initialPrice = getMinBidAmount(currentPrice);
        await db.from('bids').insert([{ item_id: itemId, user_email: user.email, user_nickname: `${userNickname}(자동)`, amount: initialPrice }]);
      }

      const endNow = hitsBuyNow(initialPrice!);
      await finalizeItem(endNow ? (item.instantly_buy_price as number) : initialPrice!, endNow);
      return NextResponse.json({ success: true, type: 'autoBid', finalPrice: initialPrice!, message: `자동 입찰 예약 완료! 현재가 ₩${initialPrice!.toLocaleString()}` });
    }

    // ─── 일반 입찰 ────────────────────────────────────────────────────────────
    const bidAmount = Number(amount);
    const minBid = getMinBidAmount(currentPrice);
    if (bidAmount < minBid) {
      return NextResponse.json({ error: `최소 입찰가는 ₩${minBid.toLocaleString()} 입니다. (호가: ₩${getBidIncrement(currentPrice).toLocaleString()})` }, { status: 400 });
    }

    await db.from('bids').insert([{ item_id: itemId, user_email: user.email, user_nickname: userNickname, amount: bidAmount }]);

    // 활성 자동 입찰자 조회
    const { data: activeBids } = await db
      .from('auto_bids').select('*')
      .eq('item_id', itemId).neq('user_id', user.id)
      .order('max_bid_amount', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);
    const topAutoBid = activeBids?.[0];

    let finalPrice = bidAmount;
    let wasAutoOutbid = false;

    if (topAutoBid) {
      if (bidAmount >= topAutoBid.max_bid_amount) {
        // 자동 입찰 한도 초과 → 자동 입찰 해제 + 알림
        try {
          await db.from('notifications').insert([{ user_id: topAutoBid.user_id, type: 'outbid', title: '자동 입찰 한도 초과!', message: `"${item.title}"에서 자동 입찰 최대가(₩${topAutoBid.max_bid_amount.toLocaleString()})를 넘는 입찰이 들어왔습니다.`, related_item_id: itemId, is_read: false }]);
        } catch { /* 알림 실패는 무시하고 로직 계속 */ }
        await db.from('auto_bids').delete().eq('item_id', itemId).eq('user_id', topAutoBid.user_id);
      } else {
        // 자동 입찰 응찰
        const autoResponse = bidAmount + getBidIncrement(bidAmount);
        if (autoResponse <= topAutoBid.max_bid_amount) {
          await db.from('bids').insert([{ item_id: itemId, user_email: topAutoBid.user_email, user_nickname: `${topAutoBid.user_nickname}(자동)`, amount: autoResponse }]);
          finalPrice = autoResponse;
          wasAutoOutbid = true;
        }
      }
    }

    const endNow = hitsBuyNow(finalPrice);
    await finalizeItem(endNow ? (item.instantly_buy_price as number) : finalPrice, endNow);

    return NextResponse.json({
      success: true,
      type: 'normal',
      finalPrice: endNow ? item.instantly_buy_price : finalPrice,
      wasAutoOutbid,
      message: wasAutoOutbid
        ? `입찰됐으나 자동 입찰자에 의해 즉시 재입찰됐습니다. 현재가: ₩${finalPrice.toLocaleString()}`
        : endNow
        ? `즉시 구매가 도달! 경매가 즉시 종료됐습니다. 낙찰가: ₩${(item.instantly_buy_price as number).toLocaleString()}`
        : null,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '입찰 처리 중 오류가 발생했습니다.';
    console.error('[/api/bid] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
