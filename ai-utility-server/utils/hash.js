// Hash utilities for duplicate detection based on perceptual hashes (hex strings)
// No external dependencies.

function hexToBinary(hex) {
  const clean = String(hex || '').trim().toLowerCase();
  if (!/^([0-9a-f]+)$/.test(clean)) return null;
  return clean
    .split('')
    .map((c) => parseInt(c, 16).toString(2).padStart(4, '0'))
    .join('');
}

export function normalizeHexHash(hex) {
  const b = hexToBinary(hex);
  return b;
}

export function hammingSimilarity(binA, binB) {
  if (!binA || !binB) return 0;
  if (binA.length !== binB.length) {
    // Compare on the overlapping portion only
    const len = Math.min(binA.length, binB.length);
    binA = binA.slice(0, len);
    binB = binB.slice(0, len);
  }
  let same = 0;
  for (let i = 0; i < binA.length; i++) if (binA[i] === binB[i]) same++;
  return binA.length > 0 ? same / binA.length : 0;
}

export function bestHashSimilarity(targetHex, candidatesHex = []) {
  const targetBin = normalizeHexHash(targetHex);
  if (!targetBin) return { similarity: 0 };
  let best = 0;
  for (const h of candidatesHex) {
    const bin = normalizeHexHash(h);
    if (!bin) continue;
    const sim = hammingSimilarity(targetBin, bin);
    if (sim > best) best = sim;
  }
  return { similarity: Number(best.toFixed(3)) };
}
