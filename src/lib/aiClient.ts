// AI Client - Uses ONLY Vercel Serverless Functions
// All endpoints are relative to current domain (/api/...)
// No self-hosted servers - everything runs on Vercel

// Always use current domain for serverless functions
const SERVERLESS_BASE = typeof window !== 'undefined' ? window.location.origin : '';

async function postJSON<T>(base: string, path: string, body: any): Promise<T> {
  // If no base URL but path is absolute (like /api/...), use current origin
  if (!base && path.startsWith('/')) {
    base = typeof window !== 'undefined' ? window.location.origin : '';
  }
  if (!base) throw new Error('AI base URL not configured');
  
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI server error ${res.status}: ${text}`);
  }
  return res.json();
}

// Legacy functions removed - not using self-hosted AI logic server anymore
// If needed in future, implement as Vercel serverless functions

export type CaptionResponse = { caption: string };

export type CaptionAccessResponse = {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  isAdmin?: boolean;
  globalUsed?: number;
  globalLimit?: number;
};

/**
 * Check if user can generate AI caption (global limit: 10/day for normal users)
 */
export async function checkCaptionAccess(userId: string): Promise<CaptionAccessResponse> {
  try {
    const res = await fetch(`${SERVERLESS_BASE}/api/guard/check-caption-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Check access error ${res.status}: ${text}`);
    }
    
    return res.json();
  } catch (e) {
    console.error('Failed to check caption access:', e);
    // Fail closed - don't allow access if check fails
    return { allowed: false, reason: 'Unable to verify access' };
  }
}

/**
 * Record AI caption usage (increment global daily count)
 */
export async function recordCaptionUsage(userId: string): Promise<void> {
  try {
    const res = await fetch(`${SERVERLESS_BASE}/api/guard/record-caption-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    if (!res.ok) {
      console.error('Failed to record caption usage:', await res.text().catch(() => ''));
    }
  } catch (e) {
    console.error('Failed to record caption usage:', e);
  }
}

/**
 * Generate AI caption using Gemini (Vercel serverless function)
 * Always uses /api/ai/caption endpoint
 */
export async function caption(image_url: string): Promise<CaptionResponse> {
  return await postJSON(SERVERLESS_BASE, '/api/ai/caption', { image_url });
}
