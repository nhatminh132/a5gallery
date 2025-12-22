// Lightweight client for the AI Utility Server(s)
// Logic endpoints base via VITE_AI_LOGIC_URL (or legacy VITE_AI_SERVER_URL)
// Caption endpoint base via VITE_AI_CAPTION_URL

const LOGIC_BASE = import.meta.env.VITE_AI_LOGIC_URL || import.meta.env.VITE_AI_SERVER_URL || '';
// Prefer explicit caption URL; otherwise fall back to logic/server URL for compatibility
const CAPTION_BASE = import.meta.env.VITE_AI_CAPTION_URL || LOGIC_BASE || '';

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
