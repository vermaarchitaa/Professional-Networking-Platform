import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import CoverPhotoFlow from "@/Components/CoverPhotoFlow";
import { CameraIcon } from "@/Components/CoverPhotoFlow/icons";
import ProfileIntroFlow from "@/Components/ProfileIntroFlow";
import ProfilePhotoFlow from "@/Components/ProfilePhotoFlow";
import { ProfilePhotoBadge } from "@/Components/ProfilePhotoFrames";
import {
  hasUploadedProfilePicture,
  normalizePhotoVisibility,
  normalizeProfileFrame,
} from "@/Components/ProfilePhotoFlow/photoUtils";
import {
  downloadResume,
  fetchProfileByUsername,
  updateProfileData,
} from "@/config/redux/action/profileAction";
import {
  fetchIncomingRequests,
  fetchSentRequests,
  removeConnection,
  respondToRequest,
  sendConnectionRequest,
} from "@/config/redux/action/connectionAction";
import { getRelationship } from "@/config/connectionRelationship";
import { getMediaUrl, getPublicProfileHref, getPublicProfilePath } from "@/config/utils";
import { formatMonthName, tEnum, toIntlLocale, useI18n } from "@/i18n";
import styles from "./styles.module.css";

const OPEN_TO_VISIBILITY = [
  { value: "recruiters", labelKey: "recruitersOnly" },
  { value: "anyone", labelKey: "allMembers" },
];
const VISIBILITY_LABEL_KEYS = {
  anyone: "anyone",
  connections: "connectionsOnly",
  "only-me": "onlyMe",
};

const ADD_PROFILE_SECTIONS = [
  { id: "about", key: "addAbout" },
  { id: "education", key: "addEducation" },
  { id: "position", key: "addPosition" },
  { id: "skills", key: "addSkills" },
  { id: "featured", key: "addFeatured" },
  { id: "licenses", key: "addLicenses" },
  { id: "languages", key: "addLanguages" },
  { id: "volunteer", key: "addVolunteer" },
];

function formatBirthdayDisplay(value, language = "en") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return "";
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return "";
  return `${formatMonthName(language, monthIndex)} ${Number(match[3])}`;
}

function hasSavedValue(value) {
  return String(value || "").trim().length > 0;
}

function formatPronouns(value, t) {
  const raw = String(value || "").trim();
  if (!raw || raw === "custom") return "";
  const labels = {
    "he/him": "He/Him",
    "she/her": "She/Her",
    "they/them": "They/Them",
  };
  const mapped = labels[raw.toLowerCase()];
  return mapped ? tEnum(t, mapped) : raw;
}

function formatJoinedDate(value, language = "en") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(toIntlLocale(language), { month: "long", year: "numeric" });
}

function ResourceIcon({ name }) {
  if (name === "message") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (name === "pdf") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </svg>
    );
  }
  if (name === "saved") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (name === "remove") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
      </svg>
    );
  }
  if (name === "activity") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 14h4l2-8 4 16 2-8h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function ContactIcon({ name }) {
  if (name === "link") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }
  if (name === "email") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.19a2 2 0 0 1 2.11-.45c.84.29 1.71.5 2.61.62A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  if (name === "address") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  if (name === "birthday") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  }
  if (name === "website") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function ProfileHeader({ profile, onEditProfile, onOpenEducation, onAddAbout, onAddEducation, onAddExperience, onAddSkill, onAddLanguage, isOwner = true }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { t, language } = useI18n();
  const { message, isError } = useSelector((state) => state.profile);
  const { pendingIds, sentRequests, incomingRequests, sentReady, incomingReady } = useSelector((state) => state.connections);
  const resourcesRef = useRef(null);
  const resourcesMenuRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [resourcesPlacement, setResourcesPlacement] = useState({ up: false, end: false });
  const [coverOpen, setCoverOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [introStartView, setIntroStartView] = useState("intro");
  const [openToDraft, setOpenToDraft] = useState({
    enabled: false,
    visibility: "recruiters",
    location: "",
    workTypes: "",
  });
  const [showOpenToDetails, setShowOpenToDetails] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const user = profile?.userId;
  const hasCover = Boolean(user?.coverPicture);
  const hasPhoto = hasUploadedProfilePicture(user);
  const coverSrc = hasCover ? getMediaUrl(user.coverPicture) : "";
  const photoSrc = hasPhoto ? getMediaUrl(user.profilePicture) : "";
  const photoFrame = normalizeProfileFrame(user?.profilePictureFrame);
  const photoVisibility = normalizePhotoVisibility(user?.profilePhotoVisibility);
  const connectionsCount = Number(profile?.connectionsCount || 0);
  const { isConnected, isOutgoingPending, incomingRequest } = isOwner
    ? { isConnected: false, isOutgoingPending: false, incomingRequest: null }
    : getRelationship(user?._id, {
      pendingIds,
      sentRequests,
      incomingRequests,
      profileConnected: profile?.isConnected,
      connectionsHydrated: Boolean(sentReady && incomingReady),
    });
  const isPending = isOutgoingPending;
  const openToWork = profile?.openToWork || {};
  const openToEnabled = Boolean(openToWork.enabled);
  const introLocation = [profile?.intro?.city, profile?.intro?.country].filter(Boolean).join(", ");
  const headerLocation = introLocation || profile?.location || "";
  const headerPronouns = formatPronouns(profile?.intro?.pronouns, t);
  const headerSchool = String(profile?.intro?.education || "").trim();
  const joinedLabel = formatJoinedDate(user?.createdAt, language);
  const contactAdded = Boolean(
    user?.username
    || hasSavedValue(profile?.contactInfo?.email)
    || hasSavedValue(profile?.contactInfo?.phone)
    || hasSavedValue(profile?.contactInfo?.address)
    || hasSavedValue(profile?.contactInfo?.website)
    || hasSavedValue(profile?.contactInfo?.instantMessaging)
  );

  useEffect(() => {
    if (!isOwner) {
      dispatch(fetchSentRequests());
      dispatch(fetchIncomingRequests());
    }
  }, [dispatch, isOwner]);

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
      if (event.key === "Escape" && !coverOpen && !photoOpen && !introOpen) setOpenPanel(null);
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
  }, [openPanel, coverOpen, photoOpen, introOpen]);

  useLayoutEffect(() => {
    if (openPanel !== "resources") {
      setResourcesPlacement({ up: false, end: false });
      return undefined;
    }

    const placeMenu = () => {
      const wrap = resourcesRef.current;
      const menu = resourcesMenuRef.current;
      if (!wrap || !menu) return;
      const rect = wrap.getBoundingClientRect();
      const menuHeight = menu.offsetHeight;
      const menuWidth = menu.offsetWidth;
      const gap = 8;
      const pad = 12;
      const spaceBelow = window.innerHeight - rect.bottom - gap - pad;
      const spaceAbove = rect.top - gap - pad;
      const up = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      const end = rect.left + menuWidth > window.innerWidth - pad;
      setResourcesPlacement({ up, end });
    };

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [openPanel]);

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

  const visibilityLabel = t(OPEN_TO_VISIBILITY.find((item) => item.value === (openToWork.visibility || "recruiters"))?.labelKey || "recruitersOnly");

  return (
    <section className={`${styles.card} ${openPanel === "resources" ? styles.cardMenuOpen : ""}`}>
      <div className={styles.coverWrap}>
        {coverSrc ? (
          <img src={coverSrc} alt="" className={styles.coverImage} />
        ) : (
          <div className={styles.coverFallback} />
        )}
        {isOwner ? (
          <button
            type="button"
            className={styles.coverEdit}
            aria-label={hasCover ? "Change cover photo" : "Add cover photo"}
            onClick={() => setCoverOpen(true)}
          >
            {hasCover ? "✎" : <CameraIcon />}
          </button>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.photoWrap}>
          {hasPhoto ? (
            isOwner ? (
              <button
                type="button"
                className={styles.photoButton}
                aria-label="Edit profile photo"
                onClick={() => setPhotoOpen(true)}
              >
                <ProfilePhotoBadge
                  src={photoSrc}
                  frameId={photoFrame}
                  className={styles.headerPhoto}
                  alt=""
                />
              </button>
            ) : (
              <ProfilePhotoBadge
                src={photoSrc}
                frameId={photoFrame}
                className={styles.headerPhoto}
                alt=""
              />
            )
          ) : (
            <>
              <div className={styles.photoRingEmpty}>
                <div className={styles.photoPlaceholder} aria-hidden="true">
                  <svg viewBox="0 0 80 80" width="72" height="72" fill="none">
                    <circle cx="40" cy="28" r="14" fill="#c3c6c9" />
                    <path d="M16 68c2.5-16 12-24 24-24s21.5 8 24 24" fill="#c3c6c9" />
                  </svg>
                </div>
              </div>
              {isOwner ? (
                <button
                  type="button"
                  className={styles.photoAdd}
                  aria-label="Add profile photo"
                  onClick={() => setPhotoOpen(true)}
                >
                  +
                </button>
              ) : null}
            </>
          )}
        </div>

        {isOwner ? (
          <button
            type="button"
            className={styles.identityEdit}
            aria-label={t("editIntro")}
            onClick={() => {
              setIntroStartView("intro");
              setIntroOpen(true);
            }}
          >
            ✎
          </button>
        ) : null}

        <div className={styles.identityRow}>
          <div className={styles.identityMain}>
            <h1>
              {user?.name || t("yourName")}
              {headerPronouns ? <span className={styles.pronouns}>{headerPronouns}</span> : null}
            </h1>
            {profile?.currentPost ? <p className={styles.headline}>{profile.currentPost}</p> : null}
            <p className={styles.metaLine}>
              {headerLocation ? `${headerLocation} · ` : null}
              <button
                type="button"
                className={`${styles.linkBtn} ${styles.contactInfoLink}`}
                onClick={() => setOpenPanel("contact")}
              >
                {t("contactInfo")}
              </button>
            </p>
            {isOwner ? (
              <button
                type="button"
                className={styles.statsLink}
                onClick={() => router.push("/connections?tab=connections")}
              >
                {t(connectionsCount === 1 ? "connectionOne" : "connectionsMany", { count: connectionsCount })}
              </button>
            ) : isConnected && user?.username ? (
              <button
                type="button"
                className={styles.statsLink}
                onClick={() => router.push(`/in/${encodeURIComponent(user.username)}/network`)}
              >
                {t(connectionsCount === 1 ? "connectionOne" : "connectionsMany", { count: connectionsCount })}
              </button>
            ) : (
              <p className={styles.stats}>
                {t(connectionsCount === 1 ? "connectionOne" : "connectionsMany", { count: connectionsCount })}
              </p>
            )}
          </div>

          {headerSchool ? (
            <button
              type="button"
              className={styles.schoolBlock}
              onClick={() => onOpenEducation?.()}
            >
              <span className={styles.schoolLogo} aria-hidden="true">
                {headerSchool.slice(0, 1).toUpperCase()}
              </span>
              <span className={styles.schoolName}>{headerSchool}</span>
            </button>
          ) : null}
        </div>

        {isError && message ? <p className={styles.error}>{message}</p> : null}

        <div className={styles.actions}>
          {isOwner ? (
            <>
              <button type="button" className={styles.primaryBtn} onClick={() => setOpenPanel("openTo")}>
                {t("openTo")}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={() => setOpenPanel("addSection")}>
                {t("addSection")}
              </button>
            </>
          ) : null}
          {!isOwner && incomingRequest ? (
            <>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={isResponding}
                onClick={() => {
                  setIsResponding(true);
                  dispatch(respondToRequest({ requestId: incomingRequest._id, action_type: "accept" }))
                    .then((result) => {
                      if (respondToRequest.fulfilled.match(result) && user?.username) {
                        dispatch(fetchProfileByUsername(user.username));
                      }
                    })
                    .finally(() => setIsResponding(false));
                }}
              >
                {t("accept")}
              </button>
              <button
                type="button"
                className={styles.rejectBtn}
                disabled={isResponding}
                onClick={() => {
                  setIsResponding(true);
                  dispatch(respondToRequest({ requestId: incomingRequest._id, action_type: "reject" }))
                    .finally(() => setIsResponding(false));
                }}
              >
                {t("decline")}
              </button>
            </>
          ) : null}
          {!isOwner && !isConnected && !incomingRequest ? (
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!user?._id || isPending || isSendingRequest}
              onClick={() => {
                if (!user?._id || isPending || isSendingRequest) return;
                setIsSendingRequest(true);
                dispatch(sendConnectionRequest(user._id)).finally(() => setIsSendingRequest(false));
              }}
            >
              {isPending ? t("pending") : t("connect")}
            </button>
          ) : null}
          {!isOwner && isConnected ? (
            <button type="button" className={styles.primaryBtn} disabled>
              {t("messageAction")}
            </button>
          ) : null}
          <div className={styles.resourcesWrap} ref={resourcesRef}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={() => setOpenPanel((current) => (current === "resources" ? null : "resources"))}
            >
              {!isOwner ? t("moreBtn") : t("resources")}
            </button>
            {openPanel === "resources" && (
              <div
                ref={resourcesMenuRef}
                className={`${styles.resourcesMenu} ${resourcesPlacement.up ? styles.resourcesMenuUp : ""} ${resourcesPlacement.end ? styles.resourcesMenuEnd : ""}`}
                role="menu"
              >
                <button
                  type="button"
                  className={styles.resourcesItemDisabled}
                  disabled
                >
                  <ResourceIcon name="message" />
                  <span>{t("sendProfileMessage")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!user?._id) return;
                    setOpenPanel(null);
                    dispatch(downloadResume(user._id));
                  }}
                >
                  <ResourceIcon name="pdf" />
                  <span>{t("saveToPdf")}</span>
                </button>
                {isConnected && !isOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user?._id) return;
                      setOpenPanel(null);
                      dispatch(removeConnection(user._id)).then((result) => {
                        if (removeConnection.fulfilled.match(result) && user?.username) {
                          dispatch(fetchProfileByUsername(user.username));
                        }
                      });
                    }}
                  >
                    <ResourceIcon name="remove" />
                    <span>{t("removeConnection")}</span>
                  </button>
                ) : null}
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPanel(null);
                        router.push("/saved");
                      }}
                    >
                      <ResourceIcon name="saved" />
                      <span>{t("savedItems")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenPanel(null);
                        router.push("/profile/activity");
                      }}
                    >
                      <ResourceIcon name="activity" />
                      <span>{t("activity")}</span>
                    </button>
                  </>
                ) : null}
                <button type="button" onClick={() => setOpenPanel("aboutMember")}>
                  <ResourceIcon name="about" />
                  <span>{t("aboutThisMember")}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {openToEnabled && (
          <div className={styles.openToCard}>
            <div className={styles.openToHeader}>
              <div>
                <p className={styles.openToTitle}>
                  {t("openToWork")} · {visibilityLabel}
                </p>
                {(openToWork.location || openToWork.workTypes) ? (
                  <p className={styles.openToMeta}>
                    {[openToWork.location, openToWork.workTypes].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
              {isOwner ? (
                <button
                  type="button"
                  className={styles.smallEdit}
                  aria-label="Edit open to work"
                  onClick={() => setOpenPanel("openTo")}
                >
                  ✎
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setShowOpenToDetails((open) => !open)}
            >
              {showOpenToDetails ? t("hideDetails") : t("showDetails")}
            </button>
            {showOpenToDetails && (
              <p className={styles.openToDetails}>
                {openToWork.location || openToWork.workTypes
                  ? [openToWork.location, openToWork.workTypes].filter(Boolean).join(" · ")
                  : t("openToHint")}
              </p>
            )}
          </div>
        )}
      </div>

      {openPanel === "addSection" && (
        <div className={styles.overlay} onClick={() => setOpenPanel(null)} role="presentation">
          <div
            className={`${styles.dialog} ${styles.addSectionDialog}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-section-title"
          >
            <div className={styles.contactDialogHeader}>
              <h3 id="add-section-title">{t("addToProfile")}</h3>
              <button
                type="button"
                className={styles.aboutClose}
                onClick={() => setOpenPanel(null)}
                aria-label={t("close")}
              >
                ×
              </button>
            </div>
            <div className={styles.addSectionList}>
              {ADD_PROFILE_SECTIONS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={styles.addSectionItem}
                  onClick={() => {
                    if (item.id === "about") {
                      setOpenPanel(null);
                      onAddAbout?.();
                      return;
                    }
                    if (item.id === "education") {
                      setOpenPanel(null);
                      onAddEducation?.();
                      return;
                    }
                    if (item.id === "position") {
                      setOpenPanel(null);
                      onAddExperience?.();
                      return;
                    }
                    if (item.id === "skills") {
                      setOpenPanel(null);
                      onAddSkill?.();
                      return;
                    }
                    if (item.id === "languages") {
                      setOpenPanel(null);
                      onAddLanguage?.();
                    }
                  }}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {openPanel === "contact" && (
        <div className={styles.overlay} onClick={() => setOpenPanel(null)} role="presentation">
          <div
            className={`${styles.dialog} ${styles.contactDialog}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-info-title"
          >
            <div className={styles.contactDialogHeader}>
              <h3 id="contact-info-title">{t("contactInfo")}</h3>
              <div className={styles.contactDialogActions}>
                {isOwner ? (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => {
                      setOpenPanel(null);
                      setIntroStartView("contact");
                      setIntroOpen(true);
                    }}
                  >
                    {t("editContactInfo")}
                  </button>
                ) : null}
                <button type="button" className={styles.secondaryBtn} onClick={() => setOpenPanel(null)}>
                  {t("close")}
                </button>
              </div>
            </div>
            <dl className={styles.contactList}>
              {(() => {
                const contact = profile?.contactInfo || {};
                const profilePath = getPublicProfilePath(user?.username);
                const profileHref = getPublicProfileHref(user?.username);
                const birthdayLabel = formatBirthdayDisplay(contact.birthday, language);
                const websiteHref = contact.website
                  ? (/^https?:\/\//i.test(contact.website) ? contact.website : `https://${contact.website}`)
                  : "";
                const items = [];
                if (profilePath) {
                  items.push(
                    <div className={styles.contactItem} key="url">
                      <dt><ContactIcon name="link" /> {t("profileUrl")}</dt>
                      <dd>
                        <a href={profilePath} target="_blank" rel="noreferrer">{profileHref}</a>
                      </dd>
                    </div>
                  );
                }
                if (hasSavedValue(contact.email)) {
                  items.push(
                    <div className={styles.contactItem} key="email">
                      <dt>
                        <ContactIcon name="email" />
                        {t("email")}{contact.emailVisibility ? ` · ${t(VISIBILITY_LABEL_KEYS[contact.emailVisibility] || "anyone")}` : ""}
                      </dt>
                      <dd>
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </dd>
                    </div>
                  );
                }
                if (hasSavedValue(contact.phone)) {
                  items.push(
                    <div className={styles.contactItem} key="phone">
                      <dt>
                        <ContactIcon name="phone" />
                        {t("phone")}
                        {contact.phoneType ? ` · ${contact.phoneType}` : ""}
                        {contact.phoneVisibility ? ` · ${t(VISIBILITY_LABEL_KEYS[contact.phoneVisibility] || "anyone")}` : ""}
                      </dt>
                      <dd>
                        <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                      </dd>
                    </div>
                  );
                }
                if (hasSavedValue(contact.address)) {
                  items.push(
                    <div className={styles.contactItem} key="address">
                      <dt><ContactIcon name="address" /> {t("address")}</dt>
                      <dd>{contact.address}</dd>
                    </div>
                  );
                }
                if (birthdayLabel) {
                  items.push(
                    <div className={styles.contactItem} key="birthday">
                      <dt><ContactIcon name="birthday" /> {t("birthday")}</dt>
                      <dd>{birthdayLabel}</dd>
                    </div>
                  );
                }
                if (hasSavedValue(contact.website)) {
                  items.push(
                    <div className={styles.contactItem} key="website">
                      <dt><ContactIcon name="website" /> {t("website")}</dt>
                      <dd>
                        <a href={websiteHref} target="_blank" rel="noreferrer">{contact.website}</a>
                      </dd>
                    </div>
                  );
                }
                if (hasSavedValue(contact.instantMessaging)) {
                  items.push(
                    <div className={styles.contactItem} key="im">
                      <dt><ContactIcon name="im" /> {t("instantMessaging")}</dt>
                      <dd>{contact.instantMessaging}</dd>
                    </div>
                  );
                }
                if (items.length === 0) {
                  return <p className={styles.contactEmpty}>{t("noContactInfo")}</p>;
                }
                return items;
              })()}
            </dl>
          </div>
        </div>
      )}

      {openPanel === "aboutMember" && (
        <div className={styles.overlay} onClick={() => setOpenPanel(null)} role="presentation">
          <div
            className={`${styles.dialog} ${styles.aboutDialog}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-member-title"
          >
            <div className={styles.contactDialogHeader}>
              <h3 id="about-member-title">{t("aboutThisMember")}</h3>
              <button type="button" className={styles.aboutClose} onClick={() => setOpenPanel(null)} aria-label={t("close")}>
                ×
              </button>
            </div>
            <div className={styles.aboutBody}>
              <h4 className={styles.aboutSectionTitle}>{t("accountHistory")}</h4>
              {joinedLabel ? (
                <div className={styles.aboutRow}>
                  <p className={styles.aboutLabel}>{t("joined")}</p>
                  <p className={styles.aboutValue}>{joinedLabel}</p>
                </div>
              ) : null}
              <div className={styles.aboutRow}>
                <p className={styles.aboutLabel}>{t("contactInfo")}</p>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setOpenPanel("contact")}
                >
                  {contactAdded ? t("added") : t("notAdded")}
                </button>
              </div>
              <div className={styles.aboutRow}>
                <p className={styles.aboutLabel}>{t("profilePhoto")}</p>
                <p className={styles.aboutValue}>{hasPhoto ? t("added") : t("notAdded")}</p>
              </div>
            </div>
            <div className={styles.aboutFooter}>
              <button type="button" className={styles.primaryBtn} onClick={() => setOpenPanel(null)}>
                {t("done")}
              </button>
            </div>
          </div>
        </div>
      )}

      {openPanel === "openTo" && (
        <div className={styles.overlay} onClick={() => setOpenPanel(null)} role="presentation">
          <div className={styles.dialog} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <h3>{t("openToWork")}</h3>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={openToDraft.enabled}
                onChange={(event) => setOpenToDraft((current) => ({ ...current, enabled: event.target.checked }))}
              />
              {t("showOpenToWork")}
            </label>
            <label className={styles.fieldLabel}>{t("visibleTo")}</label>
            <select
              value={openToDraft.visibility}
              onChange={(event) => setOpenToDraft((current) => ({ ...current, visibility: event.target.value }))}
            >
              {OPEN_TO_VISIBILITY.map((option) => (
                <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
              ))}
            </select>
            <label className={styles.fieldLabel}>{t("locations")}</label>
            <input
              value={openToDraft.location}
              onChange={(event) => setOpenToDraft((current) => ({ ...current, location: event.target.value }))}
              placeholder="City, Remote, Hybrid"
            />
            <label className={styles.fieldLabel}>{t("workTypes")}</label>
            <input
              value={openToDraft.workTypes}
              onChange={(event) => setOpenToDraft((current) => ({ ...current, workTypes: event.target.value }))}
              placeholder="On-site · Hybrid · Remote"
            />
            <div className={styles.dialogActions}>
              <button type="button" className={styles.ghostBtn} onClick={() => setOpenPanel(null)}>{t("cancel")}</button>
              <button type="button" className={styles.primaryBtn} onClick={handleSaveOpenTo}>{t("save")}</button>
            </div>
          </div>
        </div>
      )}

      <ProfileIntroFlow
        open={introOpen}
        profile={profile}
        initialView={introStartView}
        onClose={() => setIntroOpen(false)}
      />
      <CoverPhotoFlow
        open={coverOpen}
        coverSrc={coverSrc}
        hasCover={hasCover}
        onClose={() => setCoverOpen(false)}
      />
      <ProfilePhotoFlow
        open={photoOpen}
        hasPhoto={hasPhoto}
        photoSrc={photoSrc}
        frameId={photoFrame}
        visibility={photoVisibility}
        onClose={() => setPhotoOpen(false)}
      />
    </section>
  );
}
