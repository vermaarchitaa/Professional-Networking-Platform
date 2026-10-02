import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { deletePost, savePost, unsavePost, updatePost } from "@/config/redux/action/postAction";
import { COMMENT_EMOJIS } from "@/config/reactions";
import { validatePostBody } from "@/config/validation";
import styles from "./styles.module.css";

const MENU_EVENT = "postcard-menu-open";
const COMMENT_OPTIONS = [
  { value: "anyone", label: "Anyone" },
  { value: "connections", label: "Connections only" },
  { value: "off", label: "Off" },
];

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const EditIcon = () => (
  <Icon>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m13.5 6.5 3 3" />
  </Icon>
);

const DeleteIcon = () => (
  <Icon>
    <path d="M5 7h14M10 7V5h4v2M8 7v12h8V7" />
  </Icon>
);

const CommentIcon = () => (
  <Icon>
    <path d="M5 16.5 3 20l4.2-1.5A8.5 8.5 0 1 0 5 16.5Z" />
  </Icon>
);

const FeatureIcon = () => (
  <Icon>
    <path d="m12 3 2.4 6.6H21l-5.4 4 2.1 6.4L12 16.8 6.3 20l2.1-6.4L3 9.6h6.6Z" />
  </Icon>
);

const BookmarkIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 4h10a1 1 0 0 1 1 1v16l-6-3.5L6 21V5a1 1 0 0 1 1-1Z" />
  </svg>
);

export default function PostOwnerMenu({ post }) {
  const dispatch = useDispatch();
  const { savedPostIds } = useSelector((state) => state.posts);
  const { profile } = useSelector((state) => state.profile);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const editAreaRef = useRef(null);
  const emojiWrapRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 16 });
  const [panel, setPanel] = useState(null);
  const [editBody, setEditBody] = useState(post.body || "");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const commentPermission = post.commentPermission || "anyone";
  const featured = post.featured === true;
  const currentUserId = profile?.userId?._id;
  const isOwner = currentUserId && post.userId?._id === currentUserId;
  const isSaved = post.isSaved === true || (savedPostIds || []).some((id) => String(id) === String(post._id));

  const closeMenu = () => setMenuOpen(false);

  const closeAll = () => {
    setMenuOpen(false);
    setPanel(null);
    setShowEmoji(false);
    setEditError("");
    setIsSaving(false);
  };

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({
        top: rect.bottom + 6,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    window.dispatchEvent(new CustomEvent(MENU_EVENT, { detail: post._id }));
    setMenuOpen(true);
  };

  const openPanel = (next) => {
    closeMenu();
    setShowEmoji(false);
    if (next === "edit") {
      setEditBody(post.body || "");
      setEditError("");
    }
    setPanel(next);
  };

  const insertEditEmoji = (emoji) => {
    const el = editAreaRef.current;
    if (!el) {
      setEditBody((current) => current + emoji);
      setShowEmoji(false);
      return;
    }
    const start = Number.isInteger(el.selectionStart) ? el.selectionStart : editBody.length;
    const end = Number.isInteger(el.selectionEnd) ? el.selectionEnd : start;
    const next = editBody.slice(0, start) + emoji + editBody.slice(end);
    setEditBody(next);
    setShowEmoji(false);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  };

  useEffect(() => {
    const onOpen = (event) => {
      if (event.detail !== post._id) setMenuOpen(false);
    };
    window.addEventListener(MENU_EVENT, onOpen);
    return () => window.removeEventListener(MENU_EVENT, onOpen);
  }, [post._id]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (buttonRef.current?.contains(event.target)) return;
      if (wrapRef.current?.contains(event.target)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!showEmoji) return undefined;
    const onPointerDown = (event) => {
      if (emojiWrapRef.current?.contains(event.target)) return;
      setShowEmoji(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [showEmoji]);

  useEffect(() => {
    if (!menuOpen && !panel && !showEmoji) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      if (showEmoji) {
        setShowEmoji(false);
        return;
      }
      if (panel) {
        setPanel(null);
        return;
      }
      closeMenu();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [menuOpen, panel, showEmoji]);

  const handleSaveEdit = async () => {
    const error = validatePostBody(editBody);
    if (error) {
      setEditError(error);
      return;
    }
    setIsSaving(true);
    const result = await dispatch(updatePost({ postId: post._id, body: editBody.trim() }));
    setIsSaving(false);
    if (updatePost.fulfilled.match(result)) {
      closeAll();
      return;
    }
    setEditError(result.payload?.message || "Failed to update post");
  };

  const handleDelete = async () => {
    setIsSaving(true);
    const result = await dispatch(deletePost(post._id));
    setIsSaving(false);
    if (deletePost.fulfilled.match(result)) closeAll();
  };

  const handleCommentPermission = async (value) => {
    if (value === commentPermission) {
      closeAll();
      return;
    }
    setIsSaving(true);
    const result = await dispatch(updatePost({ postId: post._id, commentPermission: value }));
    setIsSaving(false);
    if (updatePost.fulfilled.match(result)) closeAll();
  };

  const handleFeature = async () => {
    closeMenu();
    await dispatch(updatePost({ postId: post._id, featured: !featured }));
  };

  const handleToggleSave = async () => {
    closeMenu();
    if (isSaved) {
      await dispatch(unsavePost(post._id));
    } else {
      await dispatch(savePost(post._id));
    }
  };

  const preventMenuFocusScroll = (event) => {
    event.preventDefault();
  };

  const menu = menuOpen && typeof document !== "undefined"
    ? createPortal(
      <div
        ref={wrapRef}
        className={styles.menu}
        style={{ top: menuPos.top, right: menuPos.right }}
        role="menu"
      >
        <button type="button" className={styles.menuItem} onMouseDown={preventMenuFocusScroll} onClick={handleToggleSave}>
          <BookmarkIcon filled={isSaved} />
          {isSaved ? "Unsave post" : "Save post"}
        </button>
        {isOwner && (
          <>
            <button type="button" className={styles.menuItem} onMouseDown={preventMenuFocusScroll} onClick={() => openPanel("edit")}>
              <EditIcon />
              Edit post
            </button>
            <button type="button" className={styles.menuItem} onMouseDown={preventMenuFocusScroll} onClick={() => openPanel("delete")}>
              <DeleteIcon />
              Delete post
            </button>
            <button type="button" className={styles.menuItem} onMouseDown={preventMenuFocusScroll} onClick={() => openPanel("comments")}>
              <CommentIcon />
              Who can comment on this post?
            </button>
            <button type="button" className={styles.menuItem} onMouseDown={preventMenuFocusScroll} onClick={handleFeature}>
              <FeatureIcon />
              {featured ? "Remove from featured" : "Feature on top of my profile"}
            </button>
          </>
        )}
      </div>,
      document.body
    )
    : null;

  const overlay = panel && typeof document !== "undefined"
    ? createPortal(
      <div className={styles.overlay} onClick={closeAll} role="presentation">
        <div
          className={styles.dialog}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {panel === "edit" && (
            <>
              <h3>Edit post</h3>
              <textarea
                ref={editAreaRef}
                className={styles.editArea}
                value={editBody}
                onChange={(event) => {
                  setEditBody(event.target.value);
                  if (editError) setEditError("");
                }}
                maxLength={5000}
              />
              {editError && <p className={styles.error}>{editError}</p>}
              <div className={styles.editFooter}>
                <div className={styles.emojiWrap} ref={emojiWrapRef}>
                  <button
                    type="button"
                    className={styles.emojiTrigger}
                    aria-label="Emoji"
                    onClick={() => setShowEmoji((open) => !open)}
                  >
                    😊
                  </button>
                  {showEmoji && (
                    <div className={styles.emojiPopover}>
                      {COMMENT_EMOJIS.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          className={styles.emojiBtn}
                          onClick={() => insertEditEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.dialogActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={closeAll}>Cancel</button>
                  <button type="button" className={styles.primaryBtn} onClick={handleSaveEdit} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </>
          )}
          {panel === "delete" && (
            <>
              <h3>Delete post?</h3>
              <p className={styles.dialogCopy}>Are you sure you want to delete this post?</p>
              <div className={styles.dialogActions}>
                <button type="button" className={styles.secondaryBtn} onClick={closeAll}>Cancel</button>
                <button type="button" className={styles.dangerBtn} onClick={handleDelete} disabled={isSaving}>
                  {isSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </>
          )}
          {panel === "comments" && (
            <>
              <h3>Who can comment on this post?</h3>
              <div className={styles.optionList}>
                {COMMENT_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={styles.option}
                    onClick={() => handleCommentPermission(option.value)}
                    disabled={isSaving}
                  >
                    <span>{option.label}</span>
                    <span className={commentPermission === option.value ? styles.radioOn : styles.radioOff} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <div className={styles.triggerWrap}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.menuBtn}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Post actions"
        onClick={() => {
          if (menuOpen) closeMenu();
          else openMenu();
        }}
      >
        ⋯
      </button>
      {menu}
      {overlay}
    </div>
  );
}
