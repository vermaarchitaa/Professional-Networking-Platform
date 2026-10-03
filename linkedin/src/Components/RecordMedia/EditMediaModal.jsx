import React from "react";
import { getMediaUrl } from "@/config/utils";
import {
  EDUCATION_MEDIA_DESCRIPTION_MAX,
  EDUCATION_MEDIA_NAME_MAX,
} from "@/Components/EducationRecordForm";
import styles from "@/Components/EditEducationModal/styles.module.css";

export default function EditMediaModal({
  item,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onClose,
  onSave,
  onDelete,
}) {
  if (!item) return null;

  return (
    <div className={styles.nestedOverlay} onClick={onClose} role="presentation">
      <div className={styles.editMediaDialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="edit-media-title">
        <header className={styles.header}>
          <h2 id="edit-media-title">Edit media</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className={styles.editMediaBody}>
          <label className={styles.nestedLabel}>
            Title
            <input
              autoFocus
              value={title}
              maxLength={EDUCATION_MEDIA_NAME_MAX}
              onChange={(event) => onTitleChange(event.target.value.slice(0, EDUCATION_MEDIA_NAME_MAX))}
            />
          </label>
          <p className={styles.charCount}>{title.length}/{EDUCATION_MEDIA_NAME_MAX}</p>
          <label className={styles.nestedLabel}>
            Description
            <textarea
              className={styles.editMediaTextarea}
              value={description}
              maxLength={EDUCATION_MEDIA_DESCRIPTION_MAX}
              onChange={(event) => onDescriptionChange(event.target.value.slice(0, EDUCATION_MEDIA_DESCRIPTION_MAX))}
              rows={4}
            />
          </label>
          <p className={styles.charCount}>{description.length}/{EDUCATION_MEDIA_DESCRIPTION_MAX}</p>
          <div className={styles.editMediaPreview}>
            {item.type === "image" ? (
              <img src={getMediaUrl(item.url)} alt="" />
            ) : (
              <span className={styles.mediaBadge}>{item.type === "document" ? "DOC" : "LINK"}</span>
            )}
          </div>
        </div>
        <footer className={styles.editMediaFooter}>
          <button type="button" className={styles.deleteBtn} onClick={onDelete}>Delete</button>
          <div className={styles.footerRight}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Back</button>
            <button type="button" className={styles.saveBtn} onClick={onSave}>Save</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
