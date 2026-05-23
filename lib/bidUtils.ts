/**
 * 가물치 경매장 호가 단위 유틸리티
 * 금액대별 최소 입찰 증가 단위를 계산합니다.
 */

/**
 * 현재가 기준 최소 호가 단위 반환
 */
export function getBidIncrement(currentPrice: number): number {
  if (currentPrice < 10_000) return 500;
  if (currentPrice < 500_000) return 1_000;
  if (currentPrice < 1_000_000) return 5_000;
  return 10_000;
}

/**
 * 현재가 기준 최소 유효 입찰가 (currentPrice + 호가단위)
 */
export function getMinBidAmount(currentPrice: number): number {
  return currentPrice + getBidIncrement(currentPrice);
}

/**
 * 입력 금액을 호가 단위에 맞게 올림 처리
 * - currentPrice=5000, amount=5230 → 5500 (호가 500씩)
 * - currentPrice=5000, amount=4000 → 5500 (최소 입찰가 미달 → 최소값 반환)
 */
export function roundUpToValidBid(amount: number, currentPrice: number): number {
  const increment = getBidIncrement(currentPrice);
  const minBid = currentPrice + increment;
  if (amount <= currentPrice) return minBid;
  if (amount < minBid) return minBid;

  // currentPrice를 기점으로 increment 배수에 맞게 올림
  const above = amount - currentPrice;
  const remainder = above % increment;
  if (remainder === 0) return amount;
  return amount + (increment - remainder);
}
