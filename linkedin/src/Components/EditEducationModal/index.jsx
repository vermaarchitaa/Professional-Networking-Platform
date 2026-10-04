import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import EducationRecordForm, {
  cleanEducation,
  emptyEducation,
  EDUCATION_SKILLS_LIMIT,
  EDUCATION_MEDIA_NAME_MAX,
  EDUCATION_MEDIA_DESCRIPTION_MAX,
} from "@/Components/EducationRecordForm";
import { uploadEducationMedia } from "@/config/redux/action/profileAction";
import AddMediaMenu from "@/Components/RecordMedia/AddMediaMenu";
import EditMediaModal from "@/Components/RecordMedia/EditMediaModal";
import MediaItems from "@/Components/RecordMedia/MediaItems";
import { tMessage, useI18n } from "@/i18n";
import styles from "./styles.module.css";

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export default function EditEducationModal({
  isOpen,
  initialValue = null,
  isSaving = false,
  error = "",
  onClose,
  onSave,
  onDelete,
}) {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const isEditing = initialValue != null;
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const mediaMenuRef = useRef(null);
  const [draft, setDraft] = useState({ ...emptyEducation });
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [skillError, setSkillError] = useState("");
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [mediaEditIndex, setMediaEditIndex] = useState(null);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setDraft(initialValue ? { ...emptyEducation, ...initialValue, skills: initialValue.skills || [], media: initialValue.media || [] } : { ...emptyEducation });
    setFormError("");
    setConfirmDelete(false);
    setSkillOpen(false);
    setSkillName("");
    setSkillError("");
    setMediaMenuOpen(false);
    setLinkOpen(false);
    setLinkValue("");
    setLinkError("");
    setMediaEditIndex(null);
    setMediaTitle("");
    setMediaDescription("");
  }, [isOpen, initialValue]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || isSaving || uploading) return;
      if (mediaEditIndex !== null) {
        setMediaEditIndex(null);
        return;
      }
      if (linkOpen) {
        setLinkOpen(false);
        return;
      }
      if (skillOpen) {
        setSkillOpen(false);
        return;
      }
      if (mediaMenuOpen) {
        setMediaMenuOpen(false);
        return;
      }
      if (confirmDelete) {
        setConfirmDelete(false);
        return;
      }
      onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSaving, uploading, mediaEditIndex, linkOpen, skillOpen, mediaMenuOpen, confirmDelete, onClose]);

  useEffect(() => {
    if (!mediaMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (mediaMenuRef.current?.contains(event.target)) return;
      setMediaMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [mediaMenuOpen]);

  if (!isOpen) return null;

  const skills = Array.isArray(draft.skills) ? draft.skills : [];
  const media = Array.isArray(draft.media) ? draft.media : [];
  const busy = isSaving || uploading;

  const patchDraft = (next) => {
    setDraft(next);
    if (formError) setFormError("");
  };

  const handleSave = () => {
    if (busy) return;
    const cleaned = cleanEducation(draft);
    if (!cleaned.school) {
      setFormError("schoolRequired");
      return;
    }
    setFormError("");
    onSave?.(cleaned);
  };

  const addSkill = () => {
    const name = skillName.trim().slice(0, 80);
    if (!name) {
      setSkillError("enterSkill");
      return;
    }
    if (skills.length >= EDUCATION_SKILLS_LIMIT) {
      setSkillError("skillsLimit");
      return;
    }
    if (skills.some((item) => String(item.name || "").toLowerCase() === name.toLowerCase())) {
      setSkillError("skillAlreadyAdded");
      return;
    }
    patchDraft({ ...draft, skills: [...skills, { name }] });
    setSkillName("");
    setSkillError("");
    setSkillOpen(false);
  };

  const removeSkill = (index) => {
    patchDraft({ ...draft, skills: skills.filter((_, i) => i !== index) });
  };

  const moveSkill = (from, to) => {
    if (to < 0 || to >= skills.length) return;
    const next = [...skills];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    patchDraft({ ...draft, skills: next });
  };

  const addMedia = (item) => {
    patchDraft({ ...draft, media: [...media, item] });
  };

  const removeMedia = (index) => {
    patchDraft({ ...draft, media: media.filter((_, i) => i !== index) });
  };

  const addLink = () => {
    const url = linkValue.trim();
    if (!url) {
      setLinkError("enterUrl");
      return;
    }
    if (!isValidHttpUrl(url)) {
      setLinkError("enterValidUrl");
      return;
    }
    let name = url;
    try {
      name = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      name = url;
    }
    addMedia({ type: "link", url, name });
    setLinkValue("");
    setLinkError("");
    setLinkOpen(false);
  };

  const handleFileUpload = async (file, expectedType) => {
    if (!file) return;
    setUploading(true);
    setFormError("");
    const result = await dispatch(uploadEducationMedia(file));
    setUploading(false);
    if (uploadEducationMedia.rejected.match(result)) {
      setFormError(result.payload?.message || "Failed to upload media");
      return;
    }
    addMedia({
      type: result.payload?.type || expectedType,
      url: result.payload?.filename,
      name: result.payload?.name || file.name,
    });
  };

  const closeMediaEditor = () => {
    setMediaEditIndex(null);
    setMediaTitle("");
    setMediaDescription("");
  };

  const openMediaEditor = (index) => {
    const item = media[index];
    if (!item) return;
    setMediaEditIndex(index);
    setMediaTitle(String(item.name || "").slice(0, EDUCATION_MEDIA_NAME_MAX));
    setMediaDescription(String(item.description || "").slice(0, EDUCATION_MEDIA_DESCRIPTION_MAX));
  };

  const saveMediaEditor = () => {
    if (mediaEditIndex === null) return;
    const next = media.map((item, index) => (
      index === mediaEditIndex
        ? {
          ...item,
          name: mediaTitle.trim().slice(0, EDUCATION_MEDIA_NAME_MAX),
          description: mediaDescription.trim().slice(0, EDUCATION_MEDIA_DESCRIPTION_MAX),
        }
        : item
    ));
    patchDraft({ ...draft, media: next });
    closeMediaEditor();
  };

  const deleteMediaEditor = () => {
    if (mediaEditIndex === null) return;
    removeMedia(mediaEditIndex);
    closeMediaEditor();
  };

  const editingMedia = mediaEditIndex !== null ? media[mediaEditIndex] : null;
  const nestedOpen = skillOpen || linkOpen || mediaEditIndex !== null;

  return (
    <div className={styles.overlay} onClick={() => !busy && !nestedOpen && onClose?.()} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-education-title"
      >
        <header className={styles.header}>
          <h2 id="edit-education-title">{isEditing ? t("editEducation") : t("addEducationTitle")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")} disabled={busy}>
            ×
          </button>
        </header>

        <div className={styles.body}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <p>{t("confirmDeleteEducation")}</p>
            </div>
          ) : (
            <>
              <EducationRecordForm
                value={draft}
                onChange={patchDraft}
                error={formError || error}
              />

              <section className={styles.block}>
                <h3>{t("skills")}</h3>
                <p className={styles.help}>
                  {t("educationSkillsHelp")}
                </p>
                <ul className={styles.skillList}>
                  {skills.map((skill, index) => (
                    <li
                      key={`${skill.name}-${index}`}
                      className={styles.skillRow}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragIndex === null || dragIndex === index) return;
                        moveSkill(dragIndex, index);
                        setDragIndex(null);
                      }}
                    >
                      <span className={styles.dragHandle} aria-hidden="true">⋮⋮</span>
                      <span className={styles.skillName}>{skill.name}</span>
                      <button type="button" className={styles.iconBtn} onClick={() => removeSkill(index)} aria-label={t("removeNamed", { name: skill.name })}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                {skills.length < EDUCATION_SKILLS_LIMIT ? (
                  <button type="button" className={styles.addLink} onClick={() => { setSkillOpen(true); setSkillError(""); }}>
                    {t("addSkillPlus")}
                  </button>
                ) : null}
              </section>

              <section className={styles.block}>
                <h3>{t("media")}</h3>
                <p className={styles.help}>{t("mediaHelpEducation")}</p>
                <MediaItems items={media} onEdit={openMediaEditor} onRemove={removeMedia} />
                <AddMediaMenu
                  menuRef={mediaMenuRef}
                  open={mediaMenuOpen}
                  onToggle={() => setMediaMenuOpen((open) => !open)}
                  onAddLink={() => {
                    setMediaMenuOpen(false);
                    setLinkOpen(true);
                    setLinkError("");
                  }}
                  onAddImage={() => {
                    setMediaMenuOpen(false);
                    imageInputRef.current?.click();
                  }}
                  onAddDocument={() => {
                    setMediaMenuOpen(false);
                    documentInputRef.current?.click();
                  }}
                />
                {uploading ? <p className={styles.help}>{t("uploading")}</p> : null}
              </section>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          {confirmDelete ? (
            <>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmDelete(false)} disabled={busy}>
                {t("cancel")}
              </button>
              <button type="button" className={styles.deleteSolid} onClick={() => !busy && onDelete?.()} disabled={busy}>
                {isSaving ? t("deleting") : t("delete")}
              </button>
            </>
          ) : (
            <>
              {isEditing ? (
                <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)} disabled={busy}>
                  {t("deleteEducation")}
                </button>
              ) : (
                <span />
              )}
              <div className={styles.footerRight}>
                <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={busy}>
                  {t("cancel")}
                </button>
                <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy}>
                  {isSaving ? t("saving") : t("save")}
                </button>
              </div>
            </>
          )}
        </footer>

        <input
          ref={imageInputRef}
          type="file"
          hidden
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            handleFileUpload(file, "image");
          }}
        />
        <input
          ref={documentInputRef}
          type="file"
          hidden
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            handleFileUpload(file, "document");
          }}
        />
      </div>

      {skillOpen ? (
        <div className={styles.nestedOverlay} onClick={() => setSkillOpen(false)} role="presentation">
          <div className={styles.nestedDialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="add-skill-title">
            <header className={styles.header}>
              <h2 id="add-skill-title">{t("addSkill")}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setSkillOpen(false)} aria-label={t("close")}>×</button>
            </header>
            <div className={styles.nestedBody}>
              <label className={styles.nestedLabel}>
                {t("skill")}
                <input
                  autoFocus
                  value={skillName}
                  onChange={(event) => {
                    setSkillName(event.target.value);
                    if (skillError) setSkillError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder={t("skillPlaceholder")}
                />
              </label>
              {skillError ? <p className={styles.nestedError}>{tMessage(t, skillError)}</p> : null}
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={() => setSkillOpen(false)}>{t("cancel")}</button>
              <button type="button" className={styles.saveBtn} onClick={addSkill}>{t("add")}</button>
            </footer>
          </div>
        </div>
      ) : null}

      {editingMedia ? (
        <EditMediaModal
          item={editingMedia}
          title={mediaTitle}
          description={mediaDescription}
          onTitleChange={setMediaTitle}
          onDescriptionChange={setMediaDescription}
          onClose={closeMediaEditor}
          onSave={saveMediaEditor}
          onDelete={deleteMediaEditor}
        />
      ) : null}

      {linkOpen ? (
        <div className={styles.nestedOverlay} onClick={() => setLinkOpen(false)} role="presentation">
          <div className={styles.nestedDialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="add-media-title">
            <header className={styles.header}>
              <h2 id="add-media-title">{t("addMediaTitle")}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setLinkOpen(false)} aria-label={t("close")}>×</button>
            </header>
            <div className={styles.nestedBody}>
              <p className={styles.help}>{t("pasteLinkHelp")}</p>
              <label className={styles.nestedLabel}>
                {t("url")}
                <input
                  autoFocus
                  value={linkValue}
                  onChange={(event) => {
                    setLinkValue(event.target.value);
                    if (linkError) setLinkError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addLink();
                    }
                  }}
                  placeholder="https://"
                />
              </label>
              {linkError ? <p className={styles.nestedError}>{tMessage(t, linkError)}</p> : null}
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={() => setLinkOpen(false)}>{t("back")}</button>
              <button type="button" className={styles.saveBtn} onClick={addLink}>{t("save")}</button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
