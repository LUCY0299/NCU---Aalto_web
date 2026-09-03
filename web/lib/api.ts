/**
 * API 服務層
 * 用於與後台 FastAPI 通訊
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

interface ApiOptions extends RequestInit {
  locale?: string;
}

/**
 * 通用 API 請求函數
 */
async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { locale = 'zh-TW', ...fetchOptions } = options;

  const url = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.append('locale', locale);

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 取得頁面內容
 */
export async function getPageContent(
  pageSlug: string,
  sectionKey?: string,
  locale?: string
) {
  const endpoint = sectionKey
    ? `/api/v1/content/${pageSlug}/${sectionKey}`
    : `/api/v1/pages/${pageSlug}`;

  return apiRequest(endpoint, { locale });
}

/**
 * 取得首頁 Hero 區塊
 */
export async function getHomeHero(locale?: string) {
  return apiRequest('/api/v1/content/home/hero', { locale });
}

/**
 * 取得首頁介紹區塊
 */
export async function getHomeIntro(locale?: string) {
  return apiRequest('/api/v1/content/home/intro', { locale });
}

/**
 * 取得頁面樹狀結構（導航用）
 */
export async function getPageTree() {
  return apiRequest('/api/v1/page-tree');
}

/**
 * 健康檢查
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/docs`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
