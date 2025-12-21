// Simple client-side NSFW detector (heuristic-based)
// Note: This is a lightweight fallback that estimates skin-tone coverage
// using YCbCr thresholds. It's conservative and may produce false positives/negatives.
// The interface is generic so you can later swap in a model-based detector
// (e.g., nsfwjs, onnxruntime-web) without changing callers.

export interface NsfwAnalysisResult {
  safe: boolean;
  score: number; // 0 (safe) .. 1 (likely nsfw)
  reason?: string;
}

export async function analyzeImageFile(file: File, options?: { sampleStride?: number; maxDimension?: number; unsafeThreshold?: number; }): Promise<NsfwAnalysisResult> {
  if (!file.type.startsWith('image/')) {
    return { safe: true, score: 0, reason: 'non-image' };
  }

  const opts = {
    sampleStride: 4, // sample every 4th pixel to speed up
    maxDimension: 512, // scale down for performance
    unsafeThreshold: 0.35, // proportion of skin-like pixels considered unsafe
    ...options,
  };

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const { canvas, ctx, scale } = prepCanvas(img, opts.maxDimension);
    ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let skinLikeCount = 0;
    let sampled = 0;

    // Iterate with stride (each pixel = 4 bytes RGBA)
    for (let y = 0; y < height; y += opts.sampleStride) {
      for (let x = 0; x < width; x += opts.sampleStride) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 10) continue; // ignore transparent
        if (isSkinYCbCr(r, g, b)) skinLikeCount++;
        sampled++;
      }
    }

    const proportion = sampled > 0 ? skinLikeCount / sampled : 0;
    const unsafe = proportion >= opts.unsafeThreshold;
    return {
      safe: !unsafe,
      score: Math.min(1, Math.max(0, proportion)),
      reason: unsafe ? `skin-like proportion ${proportion.toFixed(2)} >= threshold ${opts.unsafeThreshold}` : `skin-like proportion ${proportion.toFixed(2)}`,
    };
  } catch (e: any) {
    // On failure, be safe by allowing but mark unknown
    return { safe: true, score: 0, reason: `analysis_failed: ${e?.message || e}` };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function isImageSafe(file: File, options?: { sampleStride?: number; maxDimension?: number; unsafeThreshold?: number; }): Promise<boolean> {
  const res = await analyzeImageFile(file, options);
  return res.safe;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('failed_to_load_image'));
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function prepCanvas(img: HTMLImageElement, maxDimension: number) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no_2d_context');
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  return { canvas, ctx, scale };
}

// Rough skin detection using YCbCr thresholds (range taken from common literature)
// Convert RGB to YCbCr and test if pixel falls in typical skin cluster
function isSkinYCbCr(r: number, g: number, b: number): boolean {
  // ITU-R BT.601 conversion
  const y = 0 + 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Typical skin cluster bounds (broad)
  const skin = cb > 85 && cb < 135 && cr > 135 && cr < 180;

  // Additional simple constraints to reduce false positives
  const rgbConstraint = r > 60 && g > 40 && b > 20 && r > g && r > b;

  return skin && rgbConstraint;
}
