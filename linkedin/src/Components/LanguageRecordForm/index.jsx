import React from "react";
import { tEnum, tMessage, useI18n } from "@/i18n";
import styles from "@/Components/EducationRecordForm/styles.module.css";

export const LANGUAGE_NAME_MAX = 80;
export const LANGUAGE_PROFICIENCY_OPTIONS = [
  "Elementary proficiency",
  "Limited working proficiency",
  "Professional working proficiency",
  "Full professional proficiency",
  "Native or bilingual proficiency",
];

export const emptyLanguage = {
  language: "",
  proficiency: "",
};

export function languageKey(value) {
  return String(value || "").trim().toLowerCase();
}

export function cleanLanguage(entry) {
  const proficiency = String(entry?.proficiency || "").trim();
  return {
    language: String(entry?.language || "").trim().slice(0, LANGUAGE_NAME_MAX),
    proficiency: LANGUAGE_PROFICIENCY_OPTIONS.includes(proficiency) ? proficiency : "",
  };
}

export function isFilledLanguage(entry) {
  return Boolean(String(entry?.language || "").trim());
}

export function hasDuplicateLanguage(list, language, excludeIndex = -1) {
  const key = languageKey(language);
  if (!key) return false;
  return (list || []).some((entry, index) => (
    index !== excludeIndex && languageKey(entry?.language) === key
  ));
}

export default function LanguageRecordForm({
  value,
  onChange,
  error = "",
}) {
  const { t } = useI18n();
  const language = value?.language || "";
  const proficiency = value?.proficiency || "";

  const patch = (field, nextValue) => {
    onChange?.({ ...emptyLanguage, ...value, [field]: nextValue });
  };

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        {t("languageField")}
        <input
          autoFocus
          value={language}
          maxLength={LANGUAGE_NAME_MAX}
          onChange={(event) => patch("language", event.target.value.slice(0, LANGUAGE_NAME_MAX))}
          placeholder={t("languageEx")}
        />
      </label>
      <label className={styles.field}>
        {t("proficiencyLevel")}
        <select
          value={proficiency}
          onChange={(event) => patch("proficiency", event.target.value)}
        >
          <option value="">{t("selectProficiency")}</option>
          {LANGUAGE_PROFICIENCY_OPTIONS.map((option) => (
            <option key={option} value={option}>{tEnum(t, option)}</option>
          ))}
        </select>
      </label>
      {error ? <p className={styles.error}>{tMessage(t, error)}</p> : null}
    </div>
  );
}
