import React from "react";
import { CloseIcon, ImageIcon, PencilIcon, TrashIcon } from "@/Components/CoverPhotoFlow/icons";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function CoverPhotoMenu({
  coverSrc,
  hasCover,
  error,
  onClose,
  onEdit,
  onChangePhoto,
  onDelete,
}) {
  const { t } = useI18n();
  if (!hasCover) {
    return (
      <div className={styles.overlay} onClick={onClose} role="presentation">
        <div
          className={styles.compactDialog}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cover-photo-title"
        >
          <header className={styles.header}>
            <h2 id="cover-photo-title">{t("coverPhoto")}</h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")}>
              <CloseIcon />
            </button>
          </header>

          <div className={styles.preview}>
            <div className={styles.previewFallback} aria-label={t("defaultCover")} />
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.compactActions}>
            <button type="button" className={styles.actionBtn} onClick={onChangePhoto}>
              <ImageIcon />
              {t("addCoverImage")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-photo-title"
      >
        <header className={styles.header}>
          <h2 id="cover-photo-title">{t("coverPhoto")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")}>
            <CloseIcon />
          </button>
        </header>

        <div className={styles.preview}>
          {coverSrc ? (
            <img src={coverSrc} alt={t("currentCover")} className={styles.previewImg} />
          ) : (
            <div className={styles.previewFallback} aria-label={t("defaultCover")} />
          )}
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={onEdit}>
            <PencilIcon />
            {t("edit")}
          </button>
          <button type="button" className={styles.actionBtn} onClick={onChangePhoto}>
            <ImageIcon />
            {t("changePhoto")}
          </button>
          <button type="button" className={styles.actionBtn} onClick={onDelete}>
            <TrashIcon />
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
