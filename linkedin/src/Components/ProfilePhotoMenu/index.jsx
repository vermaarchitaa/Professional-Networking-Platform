import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  CloseIcon,
  EyeIcon,
  FrameIcon,
  ImageIcon,
  PencilIcon,
  TrashIcon,
} from "@/Components/CoverPhotoFlow/icons";
import { ProfilePhotoBadge } from "@/Components/ProfilePhotoFrames";
import {
  PHOTO_VISIBILITY_OPTIONS,
  normalizePhotoVisibility,
} from "@/Components/ProfilePhotoFlow/photoUtils";
import { tMessage, useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function ProfilePhotoMenu({
  open,
  photoSrc,
  frameId,
  visibility,
  visibilityError,
  error,
  onClose,
  onEdit,
  onUpdate,
  onFrames,
  onDelete,
  onVisibilityChange,
}) {
  const { t } = useI18n();
  const [panelOpen, setPanelOpen] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const wrapRef = useRef(null);
  const selected = normalizePhotoVisibility(visibility);
  const selectedOption = PHOTO_VISIBILITY_OPTIONS.find((item) => item.id === selected) || PHOTO_VISIBILITY_OPTIONS[3];

  useEffect(() => {
    if (!open) setPanelOpen(false);
  }, [open]);

  useEffect(() => {
    if (!panelOpen) return undefined;
    const onPointerDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setPanelOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      setPanelOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [panelOpen]);

  if (!open) return null;

  const handleVisibilitySelect = async (id) => {
    if (id === selected || savingVisibility) {
      setPanelOpen(false);
      return;
    }
    setSavingVisibility(true);
    try {
      await onVisibilityChange(id);
      setPanelOpen(false);
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-photo-title"
      >
        <header className={styles.header}>
          <h2 id="profile-photo-title">{t("profilePhoto")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")}>
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>
          <ProfilePhotoBadge src={photoSrc} frameId={frameId} className={styles.previewBadge} />
          <div className={styles.visibilityWrap} ref={wrapRef}>
            <button
              type="button"
              className={styles.visibility}
              aria-haspopup="listbox"
              aria-expanded={panelOpen}
              aria-label={t("photoVisibility")}
              onClick={() => setPanelOpen((openPanel) => !openPanel)}
            >
              <EyeIcon />
              {t({
                connections: "firstDegree",
                network: "yourNetwork",
                members: "allMembers",
                anyone: "anyone",
              }[selectedOption.id] || "anyone")}
              <ChevronDownIcon />
            </button>
            {panelOpen ? (
              <div className={styles.visibilityPanel} role="listbox" aria-label={t("visibilityOptions")}>
                {PHOTO_VISIBILITY_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    role="option"
                    aria-selected={selected === option.id}
                    className={selected === option.id ? styles.visibilityOptionActive : styles.visibilityOption}
                    disabled={savingVisibility}
                    onClick={() => handleVisibilitySelect(option.id)}
                  >
                    <span className={styles.visibilityLabel}>{t({
                      connections: "firstDegreeOnly",
                      network: "yourNetwork",
                      members: "allLinkedInMembers",
                      anyone: "anyone",
                    }[option.id])}</span>
                    <span className={styles.visibilityHint}>{t({
                      connections: "firstDegreeDesc",
                      network: "yourNetworkDesc",
                      members: "allMembersSignedIn",
                      anyone: "anyoneOnOrOff",
                    }[option.id])}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {(error || visibilityError) ? <p className={styles.error}>{tMessage(t, visibilityError || error)}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.actionBtn} onClick={onEdit}>
            <PencilIcon />
            {t("edit")}
          </button>
          <button type="button" className={styles.actionBtn} onClick={onUpdate}>
            <ImageIcon />
            {t("update")}
          </button>
          <button type="button" className={styles.actionBtn} onClick={onFrames}>
            <FrameIcon />
            {t("frames")}
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
