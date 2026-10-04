import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  formatMonthName,
  getMonthOptions,
  isSupportedLanguage,
  toIntlLocale,
} from "./languages";
import { ENUM_KEYS, MESSAGE_ALIASES, translate } from "./translations";

const LanguageContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, vars) => translate(DEFAULT_LANGUAGE, key, vars),
  languages: LANGUAGES,
});

const readStoredLanguage = () => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (code) => {
    const next = isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
    setLanguageState(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures and keep the in-memory language.
    }
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key, vars) => translate(language, key, vars),
    languages: LANGUAGES,
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  return useContext(LanguageContext);
}

export { formatMonthName, getMonthOptions, toIntlLocale };

export function tEnum(t, value) {
  const key = ENUM_KEYS[value];
  return key ? t(key) : value;
}

export function tMessage(t, message) {
  if (!message) return "";
  const mapped = MESSAGE_ALIASES[message] || message;
  return t(mapped);
}
