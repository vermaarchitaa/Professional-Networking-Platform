import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import CreatePost from "@/Components/CreatePost";
import PostCard from "@/Components/PostCard";
import ProfileHeader from "@/Components/ProfileHeader";
import {
  fetchUserProfile,
  fetchProfileByUsername,
  updateProfileData,
  updateUserInfo,
  addProfileSkill,
} from "@/config/redux/action/profileAction";
import { fetchPosts } from "@/config/redux/action/postAction";
import { ProfileFormSkeleton, PostSkeleton } from "@/Components/Skeleton";
import EducationRecordForm, {
  emptyEducation,
  formatEducationDates,
  cleanEducation,
} from "@/Components/EducationRecordForm";
import EditAboutModal, { ABOUT_MAX_LENGTH } from "@/Components/EditAboutModal";
import EditEducationModal from "@/Components/EditEducationModal";
import EducationMediaViewer from "@/Components/EducationMediaViewer";
import SkillsSection from "@/Components/SkillsSection";
import AddSkillModal from "@/Components/AddSkillModal";
import ExperienceSection from "@/Components/ExperienceSection";
import EditExperienceModal from "@/Components/EditExperienceModal";
import {
  cleanExperience,
  syncProfileSkillsForExperience,
} from "@/Components/ExperienceRecordForm";
import LanguagesSection from "@/Components/LanguagesSection";
import EditLanguageModal from "@/Components/EditLanguageModal";
import { cleanLanguage, isFilledLanguage } from "@/Components/LanguageRecordForm";
import { listProfileSkills } from "@/Components/SkillsSection/skillUtils";
import { validateProfile } from "@/config/validation";
import useAuthGuard from "@/hooks/useAuth";
import { getMediaUrl, formatDate, getPostMediaItems, isImageMedia, sortActivityPosts } from "@/config/utils";
import { clearViewedProfile } from "@/config/redux/reducer/profileReducer";
import styles from "./style.module.css";

const emptyWork = { company: "", position: "", years: "" };
const PREVIEW_LIMIT = 3;
const ABOUT_PREVIEW_LIMIT = 240;

function getAboutPreview(text) {
  const value = String(text || "");
  if (value.length <= ABOUT_PREVIEW_LIMIT) return { preview: value, canExpand: false };
  const slice = value.slice(0, ABOUT_PREVIEW_LIMIT);
  const breakAt = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("\n"));
  const preview = (breakAt > 80 ? slice.slice(0, breakAt) : slice).replace(/\s+$/, "");
  return { preview, canExpand: true };
}

export default function ProfilePage({ publicUsername = "" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const editRef = useRef(null);
  const educationRef = useRef(null);
  const [highlightEducation, setHighlightEducation] = useState(false);
  const {
    profile: ownProfile,
    viewedProfile,
    viewedLoading,
    viewedError,
    message,
    isLoading,
  } = useSelector((state) => state.profile);
  const { posts, isLoading: postsLoading } = useSelector((state) => state.posts);
  const [bio, setBio] = useState("");
  const [currentPost, setCurrentPost] = useState("");
  const [pastWork, setPastWork] = useState([{ ...emptyWork }]);
  const [education, setEducation] = useState([{ ...emptyEducation }]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutError, setAboutError] = useState("");
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [educationSaving, setEducationSaving] = useState(false);
  const [educationError, setEducationError] = useState("");
  const [educationTarget, setEducationTarget] = useState(null);
  const [educationMediaViewer, setEducationMediaViewer] = useState(null);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillSaving, setSkillSaving] = useState(false);
  const [skillError, setSkillError] = useState("");
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [experienceSaving, setExperienceSaving] = useState(false);
  const [experienceError, setExperienceError] = useState("");
  const [experienceTarget, setExperienceTarget] = useState(null);
  const [experienceMediaViewer, setExperienceMediaViewer] = useState(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageError, setLanguageError] = useState("");
  const [languageTarget, setLanguageTarget] = useState(null);
  const [activityTab, setActivityTab] = useState("posts");
  const [previewTile, setPreviewTile] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const carouselRef = useRef(null);

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchPosts());
    if (publicUsername) {
      dispatch(fetchProfileByUsername(publicUsername));
    } else {
      dispatch(clearViewedProfile());
    }
  }, [dispatch, publicUsername]);

  const isPublicRoute = Boolean(publicUsername);
  const isOwner = !isPublicRoute || Boolean(
    ownProfile?.userId?.username && publicUsername && ownProfile.userId.username === publicUsername
  );
  const profile = isPublicRoute && !isOwner ? viewedProfile : ownProfile;
  const myId = profile?.userId?._id;
  const myPosts = sortActivityPosts(posts.filter((p) => p.userId?._id === myId));
  const featuredSignature = myPosts.filter((post) => post.featured === true).map((post) => post._id).join(",");
  const imageTiles = myPosts.flatMap((post) =>
    getPostMediaItems(post)
      .filter(isImageMedia)
      .map((item) => ({ post, item }))
  );
  const previewPosts = myPosts.slice(0, PREVIEW_LIMIT);
  const previewTiles = imageTiles.slice(0, PREVIEW_LIMIT);
  const tabHasItems = activityTab === "images" ? imageTiles.length > 0 : myPosts.length > 0;
  const previewEmpty = activityTab === "images" ? previewTiles.length === 0 : previewPosts.length === 0;

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio || "");
    setCurrentPost(profile.currentPost || "");
    setPastWork(profile.pastWork?.length ? profile.pastWork : [{ ...emptyWork }]);
    setEducation(profile.education?.length ? profile.education : [{ ...emptyEducation }]);
    setName(profile.userId?.name || "");
    setUsername(profile.userId?.username || "");
    setEmail(profile.userId?.email || "");
    setLocation(profile.location || "");
  }, [profile]);

  useEffect(() => {
    setIsAboutExpanded(false);
  }, [profile?.bio]);

  useEffect(() => {
    if (message) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (!previewTile) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPreviewTile(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewTile]);

  const updateCarouselNav = () => {
    const el = carouselRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateCarouselNav();
    const el = carouselRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", updateCarouselNav);
    window.addEventListener("resize", updateCarouselNav);
    return () => {
      el.removeEventListener("scroll", updateCarouselNav);
      window.removeEventListener("resize", updateCarouselNav);
    };
  }, [myPosts.length, activityTab, postsLoading]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "smooth" });
    updateCarouselNav();
  }, [featuredSignature]);

  const scrollCarousel = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const slide = el.querySelector("[data-carousel-slide]");
    const amount = slide ? slide.getBoundingClientRect().width + 12 : Math.max(el.clientWidth * 0.8, 200);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const handleSave = () => {
    const errors = validateProfile({ name, username, email });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    dispatch(updateUserInfo({ name, username, email }));
    const mergedWork = pastWork.map((work, index) => {
      const existing = (profile?.pastWork || [])[index] || {};
      return { ...existing, company: work.company, position: work.position, years: work.years };
    });
    dispatch(updateProfileData({ bio, currentPost, pastWork: mergedWork, education, location }));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (!profile) {
      setIsEditing(false);
      return;
    }
    setBio(profile.bio || "");
    setCurrentPost(profile.currentPost || "");
    setPastWork(profile.pastWork?.length ? profile.pastWork : [{ ...emptyWork }]);
    setEducation(profile.education?.length ? profile.education : [{ ...emptyEducation }]);
    setName(profile.userId?.name || "");
    setUsername(profile.userId?.username || "");
    setEmail(profile.userId?.email || "");
    setLocation(profile.location || "");
    setFieldErrors({});
    setIsEditing(false);
  };

  const openAboutEditor = () => {
    if (!isOwner) return;
    setAboutError("");
    setAboutOpen(true);
  };

  const closeAboutEditor = () => {
    if (aboutSaving) return;
    setAboutError("");
    setAboutOpen(false);
  };

  const handleSaveAbout = async (text) => {
    const nextBio = String(text || "").trim().slice(0, ABOUT_MAX_LENGTH);
    setAboutSaving(true);
    setAboutError("");
    const result = await dispatch(updateProfileData({ bio: nextBio }));
    setAboutSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setAboutOpen(false);
      return;
    }
    setAboutError(result.payload?.message || "Failed to save About");
  };

  const openEditor = () => {
    if (!isOwner) return;
    setIsEditing(true);
    setTimeout(() => {
      editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const serializeEducationList = (list) =>
    (list || []).map((entry) => {
      const cleaned = cleanEducation(entry);
      if (entry?._id) return { ...cleaned, _id: entry._id };
      return cleaned;
    });

  const openAddEducation = () => {
    if (!isOwner) return;
    setEducationError("");
    setEducationTarget(null);
    setEducationOpen(true);
  };

  const serializeExperienceList = (list) =>
    (list || []).map((entry) => {
      const cleaned = cleanExperience(entry);
      if (entry?._id) return { ...cleaned, _id: entry._id };
      return cleaned;
    });

  const persistExperience = async (cleaned, target) => {
    const current = serializeExperienceList(profile?.pastWork);
    const next = !target
      ? [...current, cleaned]
      : current.map((entry, index) => {
        const match = target._id
          ? String(entry._id) === target._id
          : index === target.index;
        return match ? { ...cleaned, ...(entry._id ? { _id: entry._id } : {}) } : entry;
      });
    setExperienceSaving(true);
    setExperienceError("");
    const result = await dispatch(updateProfileData({ pastWork: next }));
    if (updateProfileData.rejected.match(result)) {
      setExperienceSaving(false);
      setExperienceError(result.payload?.message || "Failed to save experience");
      return;
    }
    const refreshed = await dispatch(fetchUserProfile());
    const latest = refreshed.payload || {};
    const saved = target?._id
      ? (latest.pastWork || []).find((entry) => String(entry._id) === target._id)
      : (latest.pastWork || []).find((entry) => (
        entry.company === cleaned.company
        && entry.position === cleaned.position
        && entry.startDate === cleaned.startDate
      ));
    if (saved?._id) {
      const skills = syncProfileSkillsForExperience(
        latest.skills,
        saved._id,
        (cleaned.skills || []).map((item) => item.name)
      );
      await dispatch(updateProfileData({ skills }));
    }
    setExperienceSaving(false);
    setExperienceOpen(false);
    setExperienceTarget(null);
  };

  const openAddExperience = () => {
    if (!isOwner) return;
    setExperienceError("");
    setExperienceTarget(null);
    setExperienceOpen(true);
  };

  const handleDeleteExperience = async () => {
    if (!experienceTarget) return;
    const current = serializeExperienceList(profile?.pastWork);
    const next = experienceTarget._id
      ? current.filter((entry) => String(entry._id) !== experienceTarget._id)
      : current.filter((_, index) => index !== experienceTarget.index);
    setExperienceSaving(true);
    setExperienceError("");
    const result = await dispatch(updateProfileData({ pastWork: next }));
    setExperienceSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setExperienceOpen(false);
      setExperienceTarget(null);
      return;
    }
    setExperienceError(result.payload?.message || "Failed to delete experience");
  };

  const serializeLanguageList = (list) =>
    (list || []).map((entry) => {
      const cleaned = cleanLanguage(entry);
      if (entry?._id) return { ...cleaned, _id: entry._id };
      return cleaned;
    });

  const persistLanguage = async (cleaned, target) => {
    const current = serializeLanguageList(profile?.languages);
    const next = !target
      ? [...current, cleaned]
      : current.map((entry, index) => {
        const match = target._id
          ? String(entry._id) === target._id
          : index === target.index;
        return match ? { ...cleaned, ...(entry._id ? { _id: entry._id } : {}) } : entry;
      });
    setLanguageSaving(true);
    setLanguageError("");
    const result = await dispatch(updateProfileData({ languages: next }));
    setLanguageSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setLanguageOpen(false);
      setLanguageTarget(null);
      return;
    }
    setLanguageError(result.payload?.message || "Failed to save language");
  };

  const openAddLanguage = () => {
    if (!isOwner) return;
    setLanguageError("");
    setLanguageTarget(null);
    setLanguageOpen(true);
  };

  const handleDeleteLanguage = async () => {
    if (!languageTarget) return;
    const current = serializeLanguageList(profile?.languages);
    const next = languageTarget._id
      ? current.filter((entry) => String(entry._id) !== languageTarget._id)
      : current.filter((_, index) => index !== languageTarget.index);
    setLanguageSaving(true);
    setLanguageError("");
    const result = await dispatch(updateProfileData({ languages: next }));
    setLanguageSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setLanguageOpen(false);
      setLanguageTarget(null);
      return;
    }
    setLanguageError(result.payload?.message || "Failed to delete language");
  };

  const openAddSkill = () => {
    if (!isOwner) return;
    setSkillError("");
    setSkillModalOpen(true);
  };

  const handleSaveSkill = async (name) => {
    setSkillSaving(true);
    setSkillError("");
    const result = await dispatch(addProfileSkill(name));
    setSkillSaving(false);
    if (addProfileSkill.fulfilled.match(result)) {
      setSkillModalOpen(false);
      return;
    }
    setSkillError(result.payload?.message || "Failed to add skill");
  };

  const openEditEducation = (entry) => {
    if (!isOwner) return;
    const list = profile?.education || [];
    const index = entry?._id
      ? list.findIndex((item) => String(item._id) === String(entry._id))
      : list.indexOf(entry);
    setEducationError("");
    setEducationTarget({
      _id: entry?._id ? String(entry._id) : "",
      index: index >= 0 ? index : 0,
    });
    setEducationOpen(true);
  };

  const closeEducationEditor = () => {
    if (educationSaving) return;
    setEducationError("");
    setEducationOpen(false);
    setEducationTarget(null);
  };

  const handleSaveEducation = async (cleaned) => {
    const current = serializeEducationList(profile?.education);
    let next;
    if (!educationTarget) {
      next = [...current, cleaned];
    } else {
      const byId = educationTarget._id
        ? current.findIndex((entry) => String(entry._id) === educationTarget._id)
        : -1;
      const index = byId >= 0 ? byId : educationTarget.index;
      next = current.map((entry, i) => (
        i === index
          ? { ...cleaned, ...(entry._id ? { _id: entry._id } : {}) }
          : entry
      ));
    }

    setEducationSaving(true);
    setEducationError("");
    const result = await dispatch(updateProfileData({ education: next }));
    setEducationSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setEducationOpen(false);
      setEducationTarget(null);
      return;
    }
    setEducationError(result.payload?.message || "Failed to save education");
  };

  const handleDeleteEducation = async () => {
    if (!educationTarget) return;
    const current = serializeEducationList(profile?.education);
    const next = educationTarget._id
      ? current.filter((entry) => String(entry._id) !== educationTarget._id)
      : current.filter((_, index) => index !== educationTarget.index);

    setEducationSaving(true);
    setEducationError("");
    const result = await dispatch(updateProfileData({ education: next }));
    setEducationSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setEducationOpen(false);
      setEducationTarget(null);
      return;
    }
    setEducationError(result.payload?.message || "Failed to delete education");
  };

  const openEducationSection = () => {
    setIsEditing(false);
    setTimeout(() => {
      educationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightEducation(true);
      window.setTimeout(() => setHighlightEducation(false), 1600);
    }, 0);
  };

  const updateWork = (index, field, value) => {
    const updated = [...pastWork];
    updated[index] = { ...updated[index], [field]: value };
    setPastWork(updated);
  };

  if (
    (!isPublicRoute && isLoading && !ownProfile)
    || (isPublicRoute && !viewedProfile && !viewedError)
  ) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <ProfileFormSkeleton />
          <ProfileFormSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (isPublicRoute && !viewedProfile) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <section className={styles.section}>
            <h2>Profile not available</h2>
            <p className={styles.displayText}>{viewedError || "This profile URL is not available."}</p>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  const visibleWork = (profile?.pastWork || []).filter((w) => w.company || w.position || w.years);
  const visibleEdu = (profile?.education || []).filter((e) => String(e?.school || "").trim());
  const aboutText = String(profile?.bio || "").trim();
  const aboutPreview = getAboutPreview(aboutText);
  const openEducationDetails = () => {
    router.push(isPublicRoute ? `/in/${encodeURIComponent(publicUsername)}/education` : "/profile/education");
  };
  const viewerEducation = educationMediaViewer
    ? visibleEdu.find((edu, index) => (edu._id ? String(edu._id) : `idx-${index}`) === educationMediaViewer.eduKey)
    : null;
  const viewerMediaItems = (viewerEducation?.media || []).filter((item) => item?.url);
  const viewerExperience = experienceMediaViewer
    ? visibleWork.find((entry, index) => (entry._id ? String(entry._id) : `idx-${index}`) === experienceMediaViewer.workKey)
    : null;
  const experienceViewerItems = (viewerExperience?.media || []).filter((item) => item?.url);
  const experienceInitial = experienceTarget
    ? (
      (experienceTarget._id
        ? (profile?.pastWork || []).find((entry) => String(entry._id) === experienceTarget._id)
        : null)
      || (profile?.pastWork || [])[experienceTarget.index]
      || null
    )
    : null;
  const educationInitial = educationTarget
    ? (
      (educationTarget._id
        ? (profile?.education || []).find((entry) => String(entry._id) === educationTarget._id)
        : null)
      || (profile?.education || [])[educationTarget.index]
      || null
    )
    : null;
  const languageInitial = languageTarget
    ? (
      (languageTarget._id
        ? (profile?.languages || []).find((entry) => String(entry._id) === languageTarget._id)
        : null)
      || (profile?.languages || [])[languageTarget.index]
      || null
    )
    : null;
  const existingLanguages = (profile?.languages || []).filter(isFilledLanguage).filter((entry) => (
    languageTarget
      ? (languageTarget._id
        ? String(entry._id) !== languageTarget._id
        : (profile?.languages || []).indexOf(entry) !== languageTarget.index)
      : true
  ));

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <ProfileHeader
          profile={profile}
          isOwner={isOwner}
          onEditProfile={openEditor}
          onOpenEducation={openEducationSection}
          onAddAbout={openAboutEditor}
          onAddEducation={openAddEducation}
          onAddExperience={openAddExperience}
          onAddSkill={openAddSkill}
          onAddLanguage={openAddLanguage}
        />
        <div id="profile-edit" ref={editRef} />

        {saved && <p className={styles.success}>{message}</p>}

        {!(isOwner && isEditing) ? (
          <>
            {aboutText ? (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>About</h2>
                  {isOwner ? (
                    <button
                      type="button"
                      className={styles.sectionEdit}
                      onClick={openAboutEditor}
                      aria-label="Edit about"
                    >
                      ✎
                    </button>
                  ) : null}
                </div>
                <p className={`${styles.displayText} ${styles.aboutText}`}>
                  {isAboutExpanded || !aboutPreview.canExpand ? aboutText : `${aboutPreview.preview}... `}
                  {aboutPreview.canExpand ? (
                    <button
                      type="button"
                      className={styles.aboutMore}
                      onClick={() => setIsAboutExpanded((open) => !open)}
                    >
                      {isAboutExpanded ? "less" : "more"}
                    </button>
                  ) : null}
                </p>
              </section>
            ) : null}

            <ExperienceSection
              profile={profile}
              isOwner={isOwner}
              onAdd={openAddExperience}
              onOpenDetails={() => router.push(isPublicRoute ? `/in/${encodeURIComponent(publicUsername)}/experience` : "/profile/experience")}
              onOpenMedia={setExperienceMediaViewer}
            />

            {visibleEdu.length > 0 ? (
              <section
                id="education"
                ref={educationRef}
                className={`${styles.section} ${highlightEducation ? styles.eduHighlight : ""}`}
              >
                <div className={styles.sectionHeader}>
                  <h2>Education</h2>
                  {isOwner ? (
                    <div className={styles.sectionActions}>
                      <button
                        type="button"
                        className={styles.sectionEdit}
                        onClick={openAddEducation}
                        aria-label="Add education"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className={styles.sectionEdit}
                        onClick={openEducationDetails}
                        aria-label="Manage education"
                      >
                        ✎
                      </button>
                    </div>
                  ) : null}
                </div>
                {visibleEdu.slice(0, 2).map((edu, i) => {
                  const skillNames = (edu.skills || []).map((item) => item?.name).filter(Boolean);
                  const mediaItems = (edu.media || []).filter((item) => item?.url);
                  const schoolLetter = (String(edu.school || "").trim()[0] || "?").toUpperCase();
                  const eduKey = edu._id ? String(edu._id) : `idx-${i}`;
                  return (
                    <div
                      key={edu._id || i}
                      className={`${styles.displayEntry} ${styles.eduRecord} ${highlightEducation ? styles.eduItemHighlight : ""}`}
                    >
                      <span className={styles.eduAvatar} aria-hidden="true">{schoolLetter}</span>
                      <div className={styles.eduBody}>
                        <p className={styles.displayEntryTitle}>{edu.school}</p>
                        {edu.degree ? <p className={styles.displayMeta}>{edu.degree}</p> : null}
                        {edu.fieldOfStudy ? <p className={styles.displayMeta}>{edu.fieldOfStudy}</p> : null}
                        {formatEducationDates(edu) ? <p className={styles.displayMeta}>{formatEducationDates(edu)}</p> : null}
                        {edu.grade ? <p className={styles.displayMeta}>Grade: {edu.grade}</p> : null}
                        {edu.activitiesAndSocieties ? (
                          <p className={styles.displayText}>
                            <strong>Activities and societies: </strong>
                            {edu.activitiesAndSocieties}
                          </p>
                        ) : null}
                        {edu.description ? <p className={`${styles.displayText} ${styles.aboutText}`}>{edu.description}</p> : null}
                        {skillNames.length > 0 ? (
                          <p className={styles.displayText}><strong>Skills: </strong>{skillNames.join(", ")}</p>
                        ) : null}
                        {mediaItems.length > 0 ? (
                          <div className={styles.eduMediaGrid}>
                            {mediaItems.map((item, mediaIndex) => (
                              item.type === "image" ? (
                                <button
                                  key={`${item.url}-${mediaIndex}`}
                                  type="button"
                                  className={styles.eduMediaImageBtn}
                                  onClick={() => setEducationMediaViewer({ eduKey, mediaIndex })}
                                  aria-label={item.name || "Open education media"}
                                >
                                  <img
                                    src={getMediaUrl(item.url)}
                                    alt={item.name || "Education media"}
                                    className={styles.eduMediaImage}
                                  />
                                </button>
                              ) : (
                                <button
                                  key={`${item.url}-${mediaIndex}`}
                                  type="button"
                                  className={styles.eduMediaLink}
                                  onClick={() => setEducationMediaViewer({ eduKey, mediaIndex })}
                                >
                                  {item.name || (item.type === "document" ? "Document" : item.url)}
                                </button>
                              )
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {visibleEdu.length > 2 ? (
                  <button
                    type="button"
                    className={styles.showAll}
                    onClick={openEducationDetails}
                  >
                    Show all {visibleEdu.length} educations →
                  </button>
                ) : null}
              </section>
            ) : null}

            <SkillsSection
              profile={profile}
              isOwner={isOwner}
              onAdd={openAddSkill}
              onOpenDetails={() => router.push(isPublicRoute ? `/in/${encodeURIComponent(publicUsername)}/skills` : "/profile/skills")}
            />
          </>
        ) : (
          <>
            <section className={styles.section}>
              <h2>Basic Info</h2>
              <div className={styles.grid}>
                <div className={styles.fieldWrap}>
                  <input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" }); }}
                    className={fieldErrors.name ? styles.inputError : ""}
                  />
                  {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
                </div>
                <div className={styles.fieldWrap}>
                  <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" }); }}
                    className={fieldErrors.username ? styles.inputError : ""}
                  />
                  {fieldErrors.username && <span className={styles.fieldError}>{fieldErrors.username}</span>}
                </div>
                <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
                  <input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" }); }}
                    className={fieldErrors.email ? styles.inputError : ""}
                  />
                  {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
                </div>
                <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
                  <input
                    placeholder="Location (e.g. Ghaziabad, Uttar Pradesh, India)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <h2>About</h2>
              <textarea
                placeholder="Write a short bio..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
              <input
                placeholder="Current position (e.g. Software Engineer at Google)"
                value={currentPost}
                onChange={(e) => setCurrentPost(e.target.value)}
              />
            </section>

            <section className={styles.section}>
              <h2>Work Experience</h2>
              {pastWork.map((work, i) => (
                <div key={i} className={styles.entryRow}>
                  <input placeholder="Company" value={work.company} onChange={(e) => updateWork(i, "company", e.target.value)} />
                  <input placeholder="Position" value={work.position} onChange={(e) => updateWork(i, "position", e.target.value)} />
                  <input placeholder="Years" value={work.years} onChange={(e) => updateWork(i, "years", e.target.value)} />
                </div>
              ))}
              <button className={styles.addBtn} onClick={() => setPastWork([...pastWork, { ...emptyWork }])}>
                + Add Experience
              </button>
            </section>

            <section id="education" ref={educationRef} className={styles.section}>
              <h2>Education</h2>
              {education.map((edu, i) => (
                <div key={i} className={styles.eduEditorBlock}>
                  <EducationRecordForm
                    value={edu}
                    onChange={(next) => {
                      const updated = [...education];
                      updated[i] = next;
                      setEducation(updated);
                    }}
                  />
                </div>
              ))}
              <button className={styles.addBtn} onClick={() => setEducation([...education, { ...emptyEducation }])}>
                + Add Education
              </button>
            </section>

            <div className={styles.actions}>
              <button className={styles.saveBtn} onClick={handleSave}>
                Save Profile
              </button>
              <button className={styles.downloadBtn} onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </>
        )}

        <section className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h2 className={styles.activityTitle}>Activity</h2>
            <div className={styles.activityActions}>
              {isOwner ? (
                <button
                  type="button"
                  className={styles.createPostBtn}
                  onClick={() => setShowComposer(true)}
                >
                  Create a post
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              className={activityTab === "posts" ? styles.tabActive : styles.tab}
              onClick={() => {
                setActivityTab("posts");
                setPreviewTile(null);
              }}
            >
              Posts
            </button>
            <button
              type="button"
              className={activityTab === "images" ? styles.tabActive : styles.tab}
              onClick={() => setActivityTab("images")}
            >
              Images
            </button>
          </div>

          {postsLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : previewEmpty ? (
            <div className={styles.activityEmpty}>
              <p>
                {activityTab === "images"
                  ? "No images yet. Share a post with a photo."
                  : "No activity yet. Share a post."}
              </p>
            </div>
          ) : activityTab === "images" ? (
            <div className={styles.imageGrid}>
              {previewTiles.map(({ post, item }) => (
                <button
                  type="button"
                  key={`${post._id}-${item.filename}`}
                  className={styles.imageTile}
                  onClick={() => setPreviewTile({ post, item })}
                  aria-label="View image"
                >
                  <img src={getMediaUrl(item.filename)} alt="" />
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.carousel}>
              <button
                type="button"
                className={styles.carouselArrow}
                onClick={() => scrollCarousel(-1)}
                disabled={!canScrollLeft}
                aria-label="Previous posts"
              >
                ←
              </button>
              <div className={styles.carouselTrack} ref={carouselRef}>
                {myPosts.map((post) => (
                  <div key={post._id} className={styles.carouselSlide} data-carousel-slide>
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={styles.carouselArrow}
                onClick={() => scrollCarousel(1)}
                disabled={!canScrollRight}
                aria-label="Next posts"
              >
                →
              </button>
            </div>
          )}

          {previewTile && (
            <div
              className={styles.imageModalOverlay}
              onClick={() => setPreviewTile(null)}
              role="presentation"
            >
              <div
                className={styles.imageModal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Image preview"
              >
                <button
                  type="button"
                  className={styles.imageModalClose}
                  onClick={() => setPreviewTile(null)}
                  aria-label="Close preview"
                >
                  ✕
                </button>
                <img
                  src={getMediaUrl(previewTile.item.filename)}
                  alt=""
                  className={styles.imageModalImg}
                />
                {previewTile.post.body && (
                  <p className={styles.imageModalBody}>{previewTile.post.body}</p>
                )}
                <p className={styles.imageModalMeta}>
                  {formatDate(previewTile.post.createdAt)}
                </p>
              </div>
            </div>
          )}

          {isOwner && tabHasItems && (
            <button
              type="button"
              className={styles.showAll}
              onClick={() => router.push("/profile/activity")}
            >
              Show all →
            </button>
          )}
        </section>

        <LanguagesSection
          profile={profile}
          isOwner={isOwner}
          onAdd={openAddLanguage}
          onOpenDetails={() => router.push(isPublicRoute ? `/in/${encodeURIComponent(publicUsername)}/languages` : "/profile/languages")}
        />

        {isOwner ? (
          <CreatePost
            isOpen={showComposer}
            onClose={() => setShowComposer(false)}
            user={ownProfile?.userId}
          />
        ) : null}
        {isOwner ? (
          <EditAboutModal
            isOpen={aboutOpen}
            initialValue={profile?.bio || ""}
            isSaving={aboutSaving}
            error={aboutError}
            onClose={closeAboutEditor}
            onSave={handleSaveAbout}
          />
        ) : null}
        {viewerMediaItems.length > 0 ? (
          <EducationMediaViewer
            items={viewerMediaItems}
            index={Math.min(educationMediaViewer.mediaIndex, viewerMediaItems.length - 1)}
            onClose={() => setEducationMediaViewer(null)}
            onIndexChange={(nextIndex) => setEducationMediaViewer((current) => (
              current ? { ...current, mediaIndex: nextIndex } : current
            ))}
          />
        ) : null}
        {isOwner ? (
          <EditEducationModal
            isOpen={educationOpen}
            initialValue={educationInitial}
            isSaving={educationSaving}
            error={educationError}
            onClose={closeEducationEditor}
            onSave={handleSaveEducation}
            onDelete={handleDeleteEducation}
          />
        ) : null}
        {experienceViewerItems.length > 0 ? (
          <EducationMediaViewer
            items={experienceViewerItems}
            index={Math.min(experienceMediaViewer.mediaIndex, experienceViewerItems.length - 1)}
            onClose={() => setExperienceMediaViewer(null)}
            onIndexChange={(nextIndex) => setExperienceMediaViewer((current) => (
              current ? { ...current, mediaIndex: nextIndex } : current
            ))}
          />
        ) : null}
        {isOwner ? (
          <EditExperienceModal
            isOpen={experienceOpen}
            initialValue={experienceInitial}
            profile={profile}
            isSaving={experienceSaving}
            error={experienceError}
            onClose={() => !experienceSaving && setExperienceOpen(false)}
            onSave={(cleaned) => persistExperience(cleaned, experienceTarget)}
            onDelete={handleDeleteExperience}
          />
        ) : null}
        {isOwner ? (
          <AddSkillModal
            isOpen={skillModalOpen}
            profile={profile}
            existingNames={listProfileSkills(profile).map((item) => item.name)}
            isSaving={skillSaving}
            error={skillError}
            onClose={() => !skillSaving && setSkillModalOpen(false)}
            onSave={handleSaveSkill}
          />
        ) : null}
        {isOwner ? (
          <EditLanguageModal
            isOpen={languageOpen}
            initialValue={languageInitial}
            existingLanguages={existingLanguages}
            isSaving={languageSaving}
            error={languageError}
            onClose={() => !languageSaving && setLanguageOpen(false)}
            onSave={(cleaned) => persistLanguage(cleaned, languageTarget)}
            onDelete={handleDeleteLanguage}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
