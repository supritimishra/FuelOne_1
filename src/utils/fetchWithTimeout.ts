/**
 * Fetch with timeout utility
 * Ensures requests fail fast if server doesn't respond
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const API_BASE = (import.meta as any)?.env?.VITE_API_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;

  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    // Handle abort errors (timeout)
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      const timeoutError = new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
      (timeoutError as any).name = 'TimeoutError';
      throw timeoutError;
    }
    // Handle network errors gracefully
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error(`Network error: ${url}`);
      (networkError as any).name = 'NetworkError';
      throw networkError;
    }
    // Re-throw other errors as-is
    throw error;
  }
}

