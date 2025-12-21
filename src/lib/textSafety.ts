// Text safety utility: hybrid rule-based + optional AI hook
// Supports Vietnamese and English profanity/NSFW words.
// Use sanitizeUserText(...) before saving user-generated content.

export type SafetyResult = {
  safe: boolean;
  reasons: string[]; // e.g., ["profanity", "nsfw", "hate", "sexual"]
  filteredText: string; // basic redaction for display, original should not be persisted if unsafe
};

// Helper: build flexible regex that tolerates repeated letters and common separators/leetspeak.
function flexible(word: string, { boundary = true, leet = true }: { boundary?: boolean; leet?: boolean } = {}) {
  // Character alternatives without quantifiers; we will add ( ... )+ ourselves
  const map: Record<string, string> = leet
    ? {
        a: '[a@áàâãä4]',
        e: '[e€éèêë3]',
        i: '[iíìîï1!l]',
        o: '[oóòôõö0]',
        u: '[uúùûüv]',
        s: '[s$5]',
        t: '[t7]',
        g: '[g9]',
        b: '[b8]',
        c: '[ckq]',
        l: '[l1!]',
        d: '[d]',
        r: '[r]',
        n: '[n]',
        m: '[m]',
        f: '[f]',
        h: '[h]',
        p: '[p]',
        y: '[y]',
        x: '[x]',
      }
    : {};

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const chars = Array.from(word).map((ch) => {
    if (ch === ' ') return '\\s*';
    const base = map[ch.toLowerCase()] || escapeRegex(ch);
    // Allow repeated letter/variant and optional separators/non-word chars between
    return `(?:${base})+[^A-Za-z0-9]*`;
  });
  const body = chars.join('');
  const source = `${boundary ? '\\b' : ''}${body}${boundary ? '\\b' : ''}`;
  return new RegExp(source, 'gi');
}

// WORD LISTS (expandable)
const EN_PROFANITY_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'pussy', 'motherfucker', 'bastard',
  'douche', 'douchebag', 'dickhead', 'prick', 'slag', 'slut', 'whore', 'bloody', 'bollocks',
  'bugger', 'wanker', 'twat', 'arsehole', 'jackass', 'dipshit', 'bullshit', 'goddamn', 'wtf',
  'stfu', 'ffs'
];

const EN_NSFW_WORDS = [
  'porn', 'porno', 'pornhub', 'xxx', 'nsfw', 'nude', 'nudity', 'explicit', 'erotic', 'erotica',
  'blowjob', 'handjob', 'rimjob', 'anal', 'cum', 'semen', 'orgasm', 'deepthroat', 'gangbang',
  'creampie', 'milf', 'bdsm', 'hentai', 'boobs', 'tits', 'nipples', 'cock', 'pussy', 'vagina',
  'penis', 'jerkoff', 'jerk off', 'hand job', 'blow job', 'camgirl', 'camsite', 'onlyfans'
];

const VI_PROFANITY_WORDS = [
  'địt', 'địt mẹ', 'đmm', 'đm', 'dm', 'dcm', 'địt con mẹ', 'đụ', 'đù', 'đéo', 'đếch', 'vcl', 'vl',
  'lồn', 'l*n', 'cặc', 'cak', 'cac', 'đĩ', 'chịch', 'mẹ kiếp', 'mẹ nó', 'bố láo', 'thằng chó',
  'thằng ngu', 'ngu ngốc', 'con mẹ mày', 'm*e', 'clm', 'cc', 'điên', 'khốn nạn', 'láo toét',
];

const VI_NSFW_WORDS = [
  'khiêu dâm', 'dâm dục', 'sex', 'khỏa thân', 'ảnh nóng', 'ảnh nude', 'dương vật', 'âm đạo',
  'xuất tinh', 'hiếp dâm', 'loạn luân', 'phim đen', 'jav', 'quay tay', 'dâm đãng'
];

const HATE_HARASSMENT_WORDS = [
  'kill yourself', 'kys', 'rape', 'rapist', 'retard', 'tr retard', 'faggot', 'nigger', 'spic', 'chink',
];

// Build regex lists from words
const EN_PROFANITY = EN_PROFANITY_WORDS.map((w) => flexible(w));
const EN_NSFw = EN_NSFW_WORDS.map((w) => flexible(w));
const VI_PROFANITY = [
  // Vietnamese: include direct words and some compact acronyms; keep less leet-mapping to avoid false positives
  ...VI_PROFANITY_WORDS.map((w) => flexible(w, { leet: false })),
  /\b(v\s*[cç]\s*l)\b/gi, // vcl
  /\b(clm|cc|dm|dcm|đm|đmm)\b/gi,
];
const VI_NSFw = VI_NSFW_WORDS.map((w) => flexible(w, { leet: false }));
const HATE_HARASSMENT = HATE_HARASSMENT_WORDS.map((w) => flexible(w));

const ALL_PATTERNS: { label: string; list: RegExp[] }[] = [
  { label: 'profanity', list: [...EN_PROFANITY, ...VI_PROFANITY] },
  { label: 'nsfw', list: [...EN_NSFw, ...VI_NSFw] },
  { label: 'hate', list: HATE_HARASSMENT },
];

function redact(text: string, matches: RegExp[]): string {
  let result = text;
  for (const re of matches) {
    const globalRe = new RegExp(re.source, 'gi');
    result = result.replace(globalRe, (m) => '*'.repeat(Math.min(6, m.length)));
  }
  return result;
}

export function checkTextSafety(text: string): SafetyResult {
  const reasons: string[] = [];
  const triggered: RegExp[] = [];

  for (const group of ALL_PATTERNS) {
    for (const re of group.list) {
      if (re.test(text)) {
        reasons.push(group.label);
        triggered.push(re);
      }
    }
  }

  const safe = reasons.length === 0;
  const filteredText = safe ? text : redact(text, triggered);
  return { safe, reasons: Array.from(new Set(reasons)), filteredText };
}

// Hook for optional AI validation; here it’s a stub returning null to avoid network.
// Integrate with an AI provider or on-device model if needed.
export async function checkTextSafetyAI(text: string): Promise<SafetyResult | null> {
  return null;
}

export async function sanitizeUserText(text: string): Promise<SafetyResult> {
  const base = checkTextSafety(text);
  if (!base.safe) return base;

  const ai = await checkTextSafetyAI(text);
  return ai ?? base;
}
