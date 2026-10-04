import React, { useEffect, useState } from "react";
import { SKILL_NAME_MAX, getSkillSuggestions, normalizeSkillName, skillKey } from "@/Components/SkillsSection/skillUtils";
import { tMessage, useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function AddSkillModal({
  isOpen,
  profile,
  existingNames = [],
  isSaving = false,
  error = "",
  onClose,
  onSave,
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setFormError("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSaving) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const value = normalizeSkillName(query);
  const suggestions = getSkillSuggestions(profile, existingNames, value);
  const duplicate = existingNames.some((name) => skillKey(name) === skillKey(value));
  const canSave = Boolean(value) && !duplicate && !isSaving;

  const handleSave = () => {
    if (!value) {
      setFormError("skillRequired");
      return;
    }
    if (duplicate) {
      setFormError("skillAlreadyAdded");
      return;
    }
    setFormError("");
    onSave?.(value);
  };

  return (
    <div className={styles.overlay} onClick={() => !isSaving && onClose?.()} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-skill-title"
      >
        <header className={styles.header}>
          <h2 id="add-skill-title">{t("addSkill")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")} disabled={isSaving}>
            ×
          </button>
        </header>
        <div className={styles.body}>
          <p className={styles.requiredNote}>{t("indicatesRequired")}</p>
          <label className={styles.field}>
            {t("skillStar")}
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                autoFocus
                value={query}
                maxLength={SKILL_NAME_MAX}
                placeholder={t("skillPlaceholder")}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (formError) setFormError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
          </label>
          {suggestions.length > 0 ? (
            <div className={styles.suggestBlock}>
              <p className={styles.suggestLabel}>{t("suggestedSkills")}</p>
              <div className={styles.chips}>
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={styles.chip}
                    onClick={() => {
                      setQuery(name);
                      setFormError("");
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {formError || error ? <p className={styles.error}>{tMessage(t, formError || error)}</p> : null}
        </div>
        <footer className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={!canSave}>
            {isSaving ? t("saving") : t("save")}
          </button>
        </footer>
      </div>
    </div>
  );
}
