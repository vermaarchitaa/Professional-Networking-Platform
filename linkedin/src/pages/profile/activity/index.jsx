import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import Avatar from "@/Components/Avatar";
import PostCard from "@/Components/PostCard";
import { PostSkeleton } from "@/Components/Skeleton";
import { fetchUserProfile } from "@/config/redux/action/profileAction";
import { fetchPosts } from "@/config/redux/action/postAction";
import useAuthGuard from "@/hooks/useAuth";
import { getMediaUrl, formatDate, getPostMediaItems, isImageMedia } from "@/config/utils";
import styles from "./style.module.css";

export default function ProfileActivityPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile);
  const { posts, isLoading: postsLoading } = useSelector((state) => state.posts);
  const [activityTab, setActivityTab] = useState("posts");
  const [previewTile, setPreviewTile] = useState(null);

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchPosts());
  }, [dispatch]);

  useEffect(() => {
    if (!previewTile) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setPreviewTile(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewTile]);

  const myId = profile?.userId?._id;
  const myPosts = [...posts]
    .filter((p) => p.userId?._id === myId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const imageTiles = myPosts.flatMap((post) =>
    getPostMediaItems(post)
      .filter(isImageMedia)
      .map((item) => ({ post, item }))
  );
  const tabEmpty = activityTab === "images" ? imageTiles.length === 0 : myPosts.length === 0;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={() => router.push("/profile")}>
          ← Back to profile
        </button>

        <header className={styles.summary}>
          <Avatar user={profile?.userId} size={64} />
          <div>
            <h1>All activity</h1>
            <p>
              {profile?.userId?.name}
              {profile?.userId?.username ? ` · @${profile.userId.username}` : ""}
            </p>
          </div>
        </header>

        <section className={styles.card}>
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

          {profileLoading || postsLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : tabEmpty ? (
            <div className={styles.empty}>
              <p>
                {activityTab === "images"
                  ? "No images yet. Share a post with a photo."
                  : "No activity yet. Share a post from your profile."}
              </p>
            </div>
          ) : activityTab === "images" ? (
            <div className={styles.imageGrid}>
              {imageTiles.map(({ post, item }) => (
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
            myPosts.map((post) => <PostCard key={post._id} post={post} />)
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
        </section>
      </div>
    </DashboardLayout>
  );
}
