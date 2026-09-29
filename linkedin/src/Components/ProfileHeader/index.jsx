import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@/Components/Avatar";
import CoverPhotoFlow from "@/Components/CoverPhotoFlow";
import {
  downloadResume,
  updateProfileData,
  uploadProfilePicture,
} from "@/config/redux/action/profileAction";
import { getMediaUrl } from "@/config/utils";
import styles from "./styles.module.css";

const OPEN_TO_VISIBILITY = [
  { value: "recruiters", label: "Recruiters only" },
  { value: "anyone", label: "All members" },
];

export default function ProfileHeader({ profile, onEditProfile }) {
  const dispatch = useDispatch();
  const { message, isError } = useSelector((state) => state.profile);
  const photoInputRef = useRef(null);
  const resourcesRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [openToDraft, setOpenToDraft] = useState({
    enabled: false,
    visibility: "recruiters",
    location: "",
    workTypes: "",
  });
  const [showOpenToDetails, setShowOpenToDetails] = useState(false);

  const user = profile?.userId;
  const coverSrc = user?.coverPicture ? getMediaUrl(user.coverPicture) : "";
  const firstSchool = (profile?.education || []).find((item) => item.school)?.school;
  const connectionsCount = Number(profile?.connectionsCount || 0);
  const openToWork = profile?.openToWork || {};
  const openToEnabled = Boolean(openToWork.enabled);

  useEffect(() => {
    setOpenToDraft({
      enabled: Boolean(openToWork.enabled),
      visibility: openToWork.visibility === "anyone" ? "anyone" : "recruiters",
      location: openToWork.location || "",
      workTypes: openToWork.workTypes || "",
    });
  }, [openToWork.enabled, openToWork.visibility, openToWork.location, openToWork.workTypes]);

  useEffect(() => {
    if (!openPanel) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !coverOpen) setOpenPanel(null);
    };
    const onPointerDown = (event) => {
      if (openPanel === "resources" && resourcesRef.current?.contains(event.target)) return;
      if (openPanel === "resources") setOpenPanel(null);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openPanel, coverOpen]);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError("");
    const result = await dispatch(uploadProfilePicture(file));
    if (uploadProfilePicture.rejected.match(result)) {
      setPhotoError(result.payload?.message || "Failed to update photo");
    }
  };

  const handleSaveOpenTo = async () => {
    const result = await dispatch(
      updateProfileData({
        openToWork: openToDraft,
      })
    );

    if (updateProfileData.fulfilled.match(result)) {
      setOpenPanel(null);
    }
  };

  const visibilityLabel = OPEN_TO_VISIBILITY.find((item) => item.value === (openToWork.visibility || "recruiters"))?.label;

  return (
    <section className={styles.card}>
      <div className={styles.coverWrap}>
        {coverSrc ? (
          <img src={coverSrc} alt="" className={styles.coverImage} />
        ) : (
          <div className={styles.coverFallback} />
        )}
        <button
          type="button"
          className={styles.coverEdit}
          aria-label="Change cover photo"
          onClick={() => setCoverOpen(true)}
        >
          ✎
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.photoWrap}>
          <div className={styles.photoRing}>
            <Avatar user={user} size={152} />
          </div>
          <button
            type="button"
            className={styles.photoEdit}
            aria-label="Change profile photo"
            onClick={() => photoInputRef.current?.click()}
          >
            ✎
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            hidden
            onChange={handlePhotoChange}
          />
        </div>

        <button
          type="button"
          className={styles.identityEdit}
          aria-label="Edit profile"
          onClick={onEditProfile}
        >
          ✎
        </button>

        <div className={styles.identityRow}>
          <div className={styles.identityMain}>
            <h1>{user?.name || "Your name"}</h1>
            {profile?.currentPost ? <p className={styles.headline}>{profile.currentPost}</p> : null}
            <p className={styles.metaLine}>
              {profile?.location ? `${profile.location} · ` : null}
              <button type="button" className={styles.linkBtn} onClick={() => setOpenPanel("contact")}>
                Contact info
              </button>
            </p>
            <p className={styles.stats}>
              {connectionsCount} {connectionsCount === 1 ? "connection" : "connections"}
            </p>
          </div>

          {firstSchool ? (
            <div className={styles.schoolBlock}>
              <span className={styles.schoolLogo} aria-hidden="true">
                {firstSchool.slice(0, 1).toUpperCase()}
              </span>
              <span className={styles.schoolName}>{firstSchool}</span>
            </div>
          ) : null}
        </div>

        {(photoError || (isError && message)) && (
          <p className={styles.error}>{photoError || message}</p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={() => setOpenPanel("openTo")}>
            Open to
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onEditProfile}>
            Add section
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={onEditProfile}>
            Enhance profile
          </button>
          <div className={styles.resourcesWrap} ref={resourcesRef}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setOpenPanel((current) => (current === "resources" ? null : "resources"))}
            >
              Resources
            </button>
            {openPanel === "resources" && (
              <div className={styles.resourcesMenu} role="menu">
                <button
                  type="button"
                  onClick={() => {
                    setOpenPanel(null);
                    dispatch(downloadResume(user?._id));
                  }}
                >
                  Download resume
                </button>
                <button type="button" onClick={() => setOpenPanel("contact")}>
                  Contact info
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.resumeBtn}
            onClick={() => dispatch(downloadResume(user?._id))}
          >
            ⬇ Resume
          </button>
        </div>

        {openToEnabled && (
          <div className={styles.openToCard}>
            <div className={styles.openToHeader}>
              <div>
                <p className={styles.openToTitle}>
                  Open to work · {visibilityLabel}
                </p>
                {(openToWork.location || openToWork.workTypes) ? (
                  <p className={styles.openToMeta}>
                    {[openToWork.location, openToWork.workTypes].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className={styles.smallEdit}
                aria-label="Edit open to work"
                onClick={() => setOpenPanel("openTo")}
              >
                ✎
              </button>
            </div>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setShowOpenToDetails((open) => !open)}
            >
              {showOpenToDetails ? "Hide details" : "Show details"}
            </button>
            {showOpenToDetails && (
              <p className={styles.openToDetails}>
                {openToWork.location || openToWork.workTypes
                  ? [openToWork.location, openToWork.workTypes].filter(Boolean).join(" · ")
                  : "Add your preferred locations and work types."}
              </p>
            )}
          </div>
        )}
      </div>

      {openPanel === "contact" && (
        <div className={styles.overlay} onClick={() => setOpenPanel(null)} role="presentation">
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Contact info</h3>
            {user?.name ? <p><strong>Name</strong> {user.name}</p> : null}
            {user?.username ? <p><strong>Username</strong> @{user.username}</p> : null}
            {user?.email ? <p><strong>Email</strong> {user.email}</p> : null}
            {!user?.name && !user?.username && !user?.email ? (
              <p>No contact details available.</p>
            ) : null}
            <div className={styles.dialogActions}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setOpenPanel(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {openPanel === "openTo" && (
        <div className={styles.overlay} onClick={() => setOpenPanel(null)} role="presentation">
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3>Open to work</h3>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={openToDraft.enabled}
                onChange={(event) => setOpenToDraft((current) => ({ ...current, enabled: event.target.checked }))}
              />
              Show Open to work on my profile
            </label>
            <label className={styles.fieldLabel}>Visible to</label>
            <select
              value={openToDraft.visibility}
              onChange={(event) => setOpenToDraft((current) => ({ ...current, visibility: event.target.value }))}
            >
              {OPEN_TO_VISIBILITY.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className={styles.fieldLabel}>Locations</label>
            <input
              value={openToDraft.location}
              onChange={(event) => setOpenToDraft((current) => ({ ...current, location: event.target.value }))}
              placeholder="City, Remote, Hybrid"
            />
            <label className={styles.fieldLabel}>Work types</label>
            <input
              value={openToDraft.workTypes}
              onChange={(event) => setOpenToDraft((current) => ({ ...current, workTypes: event.target.value }))}
              placeholder="On-site · Hybrid · Remote"
            />
            <div className={styles.dialogActions}>
              <button type="button" className={styles.ghostBtn} onClick={() => setOpenPanel(null)}>Cancel</button>
              <button type="button" className={styles.primaryBtn} onClick={handleSaveOpenTo}>Save</button>
            </div>
          </div>
        </div>
      )}

      <CoverPhotoFlow
        open={coverOpen}
        coverSrc={coverSrc}
        hasCover={Boolean(user?.coverPicture)}
        onClose={() => setCoverOpen(false)}
      />
    </section>
  );
}
