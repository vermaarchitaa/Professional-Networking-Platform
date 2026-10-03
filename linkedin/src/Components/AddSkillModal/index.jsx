import React, { useEffect, useState } from "react";
import { SKILL_NAME_MAX, getSkillSuggestions, normalizeSkillName, skillKey } from "@/Components/SkillsSection/skillUtils";
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
      setFormError("Skill is required");
      return;
    }
    if (duplicate) {
      setFormError("That skill is already added");
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
          <h2 id="add-skill-title">Add skill</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close" disabled={isSaving}>
            ×
          </button>
        </header>
        <div className={styles.body}>
          <p className={styles.requiredNote}>* Indicates required</p>
          <label className={styles.field}>
            Skill*
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                autoFocus
                value={query}
                maxLength={SKILL_NAME_MAX}
                placeholder="Skill (ex: Project Management)"
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
              <p className={styles.suggestLabel}>Suggested based on your profile</p>
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
          {formError || error ? <p className={styles.error}>{formError || error}</p> : null}
        </div>
        <footer className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={!canSave}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
