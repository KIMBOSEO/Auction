'use client';

import { useEffect, useState } from 'react';

export default function Timer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft('경매 종료');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}일 ${hours}시간 ${minutes}분 ${seconds}초`);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="text-2xl font-mono font-black text-red-500">
      {timeLeft}
    </div>
  );
}