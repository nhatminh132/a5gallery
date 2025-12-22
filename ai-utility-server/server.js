// AI Utility Server (Node.js Express)
// Stateless, lightweight endpoints for moderation, recommendation logic, and image deduplication assistance.
// No ML models. Suitable for AWS EC2 Free Tier usage.

import express from 'express';
import cors from 'cors';
import { normalizeText, detectProfanity } from './utils/profanity.js';
import { bestHashSimilarity, normalizeHexHash } from './utils/hash.js';

const app = express();
const PORT = process.env.PORT || 8080; // Default 8080 for EC2 free tier convenience

app.use(cors());
app.use(express.json({ limit: '256kb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Proxy AI caption to local Python worker if configured
const CAPTION_SERVER_URL = process.env.CAPTION_SERVER_URL || 'http://127.0.0.1:8090';
app.post('/ai/caption', async (req, res) => {
  const { image_url } = req.body || {};
  if (typeof image_url !== 'string' || !image_url.trim()) {
    return res.status(400).json({ error: 'Invalid payload: { image_url } required' });
  }
  try {
    const r = await fetch(`${CAPTION_SERVER_URL}/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url }),
    });
    const text = await r.text();
    if (!r.ok) {
      try {
        const data = JSON.parse(text);
        return res.status(r.status).json(data);
      } catch {
        return res.status(502).json({ error: 'Caption backend error' });
      }
    }
    const data = JSON.parse(text);
    return res.json({ caption: data.caption || 'A photo.' });
  } catch (e) {
    console.error('Caption proxy failed', e);
    return res.status(502).json({ caption: 'A photo.' });
  }
});

// Text moderation endpoint
// POST /ai/moderate
// Body: { text: string }
// Returns: { isToxic: boolean, score: number (0..1), reasons: string[] }
app.post('/ai/moderate', (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Invalid payload: { text } required' });
  }
  const norm = normalizeText(text);
  const result = detectProfanity(norm);
  return res.json(result);
});

// Recommendation logic endpoint (rule-based)
// POST /ai/recommend
// Body example:
// {
//   caption?: string,
//   newHash?: string,                // hex string (phash/ahash) for duplicate checks
//   existingHashes?: string[],       // optional list to check duplicates against
//   engagement?: { views?: number, likes?: number, comments?: number },
//   thresholds?: {
//     duplicate?: number,            // 0..1 similarity threshold (default 0.9)
//     lowEngagement?: {              // per-view rates below which suggestions are issued
//       likesPerView?: number,       // default 0.02
//       commentsPerView?: number     // default 0.005
//     }
//   }
// }
// Returns: { suggestions: string[], warnings: string[], meta: { similarity?: number } }
app.post('/ai/recommend', (req, res) => {
  const {
    caption,
    newHash,
    existingHashes = [],
    engagement = {},
    thresholds = {}
  } = req.body || {};

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid payload: object expected' });
  }

  const suggestions = [];
  const warnings = [];
  const meta = {};

  // Suggest caption improvements
  if (!caption || !caption.trim()) {
    suggestions.push('Add a descriptive caption to improve discoverability.');
  } else if (caption.trim().length < 10) {
    suggestions.push('Caption seems short; consider adding more context.');
  }

  // Duplicate check (rule-based via hash similarity)
  let similarity;
  if (typeof newHash === 'string' && Array.isArray(existingHashes) && existingHashes.length > 0) {
    const threshold = Math.max(0, Math.min(1, thresholds.duplicate ?? 0.9));
    const result = bestHashSimilarity(newHash, existingHashes);
    similarity = result.similarity;
    if (similarity >= threshold) {
      warnings.push('Potential duplicate upload detected.');
    }
    meta.similarity = similarity;
  }

  // Low engagement rules
  const v = Number(engagement.views ?? 0);
  const l = Number(engagement.likes ?? 0);
  const c = Number(engagement.comments ?? 0);
  if (v > 0) {
    const likesPerView = l / v;
    const commentsPerView = c / v;
    const likeCut = thresholds.lowEngagement?.likesPerView ?? 0.02; // 2%
    const commentCut = thresholds.lowEngagement?.commentsPerView ?? 0.005; // 0.5%

    if (likesPerView < likeCut) {
      suggestions.push('Engagement is low; consider a more compelling thumbnail or caption.');
    }
    if (commentsPerView < commentCut) {
      suggestions.push('Encourage interaction by asking a question in the caption.');
    }
  }

  return res.json({ suggestions, warnings, meta });
});

// Image deduplication helper
// POST /ai/dedupe
// Body: { imageHash: string, existingHashes?: string[], threshold?: number }
// Returns: { isDuplicate: boolean, similarity: number }
app.post('/ai/dedupe', (req, res) => {
  const { imageHash, existingHashes = [], threshold = 0.9 } = req.body || {};
  if (typeof imageHash !== 'string' || imageHash.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: { imageHash } (hex string) required' });
  }
  if (!Array.isArray(existingHashes)) {
    return res.status(400).json({ error: 'Invalid payload: existingHashes must be an array of hex strings' });
  }
  const t = Math.max(0, Math.min(1, Number(threshold)));
  const { similarity } = bestHashSimilarity(imageHash, existingHashes);
  const isDuplicate = similarity >= t;
  return res.json({ isDuplicate, similarity });
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`AI Utility Server listening on port ${PORT}`);
});
