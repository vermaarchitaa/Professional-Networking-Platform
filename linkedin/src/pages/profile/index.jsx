import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import Avatar from "@/Components/Avatar";
import CreatePost from "@/Components/CreatePost";
import PostCard from "@/Components/PostCard";
import {
  fetchUserProfile,
  updateProfileData,
  updateUserInfo,
  uploadProfilePicture,
  downloadResume,
} from "@/config/redux/action/profileAction";
import { fetchPosts } from "@/config/redux/action/postAction";
import { ProfileFormSkeleton, PostSkeleton } from "@/Components/Skeleton";
import { validateProfile } from "@/config/validation";
import useAuthGuard from "@/hooks/useAuth";
import { getMediaUrl, formatDate, getPostMediaItems, isImageMedia, sortActivityPosts } from "@/config/utils";
import styles from "./style.module.css";

const emptyWork = { company: "", position: "", years: "" };
const emptyEducation = { school: "", degree: "", fieldOfStudy: "" };
const PREVIEW_LIMIT = 3;

export default function ProfilePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const editRef = useRef(null);
  const { profile, message, isLoading } = useSelector((state) => state.profile);
  const { posts, isLoading: postsLoading } = useSelector((state) => state.posts);
  const [bio, setBio] = useState("");
  const [currentPost, setCurrentPost] = useState("");
  const [pastWork, setPastWork] = useState([{ ...emptyWork }]);
  const [education, setEducation] = useState([{ ...emptyEducation }]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [activityTab, setActivityTab] = useState("posts");
  const [previewTile, setPreviewTile] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const carouselRef = useRef(null);

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchPosts());
  }, [dispatch]);

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
  }, [profile]);

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
    dispatch(updateProfileData({ bio, currentPost, pastWork, education }));
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
    setFieldErrors({});
    setIsEditing(false);
  };

  const openEditor = () => {
    setIsEditing(true);
    setTimeout(() => {
      editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) dispatch(uploadProfilePicture(file));
  };

  const updateWork = (index, field, value) => {
    const updated = [...pastWork];
    updated[index] = { ...updated[index], [field]: value };
    setPastWork(updated);
  };

  const updateEdu = (index, field, value) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  if (isLoading && !profile) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <ProfileFormSkeleton />
          <ProfileFormSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  const visibleWork = (profile?.pastWork || []).filter((w) => w.company || w.position || w.years);
  const visibleEdu = (profile?.education || []).filter((e) => e.school || e.degree || e.fieldOfStudy);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header} id="profile-edit" ref={editRef}>
          <Avatar user={profile?.userId} size={96} />
          <div className={styles.headerInfo}>
            <h1>{profile?.userId?.name}</h1>
            <p>@{profile?.userId?.username}</p>
            {profile?.currentPost && <p className={styles.headline}>{profile.currentPost}</p>}
          </div>
          <div className={styles.headerActions}>
            <label className={styles.uploadBtn}>
              Change Photo
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={() => dispatch(downloadResume(profile?.userId?._id))}
            >
              Download Resume (PDF)
            </button>
          </div>
        </div>

        {saved && <p className={styles.success}>{message}</p>}

        {!isEditing ? (
          <>
            <section className={styles.section}>
              <h2>About</h2>
              <p className={styles.displayText}>{profile?.bio || "No bio added yet."}</p>
              {profile?.userId?.email && (
                <p className={styles.displayMeta}>{profile.userId.email}</p>
              )}
            </section>

            <section className={styles.section}>
              <h2>Work Experience</h2>
              {visibleWork.length === 0 ? (
                <p className={styles.displayText}>No work experience added yet.</p>
              ) : (
                visibleWork.map((work, i) => (
                  <div key={i} className={styles.displayEntry}>
                    <p className={styles.displayEntryTitle}>{work.position || "Position"}</p>
                    <p className={styles.displayMeta}>
                      {[work.company, work.years].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))
              )}
            </section>

            <section className={styles.section}>
              <h2>Education</h2>
              {visibleEdu.length === 0 ? (
                <p className={styles.displayText}>No education added yet.</p>
              ) : (
                visibleEdu.map((edu, i) => (
                  <div key={i} className={styles.displayEntry}>
                    <p className={styles.displayEntryTitle}>{edu.school || "School"}</p>
                    <p className={styles.displayMeta}>
                      {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))
              )}
            </section>
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

            <section className={styles.section}>
              <h2>Education</h2>
              {education.map((edu, i) => (
                <div key={i} className={styles.entryRow}>
                  <input placeholder="School" value={edu.school} onChange={(e) => updateEdu(i, "school", e.target.value)} />
                  <input placeholder="Degree" value={edu.degree} onChange={(e) => updateEdu(i, "degree", e.target.value)} />
                  <input placeholder="Years / Field" value={edu.fieldOfStudy} onChange={(e) => updateEdu(i, "fieldOfStudy", e.target.value)} />
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
              <button
                type="button"
                className={styles.createPostBtn}
                onClick={() => setShowComposer(true)}
              >
                Create a post
              </button>
              <button
                type="button"
                className={styles.editBtn}
                onClick={openEditor}
                aria-label="Edit profile"
              >
                ✎
              </button>
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

          {tabHasItems && (
            <button
              type="button"
              className={styles.showAll}
              onClick={() => router.push("/profile/activity")}
            >
              Show all →
            </button>
          )}
        </section>

        <CreatePost
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
          user={profile?.userId}
        />
      </div>
    </DashboardLayout>
  );
}
