'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ImageGalleryProps {
  itemId: string;
  images: string[];
  isOwner: boolean;
  isEnded: boolean;
  onImagesUpdate?: (newImages: string[]) => void;
}

export default function ImageGallery({ 
  itemId, 
  images, 
  isOwner, 
  isEnded,
  onImagesUpdate 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const displayImages = images && images.length > 0 ? images : [''];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (newFiles.length + files.length + displayImages.length > 10) {
      alert("최대 10장까지만 업로드 가능합니다!");
      return;
    }
    setNewFiles([...newFiles, ...files]);
  };

  const handleUploadNewImages = async () => {
    if (newFiles.length === 0) return;
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop();
        const safeFileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error } = await supabase.storage.from('item_images').upload(safeFileName, file);

        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('item_images').getPublicUrl(safeFileName);
          uploadedUrls.push(publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const updatedImages = [...displayImages.filter(img => img), ...uploadedUrls];
        const { error } = await supabase
          .from('items')
          .update({ image_urls: updatedImages, image_url: updatedImages[0] })
          .eq('id', itemId);

        if (!error) {
          alert("이미지가 추가되었습니다! ✨");
          setNewFiles([]);
          setIsAddingImages(false);
          onImagesUpdate?.(updatedImages);
        }
      }
    } catch (error) {
      alert("이미지 업로드 실패!");
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      {/* 메인 이미지 */}
      <div className="aspect-[4/3] bg-gray-900 dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl relative w-full flex items-center justify-center">
        {isEnded && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
            <span className="text-white text-4xl md:text-5xl font-black border-4 md:border-8 border-white px-8 py-4 rotate-[-10deg]">
              SOLD OUT
            </span>
          </div>
        )}
        
        {displayImages[currentIndex] ? (
          <img 
            src={displayImages[currentIndex]} 
            alt={`image-${currentIndex}`} 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-6xl">🐟</div>
        )}

        {/* 네비게이션 버튼 */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full w-12 h-12 flex items-center justify-center font-black transition"
            >
              ‹
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-full w-12 h-12 flex items-center justify-center font-black transition"
            >
              ›
            </button>
          </>
        )}

        {/* 이미지 인덱스 */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
            {currentIndex + 1}/{displayImages.length}
          </div>
        )}
      </div>

      {/* 썸네일 갤러리 */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {displayImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                index === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              {img ? (
                <img src={img} alt={`thumb-${index}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl">
                  🐟
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 🌟 이미지 추가 버튼 (판매자만) */}
      {isOwner && !isEnded && (
        <div className="space-y-3">
          {!isAddingImages ? (
            <button
              onClick={() => setIsAddingImages(true)}
              className="w-full p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-200 dark:border-blue-800"
            >
              + 사진 추가하기
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <label className="block text-center cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleAddImages}
                  className="hidden"
                  id="addImages"
                />
                <span className="text-2xl block mb-1">📸</span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  클릭하여 이미지 선택
                </span>
              </label>

              {newFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {newFiles.map((file, index) => (
                    <div key={index} className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded text-xs font-bold text-center flex items-center justify-center">
                      {index + 1}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleUploadNewImages}
                  disabled={uploading || newFiles.length === 0}
                  className="flex-1 p-2 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </button>
                <button
                  onClick={() => { setIsAddingImages(false); setNewFiles([]); }}
                  className="flex-1 p-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
