import React from "react";
import { DocumentIcon, ImageIcon, LinkIcon } from "@/Components/RecordMedia/icons";
import { useI18n } from "@/i18n";
import styles from "@/Components/EditEducationModal/styles.module.css";

export default function AddMediaMenu({
  menuRef,
  open,
  onToggle,
  onAddLink,
  onAddImage,
  onAddDocument,
}) {
  const { t } = useI18n();
  return (
    <div className={styles.mediaWrap} ref={menuRef}>
      <button type="button" className={styles.addLink} onClick={onToggle}>
        {t("addMedia")}
      </button>
      {open ? (
        <div className={styles.mediaMenu} role="menu">
          <button type="button" onClick={onAddLink}>
            <LinkIcon />
            {t("addALink")}
          </button>
          <button type="button" onClick={onAddImage}>
            <ImageIcon />
            {t("addAnImage")}
          </button>
          <button type="button" onClick={onAddDocument}>
            <DocumentIcon />
            {t("addADocument")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
