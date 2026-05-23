// 🌟 AI 스마트 검색 유틸리티
// 향후 OpenAI, Claude 등의 AI API와 연동 가능하도록 설계

export interface SearchResult {
  id: string;
  title: string;
  relevanceScore: number; // 0-1 사이의 점수
  matchType: 'exact' | 'partial' | 'semantic';
}

/**
 * 기본 유사성 점수 계산
 * 향후 LLM 기반으로 대체 가능
 */
function calculateSimilarity(query: string, text: string): number {
  const queryLower = query.toLowerCase().trim();
  const textLower = text.toLowerCase().trim();

  // 정확한 매칭
  if (textLower === queryLower) return 1.0;
  if (textLower.includes(queryLower)) return 0.9;
  if (queryLower.includes(textLower)) return 0.85;

  // 부분 문자 매칭 (Levenshtein 유사도 간략판)
  const words1 = queryLower.split(/\s+/);
  const words2 = textLower.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word2.includes(word1) || word1.includes(word2)) {
        matchCount++;
        break;
      }
    }
  }
  
  const wordSimilarity = words1.length > 0 ? matchCount / words1.length : 0;
  
  // 자음 매칭 (한글용)
  const jamo1 = queryLower.split('').map(ch => getJamo(ch)).join('');
  const jamo2 = textLower.split('').map(ch => getJamo(ch)).join('');
  
  if (jamo2.includes(jamo1)) {
    return Math.max(wordSimilarity, 0.6);
  }

  return wordSimilarity * 0.7;
}

/**
 * 한글을 자음으로 변환 (모음 제거)
 */
function getJamo(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const offset = code - 0xac00;
    const initial = Math.floor(offset / (21 * 28));
    const jamoList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    return jamoList[initial];
  }
  return char;
}

/**
 * AI 스마트 검색 함수
 * @param query 사용자 검색어
 * @param items 검색할 아이템 배열
 * @returns 관련성 점수순으로 정렬된 결과
 */
export function smartSearch(query: string, items: any[]): SearchResult[] {
  if (!query.trim()) return [];

  const results = items.map(item => {
    // 제목, 설명, 판매자 닉네임으로 검색
    const titleScore = calculateSimilarity(query, item.title || '');
    const descScore = calculateSimilarity(query, item.description || '') * 0.7; // 설명은 낮은 가중치
    const nicknameScore = calculateSimilarity(query, item.user_nickname || '') * 0.9;
    const categoryScore = calculateSimilarity(query, item.category || '') * 0.5;

    const relevanceScore = Math.max(titleScore, nicknameScore, descScore, categoryScore);
    const matchType: 'exact' | 'partial' | 'semantic' = 
      relevanceScore === 1.0 ? 'exact' : relevanceScore >= 0.7 ? 'partial' : 'semantic';

    return {
      id: item.id,
      title: item.title,
      relevanceScore,
      matchType
    };
  })
  .filter(result => result.relevanceScore > 0.3) // 최소 임계값
  .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results;
}

/**
 * 검색어 자동완성 제안
 * @param query 현재 검색어
 * @param items 모든 아이템
 * @returns 추천 검색어 배열
 */
export function getSearchSuggestions(query: string, items: any[], limit: number = 5): string[] {
  if (!query.trim()) return [];

  const suggestions = new Set<string>();

  for (const item of items) {
    // 제목에서 일치하는 부분 추출
    const title = item.title || '';
    const titleLower = title.toLowerCase();
    const queryLower = query.toLowerCase();

    if (titleLower.includes(queryLower)) {
      suggestions.add(title);
    }

    // 닉네임에서도 제안
    if (item.user_nickname?.toLowerCase().includes(queryLower)) {
      suggestions.add(`@${item.user_nickname}`);
    }
  }

  return Array.from(suggestions).slice(0, limit);
}
