export const LANGUAGE_STORAGE_KEY = "selectedLanguage";
export const DEFAULT_LANGUAGE = "en";

export const LANGUAGES = [
  { code: "en", label: "English (English)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "fr", label: "Français (French)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "ja", label: "日本語 (Japanese)" },
  { code: "zh", label: "中文 (Chinese)" },
  { code: "pt", label: "Português (Portuguese)" },
];

export const LANGUAGE_CODES = LANGUAGES.map((item) => item.code);

export function isSupportedLanguage(code) {
  return LANGUAGE_CODES.includes(code);
}

const INTL_LOCALES = {
  en: "en",
  hi: "hi",
  es: "es",
  fr: "fr",
  de: "de",
  ja: "ja",
  zh: "zh-CN",
  pt: "pt",
};

export function toIntlLocale(code) {
  return INTL_LOCALES[code] || "en";
}

export function formatMonthName(language, monthIndex) {
  return new Intl.DateTimeFormat(toIntlLocale(language), { month: "long" }).format(new Date(2000, monthIndex, 1));
}

export function getMonthOptions(language) {
  return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((value, index) => ({
    value,
    label: formatMonthName(language, index),
  }));
}
