// Compute a simple 8x8 average hash (aHash) for an image File and return a hex string
export async function computeAHashHex(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('failed_to_load_image'));
      i.src = url;
    });
    const size = 8;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no_canvas');
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const gray: number[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const v = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        gray.push(v);
      }
    }
    const avg = gray.reduce((a, b) => a + b, 0) / gray.length;
    // Build 64-bit bitstring
    let bits = '';
    for (const v of gray) bits += v >= avg ? '1' : '0';
    // Convert to hex
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const n = parseInt(bits.slice(i, i + 4), 2);
      hex += n.toString(16);
    }
    return hex;
  } finally {
    URL.revokeObjectURL(url);
  }
}
