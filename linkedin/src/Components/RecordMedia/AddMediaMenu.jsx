import React from "react";
import { DocumentIcon, ImageIcon, LinkIcon } from "@/Components/RecordMedia/icons";
import styles from "@/Components/EditEducationModal/styles.module.css";

export default function AddMediaMenu({
  menuRef,
  open,
  onToggle,
  onAddLink,
  onAddImage,
  onAddDocument,
}) {
  return (
    <div className={styles.mediaWrap} ref={menuRef}>
      <button type="button" className={styles.addLink} onClick={onToggle}>
        + Add media
      </button>
      {open ? (
        <div className={styles.mediaMenu} role="menu">
          <button type="button" onClick={onAddLink}>
            <LinkIcon />
            Add a link
          </button>
          <button type="button" onClick={onAddImage}>
            <ImageIcon />
            Add an image
          </button>
          <button type="button" onClick={onAddDocument}>
            <DocumentIcon />
            Add a document
          </button>
        </div>
      ) : null}
    </div>
  );
}
