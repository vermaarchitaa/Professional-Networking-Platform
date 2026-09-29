import React, { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, UploadIcon } from "@/Components/CoverPhotoFlow/icons";
import {
  BUILTIN_COVERS,
  COVER_ACCEPT,
  createGradientCoverDataUrl,
  validateCoverFile,
} from "@/Components/CoverPhotoFlow/coverUtils";
import styles from "./styles.module.css";

export default function CoverPhotoPicker({ error, onClose, onUploadFile, onChooseBuiltin }) {
  const fileInputRef = useRef(null);
  const [selectedId, setSelectedId] = useState("");
  const [localError, setLocalError] = useState("");
  const thumbs = useMemo(
    () => BUILTIN_COVERS.map((cover) => ({ ...cover, preview: createGradientCoverDataUrl(cover.stops) })),
    []
  );

  useEffect(() => {
    setLocalError("");
  }, [selectedId]);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const message = validateCoverFile(file);
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError("");
    onUploadFile(file);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-cover-title"
      >
        <header className={styles.header}>
          <h2 id="add-cover-title">Add a cover image</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          <button type="button" className={styles.option} onClick={() => fileInputRef.current?.click()}>
            <span className={styles.optionIcon}>
              <UploadIcon />
            </span>
            <span>
              <span className={styles.optionTitle}>Upload single photo</span>
              <span className={styles.optionHint}>JPEG, PNG, GIF, or WebP up to 5MB</span>
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={COVER_ACCEPT}
            hidden
            onChange={handleFile}
          />

          <h3 className={styles.sectionTitle}>Choose an image</h3>
          <div className={styles.gallery}>
            {thumbs.map((cover) => (
              <button
                type="button"
                key={cover.id}
                className={`${styles.choice} ${selectedId === cover.id ? styles.choiceSelected : ""}`}
                onClick={() => setSelectedId(cover.id)}
              >
                <img src={cover.preview} alt="" className={styles.choiceImg} />
                <span className={styles.choiceName}>{cover.name}</span>
              </button>
            ))}
          </div>
          {(localError || error) ? <p className={styles.error}>{localError || error}</p> : null}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            disabled={!selectedId}
            onClick={() => onChooseBuiltin(selectedId)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
