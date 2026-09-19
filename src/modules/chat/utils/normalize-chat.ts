/**
 * Chat compliance normalizer (SRS §6.1–6.3).
 * Produces a canonical form of the message so evasion tricks
 * (Arabic-Indic digits, homoglyphs, separators, spelled-out digits)
 * collapse into something the regex rules can catch.
 */

const ARABIC_INDIC: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

// Homoglyphs commonly used to fake digits
const HOMOGLYPHS: Record<string, string> = {
  O: '0', o: '0', Q: '0',
  l: '1', I: '1', '|': '1',
  S: '5', s: '5',
  B: '8',
  g: '9', q: '9',
};

const SPELLED_DIGITS_EN: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
};

const SPELLED_DIGITS_AR: Record<string, string> = {
  'صفر': '0', 'واحد': '1', 'واحده': '1', 'اتنين': '2', 'اثنين': '2',
  'تلاته': '3', 'ثلاثة': '3', 'اربعه': '4', 'أربعة': '4', 'اربعة': '4',
  'خمسه': '5', 'خمسة': '5', 'سته': '6', 'ستة': '6',
  'سبعه': '7', 'سبعة': '7', 'تمانيه': '8', 'ثمانية': '8',
  'تسعه': '9', 'تسعة': '9',
};

export interface NormalizedChat {
  /** Original message, digits/scripts unified, case preserved */
  canonical: string;
  /** canonical with ALL separators stripped — catches "0 1 0 1 2 3 4 5 6 7 8" and "010-1234-5678" */
  squashed: string;
}

export function normalizeChatMessage(raw: string): NormalizedChat {
  let s = raw ?? '';

  // 1. Arabic-Indic → Western digits
  s = s.replace(/[٠-٩]/g, (ch) => ARABIC_INDIC[ch] ?? ch);

  // 2. Spelled-out digits → numeric (EN + AR), word-boundary safe
  for (const [word, digit] of Object.entries(SPELLED_DIGITS_EN)) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  for (const [word, digit] of Object.entries(SPELLED_DIGITS_AR)) {
    s = s.split(word).join(digit);
  }

  // 3. Homoglyph collapse ONLY inside digit-ish runs
  //    (avoid corrupting normal words: apply when char is adjacent to a digit)
  s = s.replace(/[OoQlI|SsBgq](?=\d)|(?<=\d)[OoQlI|SsBgq]/g, (ch) => HOMOGLYPHS[ch] ?? ch);

  // 4. Normalize "at/dot" email obfuscation
  s = s
    .replace(/\s*[\[\(]?\s*at\s*[\]\)]?\s*/gi, '@')
    .replace(/\s*[\[\(]?\s*dot\s*[\]\)]?\s*/gi, '.');

  const canonical = s;
  // 5. Squashed: strip spaces, dots, dashes, parens between everything
  const squashed = s.replace(/[\s.\-()_]+/g, '');

  return { canonical, squashed };
  
  
}