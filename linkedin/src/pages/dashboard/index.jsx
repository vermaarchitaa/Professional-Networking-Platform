import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import CreatePost from "@/Components/CreatePost";
import PostCard from "@/Components/PostCard";
import ProfileSidebar from "@/Components/ProfileSidebar";
import { PostSkeleton, ProfileSidebarSkeleton } from "@/Components/Skeleton";
import { fetchPosts } from "@/config/redux/action/postAction";
import { fetchUserProfile } from "@/config/redux/action/profileAction";
import useAuthGuard from "@/hooks/useAuth";
import styles from "./style.module.css";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { posts, isLoading } = useSelector((state) => state.posts);
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile);

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    <DashboardLayout>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {profileLoading && !profile ? <ProfileSidebarSkeleton /> : <ProfileSidebar />}
        </aside>

        <section className={styles.feed}>
          <CreatePost />
          {isLoading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div className={styles.empty}>
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            [...posts]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((post) => <PostCard key={post._id} post={post} />)
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
