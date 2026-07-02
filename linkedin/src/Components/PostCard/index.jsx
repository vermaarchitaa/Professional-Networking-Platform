import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@/Components/Avatar";
import {
  toggleLike,
  deletePost,
  fetchComments,
  addComment,
  deleteComment,
} from "@/config/redux/action/postAction";
import { validateComment } from "@/config/validation";
import { getMediaUrl, formatDate } from "@/config/utils";
import styles from "./styles.module.css";

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { comments } = useSelector((state) => state.posts);
  const { profile } = useSelector((state) => state.profile);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");

  const postComments = comments[post._id] || [];
  const currentUserId = profile?.userId?._id;
  const isOwner = currentUserId && post.userId?._id === currentUserId;

  const handleToggleComments = () => {
    if (!showComments) dispatch(fetchComments(post._id));
    setShowComments(!showComments);
  };

  const handleAddComment = () => {
    const error = validateComment(commentText);
    if (error) {
      setCommentError(error);
      return;
    }
    setCommentError("");
    dispatch(addComment({ postId: post._id, commentBody: commentText.trim() }));
    setCommentText("");
  };

  const handleDelete = () => {
    if (window.confirm("Delete this post?")) {
      dispatch(deletePost(post._id));
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Avatar user={post.userId} size={44} />
        <div className={styles.headerInfo}>
          <p className={styles.authorName}>{post.userId?.name || "Unknown"}</p>
          <p className={styles.meta}>
            @{post.userId?.username} · {formatDate(post.createdAt)}
          </p>
        </div>
        {isOwner && (
          <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Delete post">
            ✕
          </button>
        )}
      </div>

      <p className={styles.body}>{post.body}</p>

      {post.media && (
        <div className={styles.media}>
          {post.fileType === "mp4" || post.fileType === "webm" ? (
            <video src={getMediaUrl(post.media)} controls className={styles.mediaFile} />
          ) : (
            <img src={getMediaUrl(post.media)} alt="Post media" className={styles.mediaFile} />
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${post.isLiked ? styles.liked : ""}`}
          onClick={() => dispatch(toggleLike(post._id))}
        >
          {post.isLiked ? "❤️" : "👍"} {post.likes || 0}
        </button>
        <button className={styles.actionBtn} onClick={handleToggleComments}>
          💬 {showComments ? "Hide" : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className={styles.commentSection}>
          <div className={styles.commentInput}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (commentError) setCommentError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <button onClick={handleAddComment} disabled={!commentText.trim()}>
              Post
            </button>
          </div>
          {commentError && <p className={styles.fieldError}>{commentError}</p>}
          {postComments.length === 0 ? (
            <p className={styles.noComments}>No comments yet</p>
          ) : (
            postComments.map((comment) => (
              <div key={comment._id} className={styles.comment}>
                <Avatar user={comment.userId} size={32} />
                <div className={styles.commentBody}>
                  <p className={styles.commentAuthor}>{comment.userId?.name}</p>
                  <p>{comment.body}</p>
                </div>
                {comment.userId?._id === currentUserId && (
                  <button
                    className={styles.commentDelete}
                    onClick={() =>
                      dispatch(deleteComment({ commentId: comment._id, postId: post._id }))
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
