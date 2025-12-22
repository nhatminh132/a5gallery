// Simple profanity detection for English + Vietnamese
// No ML; heuristics + curated lists. Normalize text to catch diacritics and leetspeak.

const EN_PROFANITY = new Set([
  'fuck','shit','bitch','asshole','bastard','damn','dick','pussy','cunt','motherfucker','bullshit',
  'fucking','fucker','nigger','nigga','slut','whore','cock','douche','retard','wanker','prick'
]);

// Vietnamese profanity (normalized without diacritics)
const VI_PROFANITY = new Set([
  'dm','dmm','ditmemay','ditme','dit','cc','cl','cailon','lon','du','loz','lozdit','vl','vailon',
  'cmm','cuk','cac','bo me','cha may','may','dt','chich','buoi','buom','ditconmemay','djt','duma',
]);

// Common obfuscations to help catch simple leetspeak
const LEET_MAP = [
  [/[@]/g, 'a'],
  [/[4]/g, 'a'],
  [/[3]/g, 'e'],
  [/[1!|]/g, 'i'],
  [/[0]/g, 'o'],
  [/[5]/g, 's'],
  [/[7]/g, 't'],
];

// Remove Vietnamese diacritics for comparison
function stripDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/đ/gi, 'd');
}

export function normalizeText(input) {
  let s = String(input || '').toLowerCase();
  s = stripDiacritics(s);
  for (const [re, rep] of LEET_MAP) s = s.replace(re, rep);
  // Collapse repeated punctuation and whitespace
  s = s.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

export function detectProfanity(normalizedText) {
  const tokens = normalizedText.split(' ').filter(Boolean);
  let hits = [];

  // Windowed n-grams up to 3 tokens to capture multi-word insults
  for (let i = 0; i < tokens.length; i++) {
    const uni = tokens[i];
    if (EN_PROFANITY.has(uni) || VI_PROFANITY.has(uni)) hits.push(uni);

    if (i + 1 < tokens.length) {
      const bi = `${tokens[i]} ${tokens[i+1]}`;
      if (VI_PROFANITY.has(bi)) hits.push(bi);
    }
    if (i + 2 < tokens.length) {
      const tri = `${tokens[i]} ${tokens[i+1]} ${tokens[i+2]}`;
      if (VI_PROFANITY.has(tri)) hits.push(tri);
    }
  }

  // Heuristic score: unique hits / (1 + log(len)) bounded [0, 1]
  const uniqueHits = [...new Set(hits)];
  const len = Math.max(1, tokens.length);
  const rawScore = uniqueHits.length / (1 + Math.log2(len + 1));
  const score = Math.max(0, Math.min(1, rawScore));
  return {
    isToxic: score >= 0.2 || uniqueHits.length >= 1,
    score: Number(score.toFixed(3)),
    reasons: uniqueHits,
  };
}
