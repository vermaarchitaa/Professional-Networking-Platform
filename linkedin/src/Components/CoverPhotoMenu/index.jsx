import React from "react";
import { CloseIcon, ImageIcon, PencilIcon, TrashIcon } from "@/Components/CoverPhotoFlow/icons";
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
          <h2 id="cover-photo-title">Cover photo</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.preview}>
          {coverSrc ? (
            <img src={coverSrc} alt="Current cover" className={styles.previewImg} />
          ) : (
            <div className={styles.previewFallback} aria-label="Default cover" />
          )}
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={onEdit}>
            <PencilIcon />
            Edit
          </button>
          <button type="button" className={styles.actionBtn} onClick={onChangePhoto}>
            <ImageIcon />
            Change photo
          </button>
          <button type="button" className={styles.actionBtn} onClick={onDelete} disabled={!hasCover}>
            <TrashIcon />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
