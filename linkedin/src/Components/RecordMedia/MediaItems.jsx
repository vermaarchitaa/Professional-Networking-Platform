import React from "react";
import { getMediaUrl } from "@/config/utils";
import styles from "@/Components/EditEducationModal/styles.module.css";

export default function MediaItems({ items = [], onEdit, onRemove }) {
  return (
    <ul className={styles.mediaList}>
      {items.map((item, index) => (
        <li key={`${item.url}-${index}`} className={styles.mediaRow}>
          <div className={styles.mediaThumbWrap}>
            {item.type === "image" ? (
              <img src={getMediaUrl(item.url)} alt="" className={styles.mediaThumb} />
            ) : (
              <span className={styles.mediaBadge}>{item.type === "document" ? "DOC" : "LINK"}</span>
            )}
            <button
              type="button"
              className={styles.mediaPencil}
              onClick={() => onEdit(index)}
              aria-label="Edit media"
            >
              ✎
            </button>
          </div>
          <div className={styles.mediaMeta}>
            <p>{item.name || item.url}</p>
            {item.type === "link" ? <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a> : null}
          </div>
          <button type="button" className={styles.iconBtn} onClick={() => onRemove(index)} aria-label="Remove media">
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
