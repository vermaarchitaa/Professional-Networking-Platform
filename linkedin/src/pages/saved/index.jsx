import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import PostCard from "@/Components/PostCard";
import { PostSkeleton } from "@/Components/Skeleton";
import { fetchUserProfile } from "@/config/redux/action/profileAction";
import { fetchSavedPosts } from "@/config/redux/action/postAction";
import useAuthGuard from "@/hooks/useAuth";
import styles from "./style.module.css";

export default function SavedPostsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { savedPosts, savedPostsLoading, savedPostsError } = useSelector((state) => state.posts);

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchSavedPosts());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <section className={styles.navCard}>
            <h2>My items</h2>
            <button type="button" className={styles.navItemActive} aria-current="page">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M7 4h10a1 1 0 0 1 1 1v16l-6-3.5L6 21V5a1 1 0 0 1 1-1Z" />
              </svg>
              Saved posts
            </button>
          </section>
        </aside>

        <section className={styles.main}>
          <header className={styles.header}>
            <h1>Saved Posts</h1>
            <p>Posts you save are stored here so you can come back to them later.</p>
          </header>

          {savedPostsLoading ? (
            <div className={styles.feed}>
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : savedPostsError ? (
            <div className={styles.errorCard} role="alert">
              <h2>Couldn't load saved posts</h2>
              <p>{savedPostsError}</p>
              <button type="button" className={styles.retryBtn} onClick={() => dispatch(fetchSavedPosts())}>
                Try again
              </button>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyArt} aria-hidden="true">
                <svg viewBox="0 0 160 120" width="160" height="120">
                  <rect x="18" y="22" width="124" height="76" rx="12" fill="#e8f1fb" />
                  <rect x="34" y="38" width="64" height="8" rx="4" fill="#c9d9ee" />
                  <rect x="34" y="52" width="92" height="6" rx="3" fill="#d7e4f5" />
                  <rect x="34" y="64" width="78" height="6" rx="3" fill="#d7e4f5" />
                  <path d="M118 18h16a4 4 0 0 1 4 4v42l-12-7-12 7V22a4 4 0 0 1 4-4Z" fill="#0a66c2" />
                </svg>
              </div>
              <h2>Start saving posts</h2>
              <p>Saved posts will show up here so you can revisit the ones that matter to you.</p>
              <button type="button" className={styles.feedBtn} onClick={() => router.push("/dashboard")}>
                Go to Feed
              </button>
            </div>
          ) : (
            <div className={styles.feed}>
              {savedPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
