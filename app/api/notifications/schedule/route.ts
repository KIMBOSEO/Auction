import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyLikedItemEnding } from '@/lib/notifications';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const db = createAdminClient();
    const now = new Date();
    const inOneHourStart = new Date(now.getTime() + 59 * 60 * 1000).toISOString();
    const inOneHourEnd = new Date(now.getTime() + 61 * 60 * 1000).toISOString();

    // 마감 59~61분 남은 아이템 조회
    const { data: items } = await db.from('items').select('*').gte('end_at', inOneHourStart).lte('end_at', inOneHourEnd);
    if (!items || items.length === 0) return NextResponse.json({ processed: 0 });

    let processed = 0;
    for (const it of items) {
      // 찜한 사용자 목록 조회
      const { data: likes } = await db.from('likes').select('user_id').eq('item_id', it.id);
      if (!likes || likes.length === 0) continue;
      for (const l of likes) {
        await notifyLikedItemEnding(it.id, it.title, l.user_id);
        processed++;
      }
    }

    return NextResponse.json({ processed });
  } catch (err) {
    console.error('/api/notifications/schedule error', err);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
