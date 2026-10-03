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
import { getMediaUrl } from "@/config/utils";
import styles from "./styles.module.css";

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const MediaMenuIcon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const LinkIcon = () => (
  <MediaMenuIcon>
    <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
    <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 7.07 7.07L14 18.07" />
  </MediaMenuIcon>
);

const ImageIcon = () => (
  <MediaMenuIcon>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.5" />
    <path d="m21 16-5-5-11 8" />
  </MediaMenuIcon>
);

const DocumentIcon = () => (
  <MediaMenuIcon>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M8 13h8M8 17h6" />
  </MediaMenuIcon>
);

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
      setFormError("School is required");
      return;
    }
    setFormError("");
    onSave?.(cleaned);
  };

  const addSkill = () => {
    const name = skillName.trim().slice(0, 80);
    if (!name) {
      setSkillError("Enter a skill");
      return;
    }
    if (skills.length >= EDUCATION_SKILLS_LIMIT) {
      setSkillError("You can add up to 5 skills");
      return;
    }
    if (skills.some((item) => String(item.name || "").toLowerCase() === name.toLowerCase())) {
      setSkillError("That skill is already added");
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
      setLinkError("Enter a URL");
      return;
    }
    if (!isValidHttpUrl(url)) {
      setLinkError("Enter a valid URL");
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
          <h2 id="edit-education-title">{isEditing ? "Edit education" : "Add education"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close" disabled={busy}>
            ×
          </button>
        </header>

        <div className={styles.body}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <p>Are you sure you want to delete this education?</p>
            </div>
          ) : (
            <>
              <EducationRecordForm
                value={draft}
                onChange={patchDraft}
                error={formError || error}
              />

              <section className={styles.block}>
                <h3>Skills</h3>
                <p className={styles.help}>
                  We recommend adding your top 5 skills used in this experience. They&apos;ll also appear in your Skills section.
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
                      <button type="button" className={styles.iconBtn} onClick={() => removeSkill(index)} aria-label={`Remove ${skill.name}`}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                {skills.length < EDUCATION_SKILLS_LIMIT ? (
                  <button type="button" className={styles.addLink} onClick={() => { setSkillOpen(true); setSkillError(""); }}>
                    + Add skill
                  </button>
                ) : null}
              </section>

              <section className={styles.block}>
                <h3>Media</h3>
                <p className={styles.help}>Add media like images, documents, sites or presentations. Learn more</p>
                <ul className={styles.mediaList}>
                  {media.map((item, index) => (
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
                          onClick={() => openMediaEditor(index)}
                          aria-label="Edit media"
                        >
                          ✎
                        </button>
                      </div>
                      <div className={styles.mediaMeta}>
                        <p>{item.name || item.url}</p>
                        {item.type === "link" ? <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a> : null}
                      </div>
                      <button type="button" className={styles.iconBtn} onClick={() => removeMedia(index)} aria-label="Remove media">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <div className={styles.mediaWrap} ref={mediaMenuRef}>
                  <button type="button" className={styles.addLink} onClick={() => setMediaMenuOpen((open) => !open)}>
                    + Add media
                  </button>
                  {mediaMenuOpen ? (
                    <div className={styles.mediaMenu} role="menu">
                      <button
                        type="button"
                        onClick={() => {
                          setMediaMenuOpen(false);
                          setLinkOpen(true);
                          setLinkError("");
                        }}
                      >
                        <LinkIcon />
                        Add a link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaMenuOpen(false);
                          imageInputRef.current?.click();
                        }}
                      >
                        <ImageIcon />
                        Add an image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaMenuOpen(false);
                          documentInputRef.current?.click();
                        }}
                      >
                        <DocumentIcon />
                        Add a document
                      </button>
                    </div>
                  ) : null}
                </div>
                {uploading ? <p className={styles.help}>Uploading...</p> : null}
              </section>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          {confirmDelete ? (
            <>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmDelete(false)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className={styles.deleteSolid} onClick={() => !busy && onDelete?.()} disabled={busy}>
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </>
          ) : (
            <>
              {isEditing ? (
                <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)} disabled={busy}>
                  Delete education
                </button>
              ) : (
                <span />
              )}
              <div className={styles.footerRight}>
                <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy}>
                  {isSaving ? "Saving..." : "Save"}
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
              <h2 id="add-skill-title">Add skill</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setSkillOpen(false)} aria-label="Close">×</button>
            </header>
            <div className={styles.nestedBody}>
              <label className={styles.nestedLabel}>
                Skill
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
                  placeholder="Skill (ex: Project Management)"
                />
              </label>
              {skillError ? <p className={styles.nestedError}>{skillError}</p> : null}
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={() => setSkillOpen(false)}>Cancel</button>
              <button type="button" className={styles.saveBtn} onClick={addSkill}>Add</button>
            </footer>
          </div>
        </div>
      ) : null}

      {editingMedia ? (
        <div className={styles.nestedOverlay} onClick={closeMediaEditor} role="presentation">
          <div className={styles.editMediaDialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="edit-media-title">
            <header className={styles.header}>
              <h2 id="edit-media-title">Edit media</h2>
              <button type="button" className={styles.closeBtn} onClick={closeMediaEditor} aria-label="Close">×</button>
            </header>
            <div className={styles.editMediaBody}>
              <label className={styles.nestedLabel}>
                Title
                <input
                  autoFocus
                  value={mediaTitle}
                  maxLength={EDUCATION_MEDIA_NAME_MAX}
                  onChange={(event) => setMediaTitle(event.target.value.slice(0, EDUCATION_MEDIA_NAME_MAX))}
                />
              </label>
              <p className={styles.charCount}>{mediaTitle.length}/{EDUCATION_MEDIA_NAME_MAX}</p>
              <label className={styles.nestedLabel}>
                Description
                <textarea
                  className={styles.editMediaTextarea}
                  value={mediaDescription}
                  maxLength={EDUCATION_MEDIA_DESCRIPTION_MAX}
                  onChange={(event) => setMediaDescription(event.target.value.slice(0, EDUCATION_MEDIA_DESCRIPTION_MAX))}
                  rows={4}
                />
              </label>
              <p className={styles.charCount}>{mediaDescription.length}/{EDUCATION_MEDIA_DESCRIPTION_MAX}</p>
              <div className={styles.editMediaPreview}>
                {editingMedia.type === "image" ? (
                  <img src={getMediaUrl(editingMedia.url)} alt="" />
                ) : (
                  <span className={styles.mediaBadge}>{editingMedia.type === "document" ? "DOC" : "LINK"}</span>
                )}
              </div>
            </div>
            <footer className={styles.editMediaFooter}>
              <button type="button" className={styles.deleteBtn} onClick={deleteMediaEditor}>
                Delete
              </button>
              <div className={styles.footerRight}>
                <button type="button" className={styles.cancelBtn} onClick={closeMediaEditor}>Back</button>
                <button type="button" className={styles.saveBtn} onClick={saveMediaEditor}>Save</button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}

      {linkOpen ? (
        <div className={styles.nestedOverlay} onClick={() => setLinkOpen(false)} role="presentation">
          <div className={styles.nestedDialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-labelledby="add-media-title">
            <header className={styles.header}>
              <h2 id="add-media-title">Add media</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setLinkOpen(false)} aria-label="Close">×</button>
            </header>
            <div className={styles.nestedBody}>
              <p className={styles.help}>Paste or type a link to an article, file or video.</p>
              <label className={styles.nestedLabel}>
                URL
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
              {linkError ? <p className={styles.nestedError}>{linkError}</p> : null}
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={() => setLinkOpen(false)}>Back</button>
              <button type="button" className={styles.saveBtn} onClick={addLink}>Save</button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
