import React, { useEffect, useState } from "react";
import { getAssociableRecords } from "@/Components/SkillsSection/skillUtils";
import { tMessage, useI18n } from "@/i18n";
import styles from "./styles.module.css";

const associationKey = (item) => `${item.kind}:${item.refId}`;

export default function EditSkillModal({
  isOpen,
  skill,
  profile,
  isSaving = false,
  error = "",
  onClose,
  onSave,
  onDelete,
}) {
  const [selected, setSelected] = useState(() => new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen || !skill) return;
    setSelected(new Set((skill.associations || []).map(associationKey)));
    setConfirmDelete(false);
  }, [isOpen, skill]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || isSaving) return;
      if (confirmDelete) {
        setConfirmDelete(false);
        return;
      }
      onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDelete, isOpen, isSaving, onClose]);

  const { t } = useI18n();
  if (!isOpen || !skill) return null;

  const records = getAssociableRecords(profile);
  const hasRecords = records.education.length > 0 || records.experience.length > 0;

  const toggle = (item) => {
    const key = associationKey(item);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    const associations = [...records.education, ...records.experience]
      .filter((item) => selected.has(associationKey(item)))
      .map((item) => ({ kind: item.kind, refId: item.refId }));
    onSave?.(associations);
  };

  return (
    <div className={styles.overlay} onClick={() => !isSaving && onClose?.()} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-skill-title"
      >
        <header className={styles.header}>
          <h2 id="edit-skill-title">{t("editNamed", { name: skill.name })}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")} disabled={isSaving}>
            ×
          </button>
        </header>
        <div className={styles.body}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <p>{t("confirmDeleteSkill")}</p>
            </div>
          ) : (
            <>
              <h3>{t("skillWhereUsed")}</h3>
              <p className={styles.help}>{t("skillSelectApplies")}</p>
              {records.education.length > 0 ? (
                <section className={styles.group}>
                  <h4>{t("education")}</h4>
                  {records.education.map((item) => (
                    <label key={associationKey(item)} className={styles.checkRow}>
                      <input
                        type="checkbox"
                        checked={selected.has(associationKey(item))}
                        onChange={() => toggle(item)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </section>
              ) : null}
              {records.experience.length > 0 ? (
                <section className={styles.group}>
                  <h4>{t("experience")}</h4>
                  {records.experience.map((item) => (
                    <label key={associationKey(item)} className={styles.checkRow}>
                      <input
                        type="checkbox"
                        checked={selected.has(associationKey(item))}
                        onChange={() => toggle(item)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </section>
              ) : null}
              {!hasRecords ? (
                <p className={styles.empty}>{t("associateSkillEmpty")}</p>
              ) : null}
              {error ? <p className={styles.error}>{tMessage(t, error)}</p> : null}
            </>
          )}
        </div>
        <footer className={styles.footer}>
          {confirmDelete ? (
            <>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmDelete(false)} disabled={isSaving}>
                {t("cancel")}
              </button>
              <button type="button" className={styles.deleteSolid} onClick={() => !isSaving && onDelete?.()} disabled={isSaving}>
                {isSaving ? t("deleting") : t("delete")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)} disabled={isSaving}>
                {t("deleteSkill")}
              </button>
              <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                {isSaving ? t("saving") : t("save")}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
