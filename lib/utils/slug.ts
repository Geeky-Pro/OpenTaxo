/**
 * Arabic-to-Latin transliteration mapping.
 * Covers the most common Arabic characters for URL-safe slug generation.
 */
const ARABIC_TRANSLITERATION: Record<string, string> = {
  'ا': 'a',
  'أ': 'a',
  'إ': 'i',
  'آ': 'aa',
  'ب': 'b',
  'ت': 't',
  'ث': 'th',
  'ج': 'j',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'dh',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w',
  'ي': 'y',
  'ى': 'a',
  'ة': 'h',
  'ئ': 'y',
  'ؤ': 'w',
  'ء': '',
  // Common diacritics — stripped
  '\u064B': '', // fathatan
  '\u064C': '', // dammatan
  '\u064D': '', // kasratan
  '\u064E': '', // fatha
  '\u064F': '', // damma
  '\u0650': '', // kasra
  '\u0651': '', // shadda
  '\u0652': '', // sukun
};

/**
 * Transliterate an Arabic string to Latin characters.
 */
function transliterate(input: string): string {
  let result = '';
  for (const char of input) {
    const mapped = ARABIC_TRANSLITERATION[char];
    if (mapped !== undefined) {
      result += mapped;
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Generate a URL-safe slug from an Arabic or English string.
 *
 * - Converts Arabic characters to a simplified Latin transliteration.
 * - Lowercases, trims, replaces spaces with hyphens.
 * - Removes non-alphanumeric characters (except hyphens).
 *
 * If the slug collides with an existing slug in the provided list,
 * appends -1, -2, etc. until unique.
 *
 * @param name - The input string (Arabic or English).
 * @param existingSlugs - Array of slugs already in use.
 * @returns A unique, URL-safe slug.
 */
export function normalizeSlug(input: string): string {
  let slug = transliterate(input).toLowerCase();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-+|-+$/g, '');
  return slug;
}

/**
 * Generate a URL-safe slug from an Arabic or English string.
 * Appends a numeric suffix when the normalized slug already exists.
 */
export function generateSlug(name: string, existingSlugs: string[]): string {
  const slug = normalizeSlug(name) || 'category';
  const existingSet = new Set(existingSlugs);

  if (!existingSet.has(slug)) return slug;

  let counter = 1;
  while (existingSet.has(`${slug}-${counter}`)) {
    counter++;
  }

  return `${slug}-${counter}`;
}

/**
 * Normalizes an Arabic or English name into a lowercase snake_case key
 * matching the central definition format /^[a-z][a-z0-9_]{1,62}$/.
 */
export function normalizeKey(
  primaryName?: string | null,
  fallbackName?: string | null,
  defaultPrefix = 'key'
): string {
  const raw = (primaryName && primaryName.trim()) || (fallbackName && fallbackName.trim()) || '';
  if (!raw) {
    return `${defaultPrefix}_${Date.now().toString(36).slice(-6)}`;
  }

  let text = transliterate(raw).toLowerCase();
  text = text.replace(/[^a-z0-9]+/g, '_');
  text = text.replace(/_+/g, '_').replace(/^_+|_+$/g, '');

  if (!text || !/^[a-z]/.test(text)) {
    text = `${defaultPrefix}_${text}`.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  }

  if (text.length === 1) {
    text = `${text}_${defaultPrefix}`;
  }

  if (text.length > 63) {
    text = text.slice(0, 63).replace(/_+$/, '');
  }

  if (!/^[a-z][a-z0-9_]{1,62}$/.test(text)) {
    return `${defaultPrefix}_${Date.now().toString(36).slice(-6)}`;
  }

  return text;
}

/**
 * Generate a unique programmatic key from an Arabic or English string.
 * Appends a numeric suffix (_1, _2, etc.) when the key collides with existing keys.
 */
export function generateKey(
  primaryName?: string | null,
  fallbackName?: string | null,
  existingKeys: string[] | Set<string> = [],
  defaultPrefix = 'key'
): string {
  const base = normalizeKey(primaryName, fallbackName, defaultPrefix);
  const set = existingKeys instanceof Set ? existingKeys : new Set(existingKeys);

  if (!set.has(base)) return base;

  let counter = 1;
  while (true) {
    const suffix = `_${counter}`;
    const maxBaseLen = 63 - suffix.length;
    const trimmedBase = base.slice(0, maxBaseLen).replace(/_+$/, '');
    const candidate = `${trimmedBase}${suffix}`;
    if (!set.has(candidate)) {
      return candidate;
    }
    counter++;
  }
}
