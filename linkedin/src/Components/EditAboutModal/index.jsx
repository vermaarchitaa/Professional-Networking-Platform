import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";

export const ABOUT_MAX_LENGTH = 2600;

export default function EditAboutModal({
  isOpen,
  initialValue = "",
  isSaving = false,
  error = "",
  onClose,
  onSave,
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (isOpen) setText(String(initialValue || ""));
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSaving) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    setText(event.target.value.slice(0, ABOUT_MAX_LENGTH));
  };

  const handleSave = () => {
    if (isSaving) return;
    onSave?.(text);
  };

  return (
    <div className={styles.overlay} onClick={() => !isSaving && onClose?.()} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-about-title"
      >
        <header className={styles.header}>
          <h2 id="edit-about-title">Edit about</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            disabled={isSaving}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.help}>
            You can write about your years of experience, industry, or skills. People also talk about their achievements or previous job experiences.
          </p>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={handleChange}
            maxLength={ABOUT_MAX_LENGTH}
            rows={10}
            aria-label="About"
          />
          <p className={styles.counter}>
            {text.length.toLocaleString("en-US")}/{ABOUT_MAX_LENGTH.toLocaleString("en-US")}
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
