import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@/Components/Avatar";
import ReactionButton from "@/Components/ReactionButton";
import GifPicker from "@/Components/GifPicker";
import PostOwnerMenu from "@/Components/PostOwnerMenu";
import {
  toggleLike,
  toggleCommentLike,
  fetchComments,
  addComment,
  deleteComment,
} from "@/config/redux/action/postAction";
import { validateComment } from "@/config/validation";
import { COMMENT_EMOJIS } from "@/config/reactions";
import { getMediaUrl, formatDate, getPostMediaItems, isVideoMedia } from "@/config/utils";
import styles from "./styles.module.css";

const CARD_MAIN = "card-main";
const VIEWER_MAIN = "viewer-main";
const replyComposerId = (id) => `reply-${id}`;

const renderMedia = (item, className, extraProps = {}) => {
  if (!item) return null;
  const src = getMediaUrl(item.filename);
  if (isVideoMedia(item)) {
    return <video src={src} className={className} {...extraProps} />;
  }
  return <img src={src} alt="Post media" className={className} {...extraProps} />;
};

const revokeAttachment = (attachment) => {
  if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
};

export default function PostCard({ post, autoOpenViewer = false, hideCard = false, onViewerClose }) {
  const dispatch = useDispatch();
  const { comments } = useSelector((state) => state.posts);
  const { profile } = useSelector((state) => state.profile);
  const imageInputRef = useRef(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [openEmojiId, setOpenEmojiId] = useState(null);
  const [openGifId, setOpenGifId] = useState(null);
  const [imageTarget, setImageTarget] = useState(null);
  const [mainAttachment, setMainAttachment] = useState(null);
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [replyToId, setReplyToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const [viewerIndex, setViewerIndex] = useState(null);

  const postComments = comments[post._id] || [];
  const topLevelComments = postComments.filter((comment) => !comment.parentCommentId);
  const repliesFor = (commentId) =>
    postComments.filter((comment) => String(comment.parentCommentId) === String(commentId));
  const currentUserId = profile?.userId?._id;
  const isOwner = currentUserId && post.userId?._id === currentUserId;
  const canComment = post.canComment !== false;
  const commentBlockedMessage = (post.commentPermission || "anyone") === "off"
    ? "Comments are turned off"
    : "Only connections can comment on this post";
  const mediaItems = getPostMediaItems(post);
  const firstMedia = mediaItems[0];
  const viewerOpen = viewerIndex !== null;
  const viewerItem = viewerOpen ? mediaItems[viewerIndex] : null;

  const openViewer = () => {
    if (mediaItems.length === 0) return;
    setViewerIndex(0);
    setOpenEmojiId(null);
    setOpenGifId(null);
    dispatch(fetchComments(post._id));
  };

  const closeViewer = () => {
    setViewerIndex(null);
    setOpenEmojiId(null);
    setOpenGifId(null);
    onViewerClose?.();
  };

  const goPrev = () => {
    setViewerIndex((index) => (index - 1 + mediaItems.length) % mediaItems.length);
  };

  const goNext = () => {
    setViewerIndex((index) => (index + 1) % mediaItems.length);
  };

  useEffect(() => {
    if (!viewerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeViewer();
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewerOpen, mediaItems.length]);

  useEffect(() => {
    if (!autoOpenViewer) return;
    if (mediaItems.length === 0) return;
    setViewerIndex(0);
    setOpenEmojiId(null);
    setOpenGifId(null);
    dispatch(fetchComments(post._id));
  }, [autoOpenViewer, post._id]);

  useEffect(() => () => {
    revokeAttachment(mainAttachment);
    revokeAttachment(replyAttachment);
  }, []);

  const isMainComposer = (composerId) => composerId === CARD_MAIN || composerId === VIEWER_MAIN;

  const getAttachment = (composerId) => (isMainComposer(composerId) ? mainAttachment : replyAttachment);

  const setAttachment = (composerId, next) => {
    const current = getAttachment(composerId);
    if (current?.previewUrl && current.previewUrl !== next?.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
    }
    if (isMainComposer(composerId)) setMainAttachment(next);
    else setReplyAttachment(next);
  };

  const handleToggleComments = () => {
    if (!showComments) dispatch(fetchComments(post._id));
    setShowComments(!showComments);
    setOpenEmojiId(null);
    setOpenGifId(null);
  };

  const submitComment = async (text, parentCommentId, attachment, onSuccess, setError) => {
    const hasAttachment = Boolean(attachment);
    if (!text.trim() && !hasAttachment) {
      setError("Comment cannot be empty");
      return;
    }
    if (text.trim()) {
      const error = validateComment(text);
      if (error) {
        setError(error);
        return;
      }
    }
    setError("");
    const result = await dispatch(addComment({
      postId: post._id,
      commentBody: text.trim(),
      parentCommentId,
      mediaFile: attachment?.kind === "image" ? attachment.file : undefined,
      gifUrl: attachment?.kind === "gif" ? attachment.gifUrl : undefined,
    }));
    if (addComment.fulfilled.match(result)) {
      onSuccess();
      return;
    }
    setError(result.payload?.message || "Failed to add comment");
  };

  const handleAddComment = () => {
    submitComment(commentText, null, mainAttachment, () => {
      setCommentText("");
      setAttachment(CARD_MAIN, null);
    }, setCommentError);
  };

  const handleAddReply = (parentCommentId) => {
    submitComment(replyText, parentCommentId, replyAttachment, () => {
      setReplyText("");
      setReplyToId(null);
      setAttachment(replyComposerId(parentCommentId), null);
      setOpenEmojiId(null);
      setOpenGifId(null);
    }, setReplyError);
  };

  const renderComposer = (composerId, value, setValue, onSubmit, error, placeholder) => {
    const attachment = getAttachment(composerId);
    return (
      <div>
        <div className={styles.commentInput}>
          <Avatar user={profile?.userId} size={28} />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setCommentError("");
              if (error) setReplyError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          />
          <div className={styles.composerActions}>
            <div className={styles.emojiWrap}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => {
                  setOpenEmojiId((current) => (current === composerId ? null : composerId));
                  setOpenGifId(null);
                }}
                aria-label="Emoji"
              >
                😊
              </button>
              {openEmojiId === composerId && (
                <div className={styles.emojiPopover}>
                  {COMMENT_EMOJIS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      className={styles.emojiBtn}
                      onClick={() => {
                        setValue((current) => current + emoji);
                        setOpenEmojiId(null);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.emojiWrap}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => {
                  setOpenGifId((current) => (current === composerId ? null : composerId));
                  setOpenEmojiId(null);
                }}
                aria-label="GIF"
              >
                GIF
              </button>
              {openGifId === composerId && (
                <GifPicker
                  onSelect={(url) => {
                    setAttachment(composerId, { kind: "gif", gifUrl: url });
                    setOpenGifId(null);
                  }}
                  onClose={() => setOpenGifId(null)}
                />
              )}
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                setImageTarget(composerId);
                setOpenEmojiId(null);
                setOpenGifId(null);
                imageInputRef.current?.click();
              }}
              aria-label="Comment media"
            >
              🖼️
            </button>
          </div>
          <button onClick={onSubmit} disabled={!value.trim() && !attachment}>
            Post
          </button>
        </div>
        {attachment && (
          <div className={styles.attachmentPreview}>
            <img
              src={attachment.kind === "image" ? attachment.previewUrl : attachment.gifUrl}
              alt=""
            />
            <button type="button" onClick={() => setAttachment(composerId, null)}>
              Remove
            </button>
          </div>
        )}
        {error && <p className={styles.fieldError}>{error}</p>}
      </div>
    );
  };

  const renderCommentMedia = (comment) => (
    <>
      {comment.body ? <p>{comment.body}</p> : null}
      {comment.media?.filename ? (
        <img
          src={getMediaUrl(comment.media.filename)}
          alt=""
          className={styles.commentMedia}
        />
      ) : null}
      {comment.gifUrl ? (
        <img src={comment.gifUrl} alt="" className={styles.commentMedia} />
      ) : null}
    </>
  );

  const renderComment = (comment, isReply = false) => (
    <div key={comment._id} className={isReply ? styles.reply : styles.comment}>
      <Avatar user={comment.userId} size={isReply ? 26 : 32} />
      <div className={styles.commentMain}>
        <div className={styles.commentBody}>
          <p className={styles.commentAuthor}>{comment.userId?.name}</p>
          {renderCommentMedia(comment)}
        </div>
        <div className={styles.commentActions}>
          <ReactionButton
            compact
            myReaction={comment.myReaction}
            count={comment.likes || 0}
            onSelect={(reactionType) => dispatch(toggleCommentLike({ commentId: comment._id, reactionType }))}
          />
          {canComment && (
            <button
              type="button"
              className={styles.commentAction}
              onClick={() => {
                setReplyToId(comment._id);
                setReplyText("");
                setReplyError("");
                setOpenEmojiId(null);
                setOpenGifId(null);
                setAttachment(replyComposerId(comment._id), null);
              }}
            >
              Reply
            </button>
          )}
          {comment.userId?._id === currentUserId && (
            <button
              className={styles.commentDelete}
              onClick={() => dispatch(deleteComment({ commentId: comment._id, postId: post._id }))}
            >
              ✕
            </button>
          )}
        </div>
        {canComment && replyToId === comment._id && (
          <div className={styles.replyBox}>
            {renderComposer(
              replyComposerId(comment._id),
              replyText,
              setReplyText,
              () => handleAddReply(comment._id),
              replyError,
              "Write a reply..."
            )}
          </div>
        )}
        {!isReply && repliesFor(comment._id).map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  const commentList = topLevelComments.length === 0 ? (
    <p className={styles.noComments}>No comments yet</p>
  ) : (
    topLevelComments.map((comment) => renderComment(comment))
  );

  return (
    <div className={hideCard ? undefined : styles.card}>
      <input
        ref={imageInputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !imageTarget) return;
          setAttachment(imageTarget, {
            kind: "image",
            file,
            previewUrl: URL.createObjectURL(file),
          });
          setImageTarget(null);
        }}
      />

      {!hideCard && (
        <>
      <div className={styles.header}>
        <Avatar user={post.userId} size={44} />
        <div className={styles.headerInfo}>
          <p className={styles.authorName}>{post.userId?.name || "Unknown"}</p>
          <p className={styles.meta}>
            @{post.userId?.username} · {formatDate(post.createdAt)}
          </p>
        </div>
        {!viewerOpen && <PostOwnerMenu post={post} />}
      </div>

      <p className={styles.body}>{post.body}</p>

      {firstMedia && (
        <div
          className={styles.media}
          onClick={openViewer}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openViewer();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="View media"
        >
          {renderMedia(firstMedia, styles.mediaFile, isVideoMedia(firstMedia) ? { muted: true } : {})}
          {mediaItems.length > 1 && (
            <span className={styles.mediaCount}>1/{mediaItems.length}</span>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <ReactionButton
          myReaction={post.myReaction}
          count={post.likes || 0}
          onSelect={(reactionType) => dispatch(toggleLike({ postId: post._id, reactionType }))}
        />
        <button className={styles.actionBtn} onClick={handleToggleComments}>
          💬 {showComments ? "Hide" : "Comment"}
        </button>
      </div>

      {showComments && !viewerOpen && (
        <div className={styles.commentSection}>
          {canComment
            ? renderComposer(CARD_MAIN, commentText, setCommentText, handleAddComment, commentError, "Add a comment...")
            : <p className={styles.noComments}>{commentBlockedMessage}</p>}
          {commentList}
        </div>
      )}
        </>
      )}

      {viewerOpen && viewerItem && (
        <div className={styles.viewerOverlay} onClick={closeViewer} role="presentation">
          <div
            className={styles.viewer}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Post details"
          >
            <div className={styles.viewerMediaPane}>
              <button
                type="button"
                className={styles.viewerClose}
                onClick={closeViewer}
                aria-label="Close viewer"
              >
                ✕
              </button>
              {mediaItems.length > 1 && (
                <button
                  type="button"
                  className={styles.viewerPrev}
                  onClick={goPrev}
                  aria-label="Previous media"
                >
                  ←
                </button>
              )}
              {renderMedia(
                viewerItem,
                styles.viewerMedia,
                isVideoMedia(viewerItem) ? { controls: true } : {}
              )}
              {mediaItems.length > 1 && (
                <button
                  type="button"
                  className={styles.viewerNext}
                  onClick={goNext}
                  aria-label="Next media"
                >
                  →
                </button>
              )}
              {mediaItems.length > 1 && (
                <p className={styles.viewerCounter}>
                  {viewerIndex + 1} / {mediaItems.length}
                </p>
              )}
            </div>

            <aside className={styles.viewerDetails}>
              <div className={styles.viewerDetailsScroll}>
                <div className={styles.header}>
                  <Avatar user={post.userId} size={44} />
                  <div className={styles.headerInfo}>
                    <p className={styles.authorName}>{post.userId?.name || "Unknown"}</p>
                    <p className={styles.meta}>
                      {post.userId?.username ? `@${post.userId.username}` : ""}
                      {post.userId?.username && post.createdAt ? " · " : ""}
                      {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <PostOwnerMenu post={post} />
                </div>
                {post.body && <p className={styles.viewerPostBody}>{post.body}</p>}

                <div className={styles.viewerActions}>
                  <ReactionButton
                    myReaction={post.myReaction}
                    count={post.likes || 0}
                    onSelect={(reactionType) => dispatch(toggleLike({ postId: post._id, reactionType }))}
                  />
                  <span className={styles.actionBtn}>💬 {postComments.length}</span>
                </div>

                <div className={styles.viewerComments}>{commentList}</div>
              </div>

              <div className={styles.viewerComposer}>
                {canComment
                  ? renderComposer(VIEWER_MAIN, commentText, setCommentText, handleAddComment, commentError, "Add a comment...")
                  : <p className={styles.noComments}>{commentBlockedMessage}</p>}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
