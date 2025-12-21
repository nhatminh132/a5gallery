# AI Context

This document summarizes the website, AI-related architecture, and the work implemented in this project.

## Website Overview
- Stack: Vite + React + TypeScript + Tailwind CSS
- Auth/Storage: Supabase (profiles, media, comments/likes, tags, albums, etc.)
- Key pages/components:
  - Media browsing: Gallery, Images, Videos, Albums
  - Upload flows: UploadModal, BulkUpload, AvatarUpload
  - Media details: MediaDetailModal (title/description edits, AI Captioner)
  - Social: CommentsLikes (commenting + likes)
  - Admin tools: AdminDashboard, SliderAdmin, ThumbnailRegenerator, etc.
- Environment variables (frontend) in `.env`:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_AI_SERVER_URL` (base URL for AI Utility Server)

## AI Utility Server (Backend)
A lightweight, stateless Node.js Express server that exposes simple AI/logic endpoints. Designed for AWS EC2 Free Tier (CPU-only).

- Location: `ai-utility-server/`
- Stack: Node.js (Express), optional Python worker for captioning
- Default port: 8080 (`PORT`)
- CORS enabled; JSON bodies limited to 256kb

### Endpoints
1) Text Moderation
   - `POST /ai/moderate`
   - Input: `{ text: string }`
   - Output: `{ isToxic: boolean, score: number, reasons: string[] }`
   - Method: Rule-based profanity detection (EN + VI), diacritics/leet normalization; no ML.

2) Recommendation Logic (Rule-based)
   - `POST /ai/recommend`
   - Input:
     ```json
     {
       "caption?": "string",
       "newHash?": "hex string",
       "existingHashes?": ["hex", ...],
       "engagement?": { "views?": n, "likes?": n, "comments?": n },
       "thresholds?": {
         "duplicate?": 0..1,
         "lowEngagement?": { "likesPerView?": n, "commentsPerView?": n }
       }
     }
     ```
   - Output: `{ suggestions: string[], warnings: string[], meta?: { similarity?: number } }`
   - Method: rule-based checks (missing/short caption, dedupe similarity via hashes, low engagement heuristics).

3) Image Deduplication Helper
   - `POST /ai/dedupe`
   - Input: `{ imageHash: string, existingHashes?: string[], threshold?: number }`
   - Output: `{ isDuplicate: boolean, similarity: number }`
   - Method: Hamming similarity on hex-normalized perceptual hashes (client-side aHash helper provided).

4) Real Image Captioning (CPU, open-source BLIP)
   - `POST /ai/caption`
   - Input: `{ image_url: string }`
   - Output: `{ caption: string }`
   - Internals: Proxies to a local Python worker (`CAPTION_SERVER_URL`, default `http://127.0.0.1:8090`).

### Utilities
- Profanity + normalization: `ai-utility-server/utils/profanity.js`
- Hash similarity: `ai-utility-server/utils/hash.js`

### Python Caption Worker
- Location: `ai-utility-server/python/`
- File: `caption_server.py` (FastAPI + Transformers + Pillow)
- Requirements: `requirements.txt`
- Model: `Salesforce/blip-image-captioning-base` (CPU, loaded once at startup)
- Endpoint: `POST /caption` -> `{ caption }`
- Pipeline:
  1. Download image with timeout, validate `Content-Type: image/*` and size cap.
  2. Convert to RGB via Pillow.
  3. Run BLIP pipeline (image-to-text) on CPU.
  4. Clean/normalize sentence (short, factual, no emojis/identity guessing).

## Frontend Integrations
The frontend calls the AI Utility Server using `src/lib/aiClient.ts` (helpers: `moderateText`, `dedupe`, `recommend`).

1) Moderation in flows
- Comments (CommentsLikes.tsx):
  - Call `moderateText()` before submitting; block toxic; fallback to local `sanitizeUserText`.
- Media titles/descriptions (MediaDetailModal.tsx):
  - Moderate before saving edits; fallback to local checks.
- Uploads (UploadModal.tsx, BulkUpload.tsx):
  - Moderate title/description before upload; fallback to local checks.

2) Deduplication during upload
- UploadModal.tsx / BulkUpload.tsx:
  - Compute client-side aHash (`src/lib/imageHash.ts`) and call `dedupe()` against batch hashes.
  - Non-blocking duplicate warnings shown in a blue info panel.

3) Recommendations after successful upload
- UploadModal.tsx / BulkUpload.tsx:
  - Call `recommend()` with caption/hash after each successful upload.
  - Display suggestions/warnings in a non-intrusive blue panel.

4) AI Captioner (MediaDetailModal.tsx)
- UI renamed from "Caption Assistant" to "AI Captioner" (no new component added).
- Suggest/Regenerate button generates editable captions.
- Initially used rule-based heuristics; now replaced by real AI via backend `POST /ai/caption` (compatible contract kept through Node proxy).

5) AI Status Indicator
- Component: `src/components/AIStatus.tsx`
- Displayed in `Footer.tsx`; shows AI reachability (OK/Down/N/A) and can manually re-check.

## Environment Variables
- Frontend:
  - `VITE_AI_SERVER_URL` (e.g., `http://localhost:8080` or `http://EC2_PUBLIC_IP:8080`)
- Node AI Utility Server:
  - `PORT` (default 8080)
  - `CAPTION_SERVER_URL` (default `http://127.0.0.1:8090`)
- Python Caption Worker:
  - `CAPTION_PORT` (default 8090)
  - `IMG_TIMEOUT`, `MAX_IMG_BYTES` (optional)

## Deployment (EC2 Ubuntu, CPU-only)
- Python worker:
  - Python venv, install requirements, run `caption_server.py` (prefer systemd: `ai-caption.service`).
- Node server:
  - Run `server.js` with `CAPTION_SERVER_URL` pointing to the Python worker (prefer systemd: `ai-utility.service`).
- Security Group:
  - Open the public port for Node (e.g., 8080) or place behind Nginx on port 80.

## API Contracts (unchanged)
- `POST /ai/moderate` -> `{ isToxic, score, reasons }`
- `POST /ai/recommend` -> `{ suggestions, warnings, meta? }`
- `POST /ai/dedupe` -> `{ isDuplicate, similarity }`
- `POST /ai/caption` -> `{ caption }`

## Notes & Constraints
- No paid APIs; open-source BLIP model used for captioning on CPU.
- Stateless server design; model loads once at Python worker startup.
- Frontend UI unchanged except renaming label to "AI Captioner" and adding an AI status indicator in the footer.
- Validation and fallbacks included (graceful errors, safe default caption).

## Run Instructions
See `RUN_INSTRUCTIONS.txt` for detailed local and EC2 commands, systemd units, and troubleshooting.
