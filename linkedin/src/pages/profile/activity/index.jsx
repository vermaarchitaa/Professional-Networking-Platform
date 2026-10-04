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
import { getMediaUrl, getPostMediaItems, isImageMedia, sortActivityPosts } from "@/config/utils";
import { useI18n } from "@/i18n";
import styles from "./style.module.css";

export default function ProfileActivityPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile);
  const { posts, isLoading: postsLoading } = useSelector((state) => state.posts);
  const [activityTab, setActivityTab] = useState("posts");
  const [viewerPostId, setViewerPostId] = useState(null);
  const { t } = useI18n();

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchPosts());
  }, [dispatch]);

  const myId = profile?.userId?._id;
  const myPosts = sortActivityPosts(posts.filter((p) => p.userId?._id === myId));
  const imagePosts = myPosts.filter((post) => getPostMediaItems(post).some(isImageMedia));
  const viewerPost = posts.find((post) => post._id === viewerPostId);
  const tabEmpty = activityTab === "images" ? imagePosts.length === 0 : myPosts.length === 0;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={() => router.push("/profile")}>
          {t("backToProfile")}
        </button>

        <header className={styles.summary}>
          <Avatar user={profile?.userId} size={64} />
          <div>
            <h1>{t("allActivity")}</h1>
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
                setViewerPostId(null);
              }}
            >
              {t("posts")}
            </button>
            <button
              type="button"
              className={activityTab === "images" ? styles.tabActive : styles.tab}
              onClick={() => setActivityTab("images")}
            >
              {t("images")}
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
                  ? t("noImages")
                  : t("noActivity")}
              </p>
            </div>
          ) : activityTab === "images" ? (
            <div className={styles.imageGrid}>
              {imagePosts.map((post) => {
                const imageItems = getPostMediaItems(post).filter(isImageMedia);
                const extraCount = imageItems.length - 1;
                return (
                  <button
                    type="button"
                    key={post._id}
                    className={styles.imageTile}
                    onClick={() => setViewerPostId(post._id)}
                    aria-label={t("viewPost")}
                  >
                    <img src={getMediaUrl(imageItems[0].filename)} alt="" />
                    {extraCount > 0 && (
                      <span className={styles.imageCount}>+{extraCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            myPosts.map((post) => <PostCard key={post._id} post={post} />)
          )}

          {viewerPost && (
            <PostCard
              post={viewerPost}
              autoOpenViewer
              hideCard
              onViewerClose={() => setViewerPostId(null)}
            />
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
