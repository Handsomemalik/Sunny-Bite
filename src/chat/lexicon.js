/**
 * SunnyBite Roman Urdu Lexicon & Language Utilities
 * Enables natural bilingual comprehension (English and Roman Urdu).
 */

export const ROMAN_URDU_NUMBERS = {
  "ek": 1,
  "aik": 1,
  "one": 1,
  "a": 1,
  "an": 1,
  "do": 2,
  "two": 2,
  "teen": 3,
  "three": 3,
  "char": 4,
  "chaar": 4,
  "four": 4,
  "paanch": 5,
  "panch": 5,
  "five": 5,
  "chay": 6,
  "che": 6,
  "six": 6,
  "saat": 7,
  "sat": 7,
  "seven": 7,
  "aath": 8,
  "ath": 8,
  "eight": 8,
  "nau": 9,
  "no": 9,
  "nine": 9,
  "das": 10,
  "dass": 10,
  "ten": 10
};

export const ROMAN_URDU_KEYWORDS = {
  order_verbs: [
    "chahiye", "chaheay", "dena", "dedo", "de do", "bhej do", "bhejdo", "bhejo",
    "daal do", "daalo", "add karo", "laga do", "mangwana hai", "mangwa do",
    "order karna hai", "order kardo", "order kar do", "le aao", "lao"
  ],
  remove_verbs: [
    "hata do", "hatado", "remove karo", "cancel kardo", "cancel kar do",
    "nahi chahiye", "ni chahiye", "mat daalo", "nikal do", "nikalo"
  ],
  inquiry_words: [
    "kitna", "kitne", "kya", "kahan", "kider", "kidhar", "timing", "timings",
    "kab", "khula", "band", "menu dikhao", "menu dekhna hai", "bill",
    "paisa", "rupaye", "rabta", "number do", "phone do"
  ],
  affirmative: [
    "haan", "han", "jee", "ji", "theek hai", "thik hai", "bilkul", "sahi", "ok", "okay", "yes"
  ],
  negative: [
    "nahi", "nahin", "na", "no", "nope"
  ],
  politeness: [
    "shukriya", "jazakallah", "meherbani", "plz", "please", "bhai"
  ]
};

/**
 * Detects whether the user is typing predominantly in Roman Urdu, English, or mixed.
 */
export function detectLanguage(text) {
  const norm = text.toLowerCase();
  const words = norm.split(/\s+/).filter(Boolean);

  let urduHits = 0;
  const urduMarkers = [
    "mujhe", "chahiye", "karo", "karna", "hai", "hain", "kya", "kahan", "kidhar",
    "kab", "kitna", "kitne", "bhejo", "bhej", "aur", "ek", "aik", "do", "teen",
    "chaar", "paanch", "nahi", "nahin", "theek", "shukriya", "bhai", "daalo",
    "laga", "dena", "dedo", "karein", "aap", "tum", "mera", "meri", "hum"
  ];

  for (const w of words) {
    if (urduMarkers.includes(w)) urduHits++;
  }

  if (urduHits >= 2) return 'ur';
  if (urduHits === 1 && words.length <= 4) return 'ur';
  return 'en';
}
