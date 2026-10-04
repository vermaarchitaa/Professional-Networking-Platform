import React from "react";
import { CloseIcon } from "@/Components/CoverPhotoFlow/icons";
import { tMessage, useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function CoverDeleteDialog({ error, deleting, onCancel, onConfirm }) {
  const { t } = useI18n();
  return (
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-photo-title"
      >
        <header className={styles.header}>
          <h2 id="delete-photo-title">{t("deletePhotoTitle")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label={t("close")}>
            <CloseIcon />
          </button>
        </header>
        <p className={styles.message}>
          {t("deleteCoverHelp")}
        </p>
        {error ? <p className={styles.error}>{tMessage(t, error)}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            {t("noThanks")}
          </button>
          <button type="button" className={styles.deleteBtn} onClick={onConfirm} disabled={deleting}>
            {deleting ? t("deleting") : t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
