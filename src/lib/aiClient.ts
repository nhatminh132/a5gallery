// Lightweight client for the AI Utility Server(s)
// Logic endpoints base via VITE_AI_LOGIC_URL (or legacy VITE_AI_SERVER_URL)
// Caption endpoint base via VITE_AI_CAPTION_URL
// NM GUARD BETA endpoint for rate limiting

const LOGIC_BASE = import.meta.env.VITE_AI_LOGIC_URL || import.meta.env.VITE_AI_SERVER_URL || '';
// Prefer explicit caption URL; otherwise fall back to logic/server URL for compatibility
const CAPTION_BASE = import.meta.env.VITE_AI_CAPTION_URL || LOGIC_BASE || '';
const NM_GUARD_BASE = import.meta.env.VITE_NM_GUARD_URL || '';

async function postJSON<T>(base: string, path: string, body: any): Promise<T> {
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

export type ModerateResponse = { isToxic: boolean; score: number; reasons: string[] };
export function moderateText(text: string): Promise<ModerateResponse> {
  return postJSON(LOGIC_BASE, '/ai/moderate', { text });
}

export type RecommendInput = {
  caption?: string;
  newHash?: string;
  existingHashes?: string[];
  engagement?: { views?: number; likes?: number; comments?: number };
  thresholds?: { duplicate?: number; lowEngagement?: { likesPerView?: number; commentsPerView?: number } };
};
export type RecommendResponse = { suggestions: string[]; warnings: string[]; meta?: { similarity?: number } };
export function recommend(input: RecommendInput): Promise<RecommendResponse> {
  return postJSON(LOGIC_BASE, '/ai/recommend', input);
}

export type DedupeResponse = { isDuplicate: boolean; similarity: number };
export function dedupe(imageHash: string, existingHashes: string[] = [], threshold = 0.9): Promise<DedupeResponse> {
  return postJSON(LOGIC_BASE, '/ai/dedupe', { imageHash, existingHashes, threshold });
}

export type CaptionResponse = { caption: string };

export type GuardCheckResponse = {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  role?: string;
  message?: string;
  resetTime?: string;
};

/**
 * Check with NM GUARD BETA if user can use AI Captioner
 */
export async function checkCaptionAccess(userId: string, userEmail?: string): Promise<GuardCheckResponse> {
  if (!NM_GUARD_BASE) {
    // If NM GUARD not configured, allow with warning
    console.warn('NM GUARD BETA not configured, allowing caption access by default');
    return { allowed: true, message: 'Rate limiting not configured' };
  }
  
  try {
    const res = await fetch(`${NM_GUARD_BASE}/api/guard/check-caption-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userEmail }),
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`NM GUARD error ${res.status}: ${text}`);
    }
    
    return res.json();
  } catch (e) {
    console.error('Failed to check caption access:', e);
    // Fail open - allow access if guard is down
    return { allowed: true, message: 'Guard service unavailable' };
  }
}

/**
 * Record AI caption usage with NM GUARD BETA
 */
export async function recordCaptionUsage(userId: string): Promise<void> {
  if (!NM_GUARD_BASE) return;
  
  try {
    const res = await fetch(`${NM_GUARD_BASE}/api/guard/record-caption-usage`, {
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

// Calls /ai/caption on CAPTION_BASE; if that fails, falls back to /caption (FastAPI worker)
export async function caption(image_url: string): Promise<CaptionResponse> {
  try {
    return await postJSON(CAPTION_BASE, '/ai/caption', { image_url });
  } catch (e) {
    // Fallback to direct FastAPI worker path
    return await postJSON(CAPTION_BASE, '/caption', { image_url });
  }
}

export function aiLogicConfigured(): boolean {
  return Boolean(LOGIC_BASE);
}
export function aiCaptionConfigured(): boolean {
  return Boolean(CAPTION_BASE);
}
export function nmGuardConfigured(): boolean {
  return Boolean(NM_GUARD_BASE);
}
