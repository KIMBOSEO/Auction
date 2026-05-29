import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, description, image_urls } = body;
    if (!id) return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: '인증 실패' }, { status: 401 });

    const db = createAdminClient();
    const { data: item } = await db.from('items').select('*').eq('id', id).single();
    if (!item) return NextResponse.json({ error: '상품 없음' }, { status: 404 });

    if (new Date(item.end_at) <= new Date()) return NextResponse.json({ error: '이미 마감된 상품은 수정할 수 없습니다.' }, { status: 400 });
    if (item.user_id !== user.id) return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });

    const updateData: any = {};
    if (typeof description === 'string') updateData.description = description;
    if (Array.isArray(image_urls)) {
      updateData.image_urls = image_urls;
      updateData.image_url = image_urls[0] || null;
    }

    await db.from('items').update(updateData).eq('id', id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('/api/items/update', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
