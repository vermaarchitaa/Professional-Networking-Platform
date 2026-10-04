import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function MediaEditor({
  isOpen,
  items,
  selectedIndex,
  onSelect,
  onAddFiles,
  onRemoveSelected,
  onBack,
  onNext,
  onClose,
}) {
  const { t } = useI18n();
  const fileInputRef = useRef(null);
  const [panel, setPanel] = useState(null);
  const [altDraft, setAltDraft] = useState("");
  const selected = items[selectedIndex];
  const total = items.length;

  useEffect(() => {
    if (!isOpen) {
      setPanel(null);
      return;
    }
    if (items.length === 0) {
      fileInputRef.current?.click();
    }
  }, [isOpen, items.length]);

  useEffect(() => {
    setAltDraft(selected?.alt || "");
  }, [selected]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("editor")}
      >
        <header className={styles.header}>
          <h2>{t("editor")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("closeEditor")}>
            ✕
          </button>
        </header>

        <div className={styles.main}>
          <div className={styles.preview}>
            {selected ? (
              selected.kind === "video" ? (
                <video src={selected.previewUrl} controls className={styles.previewMedia} />
              ) : (
                <img src={selected.previewUrl} alt={selected.alt || ""} className={styles.previewMedia} />
              )
            ) : (
              <p className={styles.emptyPreview}>{t("selectMediaPreview")}</p>
            )}
            {total > 0 && (
              <p className={styles.counter}>
                {t("ofTotal", { current: selectedIndex + 1, total })}
              </p>
            )}
          </div>

          <div className={styles.thumbs}>
            {items.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={index === selectedIndex ? styles.thumbActive : styles.thumb}
                onClick={() => onSelect(index)}
                aria-label={t("selectMediaN", { n: index + 1 })}
              >
                {item.kind === "video" ? (
                  <video src={item.previewUrl} muted />
                ) : (
                  <img src={item.previewUrl} alt="" />
                )}
              </button>
            ))}
            <button
              type="button"
              className={styles.addThumb}
              onClick={() => fileInputRef.current?.click()}
              aria-label={t("addMoreMedia")}
              disabled={items.length >= 10}
            >
              +
            </button>
          </div>

          <div className={styles.controls}>
            <button type="button" className={styles.controlBtn} onClick={() => setPanel(panel === "edit" ? null : "edit")}>
              {t("edit")}
            </button>
            <button type="button" className={styles.controlBtn} onClick={() => setPanel(panel === "alt" ? null : "alt")}>
              ALT
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={onRemoveSelected}
              disabled={!selected}
            >
              {t("delete")}
            </button>
          </div>

          {panel === "edit" && (
            <p className={styles.panelNote}>{t("imageEditingUnavailable")}</p>
          )}
          {panel === "alt" && selected && (
            <label className={styles.altField}>
              {t("altText")}
              <input
                type="text"
                value={altDraft}
                onChange={(e) => {
                  setAltDraft(e.target.value);
                  selected.alt = e.target.value;
                }}
                placeholder={t("describeMedia")}
              />
            </label>
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.backBtn} onClick={onBack}>
            {t("back")}
          </button>
          <button type="button" className={styles.nextBtn} onClick={onNext}>
            {t("next")}
          </button>
        </footer>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm"
          onChange={(e) => {
            onAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
