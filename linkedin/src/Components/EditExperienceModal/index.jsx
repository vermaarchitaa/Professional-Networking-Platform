import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import ExperienceRecordForm, {
  cleanExperience,
  emptyExperience,
  EXPERIENCE_SKILLS_LIMIT,
  experienceSkillsFromProfile,
} from "@/Components/ExperienceRecordForm";
import {
  EDUCATION_MEDIA_DESCRIPTION_MAX,
  EDUCATION_MEDIA_NAME_MAX,
} from "@/Components/EducationRecordForm";
import { listProfileSkills } from "@/Components/SkillsSection/skillUtils";
import { uploadEducationMedia } from "@/config/redux/action/profileAction";
import AddMediaMenu from "@/Components/RecordMedia/AddMediaMenu";
import EditMediaModal from "@/Components/RecordMedia/EditMediaModal";
import MediaItems from "@/Components/RecordMedia/MediaItems";
import styles from "@/Components/EditEducationModal/styles.module.css";

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export default function EditExperienceModal({
  isOpen,
  initialValue = null,
  profile = null,
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
  const [draft, setDraft] = useState({ ...emptyExperience });
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
  const [mediaEditIndex, setMediaEditIndex] = useState(null);
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const next = initialValue
      ? { ...emptyExperience, ...initialValue, media: initialValue.media || [] }
      : { ...emptyExperience };
    next.skills = experienceSkillsFromProfile(profile, initialValue || next);
    setDraft(next);
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
  }, [confirmDelete, isOpen, isSaving, linkOpen, mediaEditIndex, mediaMenuOpen, onClose, skillOpen, uploading]);

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
  const profileSkillNames = listProfileSkills(profile).map((item) => item.name);
  const selectedKeys = new Set(skills.map((item) => String(item.name || "").toLowerCase()));

  const patchDraft = (next) => {
    setDraft(next);
    if (formError) setFormError("");
  };

  const handleSave = () => {
    if (busy) return;
    const cleaned = cleanExperience(draft);
    if (!cleaned.position || !cleaned.company) {
      setFormError("Title and company are required");
      return;
    }
    setFormError("");
    onSave?.(cleaned);
  };

  const addSkill = (name) => {
    const nextName = String(name || "").trim().slice(0, 80);
    if (!nextName) {
      setSkillError("Enter a skill");
      return false;
    }
    if (skills.length >= EXPERIENCE_SKILLS_LIMIT) {
      setSkillError("You can add up to 5 skills");
      return false;
    }
    if (skills.some((item) => String(item.name || "").toLowerCase() === nextName.toLowerCase())) {
      setSkillError("That skill is already added");
      return false;
    }
    patchDraft({ ...draft, skills: [...skills, { name: nextName }] });
    setSkillName("");
    setSkillError("");
    setSkillOpen(false);
    return true;
  };

  const addMedia = (item) => patchDraft({ ...draft, media: [...media, item] });
  const removeMedia = (index) => patchDraft({ ...draft, media: media.filter((_, i) => i !== index) });

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

  const editingMedia = mediaEditIndex !== null ? media[mediaEditIndex] : null;
  const nestedOpen = skillOpen || linkOpen || mediaEditIndex !== null;

  return (
    <div className={styles.overlay} onClick={() => !busy && !nestedOpen && onClose?.()} role="presentation">
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="edit-experience-title">
        <header className={styles.header}>
          <h2 id="edit-experience-title">{isEditing ? "Edit experience" : "Add experience"}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close" disabled={busy}>×</button>
        </header>
        <div className={styles.body}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <p>Are you sure you want to delete this experience?</p>
            </div>
          ) : (
            <>
              <ExperienceRecordForm value={draft} onChange={patchDraft} error={formError || error} />
              <section className={styles.block}>
                <h3>Skills</h3>
                <p className={styles.help}>Select skills from your profile or add up to 5 skills used in this role.</p>
                {profileSkillNames.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "0.75rem" }}>
                    {profileSkillNames.map((name) => {
                      const selected = selectedKeys.has(name.toLowerCase());
                      return (
                        <button
                          key={name}
                          type="button"
                          className={styles.addLink}
                          style={{
                            border: "1px solid #0a66c2",
                            borderRadius: 24,
                            padding: "0.3rem 0.75rem",
                            background: selected ? "#edf3f8" : "white",
                          }}
                          onClick={() => {
                            if (selected) {
                              patchDraft({ ...draft, skills: skills.filter((item) => item.name.toLowerCase() !== name.toLowerCase()) });
                              return;
                            }
                            addSkill(name);
                          }}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <ul className={styles.skillList}>
                  {skills.map((skill, index) => (
                    <li key={`${skill.name}-${index}`} className={styles.skillRow}>
                      <span className={styles.skillName}>{skill.name}</span>
                      <button type="button" className={styles.iconBtn} onClick={() => patchDraft({ ...draft, skills: skills.filter((_, i) => i !== index) })} aria-label={`Remove ${skill.name}`}>×</button>
                    </li>
                  ))}
                </ul>
                {skills.length < EXPERIENCE_SKILLS_LIMIT ? (
                  <button type="button" className={styles.addLink} onClick={() => { setSkillOpen(true); setSkillError(""); }}>+ Add skill</button>
                ) : null}
              </section>
              <section className={styles.block}>
                <h3>Media</h3>
                <p className={styles.help}>Add images, documents, or links that highlight this role.</p>
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
                {uploading ? <p className={styles.help}>Uploading...</p> : null}
              </section>
            </>
          )}
        </div>
        <footer className={styles.footer}>
          {confirmDelete ? (
            <>
              <button type="button" className={styles.cancelBtn} onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</button>
              <button type="button" className={styles.deleteSolid} onClick={() => !busy && onDelete?.()} disabled={busy}>{isSaving ? "Deleting..." : "Delete"}</button>
            </>
          ) : (
            <>
              {isEditing ? (
                <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)} disabled={busy}>Delete experience</button>
              ) : <span />}
              <div className={styles.footerRight}>
                <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={busy}>Cancel</button>
                <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy}>{isSaving ? "Saving..." : "Save"}</button>
              </div>
            </>
          )}
        </footer>
        <input ref={imageInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; handleFileUpload(file, "image"); }} />
        <input ref={documentInputRef} type="file" hidden accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; handleFileUpload(file, "document"); }} />
      </div>
      {skillOpen ? (
        <div className={styles.nestedOverlay} onClick={() => setSkillOpen(false)} role="presentation">
          <div className={styles.nestedDialog} onClick={(event) => event.stopPropagation()} role="dialog">
            <header className={styles.header}>
              <h2>Add skill</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setSkillOpen(false)} aria-label="Close">×</button>
            </header>
            <div className={styles.nestedBody}>
              <label className={styles.nestedLabel}>
                Skill
                <input autoFocus value={skillName} onChange={(event) => { setSkillName(event.target.value); if (skillError) setSkillError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(skillName); } }} placeholder="Skill (ex: Project Management)" />
              </label>
              {skillError ? <p className={styles.nestedError}>{skillError}</p> : null}
            </div>
            <footer className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={() => setSkillOpen(false)}>Cancel</button>
              <button type="button" className={styles.saveBtn} onClick={() => addSkill(skillName)}>Add</button>
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
          <div className={styles.nestedDialog} onClick={(event) => event.stopPropagation()} role="dialog">
            <header className={styles.header}>
              <h2>Add media</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setLinkOpen(false)} aria-label="Close">×</button>
            </header>
            <div className={styles.nestedBody}>
              <label className={styles.nestedLabel}>
                URL
                <input autoFocus value={linkValue} onChange={(event) => { setLinkValue(event.target.value); if (linkError) setLinkError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLink(); } }} placeholder="https://" />
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
