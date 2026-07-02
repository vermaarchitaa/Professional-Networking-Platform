import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserLayout from "@/layout/UserLayout";
import Avatar from "@/Components/Avatar";
import { PostSkeleton } from "@/Components/Skeleton";
import { blogArticles } from "@/config/blogArticles";
import { fetchTrendingPosts } from "@/config/redux/action/postAction";
import { getMediaUrl } from "@/config/utils";
import styles from "./style.module.css";

export default function BlogPage() {
  const dispatch = useDispatch();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      setLoadingTrending(true);
      const result = await dispatch(fetchTrendingPosts());
      if (fetchTrendingPosts.fulfilled.match(result)) {
        setTrendingPosts(result.payload);
      }
      setLoadingTrending(false);
    };
    loadTrending();
  }, [dispatch]);

  return (
    <UserLayout>
      <div className={styles.container}>
        <header className={styles.hero}>
          <h1>Pro Connect Blog</h1>
          <p>Insights on networking, careers, and building authentic professional relationships.</p>
        </header>

        <div className={styles.layout}>
          <section className={styles.articles}>
            <h2>Latest Articles</h2>
            <div className={styles.articleGrid}>
              {blogArticles.map((article) => (
                <article
                  key={article.id}
                  className={`${styles.articleCard} ${selectedArticle?.id === article.id ? styles.active : ""}`}
                  onClick={() => setSelectedArticle(article)}
                >
                  <span className={styles.category}>{article.category}</span>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <div className={styles.meta}>
                    <span>{article.author}</span>
                    <span>{article.readTime}</span>
                  </div>
                </article>
              ))}
            </div>

            {selectedArticle && (
              <div className={styles.articleDetail}>
                <button className={styles.backBtn} onClick={() => setSelectedArticle(null)}>
                  ← Back to articles
                </button>
                <span className={styles.category}>{selectedArticle.category}</span>
                <h2>{selectedArticle.title}</h2>
                <p className={styles.detailMeta}>
                  {selectedArticle.author} · {selectedArticle.date} · {selectedArticle.readTime}
                </p>
                <p className={styles.detailContent}>{selectedArticle.content}</p>
              </div>
            )}
          </section>

          <aside className={styles.sidebar}>
            <h2>Trending from the Community</h2>
            {loadingTrending ? (
              <PostSkeleton />
            ) : trendingPosts.length === 0 ? (
              <p className={styles.emptyTrending}>No trending posts yet. Start posting on the feed!</p>
            ) : (
              trendingPosts.map((post) => (
                <div key={post._id} className={styles.trendingCard}>
                  <div className={styles.trendingHeader}>
                    <Avatar user={post.userId} size={36} />
                    <div>
                      <p className={styles.trendingAuthor}>{post.userId?.name}</p>
                      <p className={styles.trendingLikes}>❤️ {post.likes} likes</p>
                    </div>
                  </div>
                  <p className={styles.trendingBody}>{post.body.slice(0, 120)}{post.body.length > 120 ? "..." : ""}</p>
                  {post.media && (
                    <img src={getMediaUrl(post.media)} alt="" className={styles.trendingMedia} />
                  )}
                </div>
              ))
            )}
          </aside>
        </div>
      </div>
    </UserLayout>
  );
}
