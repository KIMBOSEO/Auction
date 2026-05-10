'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { useSession, SessionProvider } from 'next-auth/react';

function CreateAuctionContent() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [endTime, setEndTime] = useState('');
  const [kakaoLink, setKakaoLink] = useState('');
  const [file, setFile] = useState<File | null>(null); // 파일 상태 추가
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !file) return alert('이미지를 포함하여 모든 정보를 입력해주세요!');

    setUploading(true);

    try {
      // 1. 이미지 업로드 하기
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      // 파일 이름 앞에 특수문자나 공백이 섞이지 않도록 처리합니다.
      const filePath = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('auction_images') // 👈 이 이름이 Supabase Bucket 이름과 100% 일치해야 함!
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) throw uploadError;

      // 2. 업로드 된 이미지의 공용 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('auction_images')
        .getPublicUrl(filePath);

      // 3. DB에 이미지 URL과 함께 정보 저장하기
      const { error: dbError } = await supabase.from('auctions').insert([
        {
          title,
          start_price: Number(price),
          current_price: Number(price),
          end_at: new Date(endTime).toISOString(),
          seller_kakao: kakaoLink,
          seller_email: session.user?.email,
          image_url: publicUrl // 이미지 주소 저장!
        }
      ]);

      if (dbError) throw dbError;

      alert('경매 등록 완료!');
      router.push('/');
    } catch (error: any) {
      alert(`에러 발생: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>물건 등록하기</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="물건 이름" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
        <input type="number" placeholder="시작 가격" value={price} onChange={(e) => setPrice(e.target.value)} required style={inputStyle} />
        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required style={inputStyle} />
        <input type="text" placeholder="오픈카톡 링크" value={kakaoLink} onChange={(e) => setKakaoLink(e.target.value)} required style={inputStyle} />
        
        {/* 파일 선택창 */}
        <div style={{ margin: '10px 0' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>물건 사진</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </div>

        <button type="submit" disabled={uploading} style={btnStyle}>
          {uploading ? '업로드 중...' : '경매 등록하기'}
        </button>
      </form>
    </div>
  );
}

// 스타일 생략...
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', display: 'block' };
const btnStyle = { width: '100%', padding: '15px', backgroundColor: '#333', color: 'white', cursor: 'pointer' };

export default function CreateAuction() {
  return <SessionProvider><CreateAuctionContent /></SessionProvider>;
}