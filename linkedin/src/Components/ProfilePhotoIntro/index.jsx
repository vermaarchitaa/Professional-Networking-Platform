import React from "react";
import { CloseIcon } from "@/Components/CoverPhotoFlow/icons";
import styles from "./styles.module.css";

const SAMPLES = [
  { bg: "#7b8fa1", label: "A" },
  { bg: "#c48a3a", label: "B" },
  { bg: "#5b7c99", label: "C" },
  { bg: "#8a6d8f", label: "D" },
  { bg: "#6d8b74", label: "E" },
];

export default function ProfilePhotoIntro({ error, onClose, onUseCamera, onUploadPhoto }) {
  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-photo-title"
      >
        <header className={styles.header}>
          <h2 id="add-photo-title">Add photo</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          <h3>No professional headshot needed!</h3>
          <p className={styles.subhead}>Just something that represents you.</p>
          <div className={styles.samples} aria-hidden="true">
            {SAMPLES.map((sample) => (
              <span key={sample.label} className={styles.sample} style={{ background: sample.bg }}>
                {sample.label}
              </span>
            ))}
          </div>
          <p className={styles.note}>
            Please use a real photo of yourself. After you take or upload one, you can crop, filter, and adjust it before it appears on your profile.
          </p>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.secondaryBtn} onClick={onUseCamera}>
            Use Camera
          </button>
          <button type="button" className={styles.primaryBtn} onClick={onUploadPhoto}>
            Upload photo
          </button>
        </div>
      </div>
    </div>
  );
}
