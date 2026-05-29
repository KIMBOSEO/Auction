'use client';

import { useState, RefObject } from 'react';
import { supabase } from '@/lib/supabase';

// 🌟 1. 타입스크립트 신분증에 'imageRef'가 들어올 수 있도록 규격 상자를 공식 등록합니다.
interface ImageGalleryProps {
  itemId: string;
  images: string[];
  isOwner: boolean;
  isEnded: boolean;
  onImagesUpdate: (newImages: string[]) => void;
  imageRef?: RefObject<HTMLImageElement | null>; 
}

export default function ImageGallery({
  itemId,
  images,
  isOwner,
  isEnded,
  onImagesUpdate,
  imageRef // 🌟 2. 상세 페이지(page.tsx)에서 보내준 좌표 연산 장치를 여기서 안전하게 수령합니다.
}: ImageGalleryProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation(); // 돋보기 간섭 차단
    if (images.length <= 1) return;
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // 돋보기 간섭 차단
    if (images.length <= 1) return;
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${itemId}-${Math.random()}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('auction-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('auction-images')
        .getPublicUrl(filePath);

      const updatedImages = [...images, publicUrl];
      
      // DB에 새 이미지 배열 갱신
      const { error: updateError } = await supabase
        .from('items')
        .update({ image_urls: updatedImages })
        .eq('id', itemId);

      if (updateError) throw updateError;

      onImagesUpdate(updatedImages);
      setCurrentIdx(updatedImages.length - 1);
      alert('보물 사진이 추가되었습니다! 📸');
    } catch (error) {
      alert('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-full h-[350px] md:h-[450px] flex flex-col items-center justify-center bg-gray-950 rounded-2xl select-none">
      
      {/* 메인 비주얼 이미지 출력부 */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {images && images.length > 0 ? (
          /* 🌟 3. 바로 이 img 태그입니다! 상세 페이지의 돋보기 센서가 이 이미지 영역 안에서만 동작하도록 연동을 완벽히 마쳤습니다. */
          <img
            ref={imageRef} 
            src={images[currentIdx]}
            alt="가물치 경매 물품 이미지"
            className="max-w-full max-h-full object-contain rounded-xl pointer-events-auto"
          />
        ) : (
          <div className="text-gray-500 font-bold text-sm">등록된 보물 이미지가 없습니다 🎣</div>
        )}
      </div>

      {/* 좌우 이미지 전환 화살표 내비게이터 (돋보기 레이어 밑으로 들어가지 않게 z-index 확보) */}
      {images && images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg transition-all active:scale-90"
          >
            ◀
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-lg transition-all active:scale-90"
          >
            ▶
          </button>
        </>
      )}

      {/* 하단 점(Dot) 인디케이터 구역 */}
      {images && images.length > 1 && (
        <div className="absolute bottom-4 flex gap-1.5 z-30 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentIdx ? 'bg-blue-500 scale-125' : 'bg-gray-400'}`}
            />
          ))}
        </div>
      )}

      {/* 판매자 전용 새 사진 추가 인프라 레이어 (간섭 구역 완벽 분리) */}
      {isOwner && !isEnded && (
        <label className="absolute bottom-4 right-4 z-30 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-1.5">
          {uploading ? '업로드 중... ⏳' : '📸 사진 추가하기'}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}