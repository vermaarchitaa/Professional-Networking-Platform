import React, { useEffect, useState } from "react";
import { CloseIcon } from "@/Components/CoverPhotoFlow/icons";
import {
  PHOTO_FRAMES,
  normalizeProfileFrame,
} from "@/Components/ProfilePhotoFlow/photoUtils";
import styles from "./styles.module.css";

const FRAME_CLASS = {
  original: styles.original,
  "open-to-work": styles.openToWork,
  hiring: styles.hiring,
};

export function ProfilePhotoBadge({ src, frameId, className, alt = "" }) {
  const frame = normalizeProfileFrame(frameId);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={`${styles.circle} ${FRAME_CLASS[frame] || styles.original} ${className || ""}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          className={styles.photo}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.photoFallback} />
      )}
      {frame === "open-to-work" ? <span className={styles.bannerOpen}>#OpenToWork</span> : null}
      {frame === "hiring" ? <span className={styles.bannerHiring}>#Hiring</span> : null}
    </div>
  );
}

export default function ProfilePhotoFrames({
  photoSrc,
  frameId,
  saving,
  error,
  onClose,
  onApply,
}) {
  const [selected, setSelected] = useState(() => normalizeProfileFrame(frameId));

  useEffect(() => {
    setSelected(normalizeProfileFrame(frameId));
  }, [frameId]);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-frames-title"
      >
        <header className={styles.header}>
          <h2 id="photo-frames-title">Profile photo frames</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          <ProfilePhotoBadge src={photoSrc} frameId={selected} className={styles.hero} />
          <p className={styles.note}>Frame visible to all LinkedIn members</p>

          <div className={styles.choices} role="listbox" aria-label="Frame options">
            {PHOTO_FRAMES.map((frame) => (
              <button
                type="button"
                key={frame.id}
                role="option"
                aria-selected={selected === frame.id}
                className={selected === frame.id ? styles.choiceActive : styles.choice}
                onClick={() => setSelected(frame.id)}
              >
                <ProfilePhotoBadge src={photoSrc} frameId={frame.id} />
                <span className={styles.choiceLabel}>{frame.label}</span>
              </button>
            ))}
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.applyBtn}
            onClick={() => onApply(selected)}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Saving..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
