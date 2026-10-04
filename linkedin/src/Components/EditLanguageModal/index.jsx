import React, { useEffect, useState } from "react";
import LanguageRecordForm, {
  cleanLanguage,
  emptyLanguage,
  hasDuplicateLanguage,
} from "@/Components/LanguageRecordForm";
import { tMessage, useI18n } from "@/i18n";
import styles from "@/Components/EditEducationModal/styles.module.css";

export default function EditLanguageModal({
  isOpen,
  initialValue = null,
  existingLanguages = [],
  isSaving = false,
  error = "",
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useI18n();
  const isEditing = initialValue != null;
  const [draft, setDraft] = useState({ ...emptyLanguage });
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(initialValue ? { ...emptyLanguage, ...initialValue } : { ...emptyLanguage });
    setFormError("");
    setConfirmDelete(false);
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || isSaving) return;
      if (confirmDelete) {
        setConfirmDelete(false);
        return;
      }
      onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDelete, isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const languageName = String(draft.language || "").trim();
  const canSave = Boolean(languageName) && !isSaving;

  const handleSave = () => {
    const cleaned = cleanLanguage(draft);
    if (!cleaned.language) {
      setFormError("languageRequired");
      return;
    }
    if (hasDuplicateLanguage(existingLanguages, cleaned.language)) {
      setFormError("languageAlreadyAdded");
      return;
    }
    setFormError("");
    onSave?.(cleaned);
  };

  return (
    <div className={styles.overlay} onClick={() => !isSaving && onClose?.()} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-language-title"
      >
        <header className={styles.header}>
          <h2 id="edit-language-title">{isEditing ? t("editLanguage") : t("addLanguageTitle")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")} disabled={isSaving}>
            ×
          </button>
        </header>
        <div className={styles.body}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <p>{t("confirmDeleteLanguage")}</p>
            </div>
          ) : (
            <>
              <p className={styles.help}>
                {isEditing ? t("indicatesRequired") : t("selfIdentifyLanguage")}
              </p>
              <LanguageRecordForm
                value={draft}
                onChange={setDraft}
                error={formError || error}
              />
            </>
          )}
        </div>
        <footer className={styles.footer}>
          {confirmDelete ? (
            <>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmDelete(false)} disabled={isSaving}>
                {t("cancel")}
              </button>
              <button type="button" className={styles.deleteSolid} onClick={() => !isSaving && onDelete?.()} disabled={isSaving}>
                {isSaving ? t("deleting") : t("delete")}
              </button>
            </>
          ) : (
            <>
              {isEditing ? (
                <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)} disabled={isSaving}>
                  {t("delete")}
                </button>
              ) : <span />}
              <div className={styles.footerRight}>
                <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={!canSave}>
                  {isSaving ? t("saving") : t("save")}
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
