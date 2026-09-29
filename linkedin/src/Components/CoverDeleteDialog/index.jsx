import React from "react";
import { CloseIcon } from "@/Components/CoverPhotoFlow/icons";
import styles from "./styles.module.css";

export default function CoverDeleteDialog({ error, deleting, onCancel, onConfirm }) {
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
          <h2 id="delete-photo-title">Delete Photo</h2>
          <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="Close">
            <CloseIcon />
          </button>
        </header>
        <p className={styles.message}>
          You&apos;re about to delete this background photo. Your profile will show the default cover until you add a new one.
        </p>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            No thanks
          </button>
          <button type="button" className={styles.deleteBtn} onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
