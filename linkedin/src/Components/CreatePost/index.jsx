import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Avatar from "@/Components/Avatar";
import MediaEditor from "@/Components/MediaEditor";
import { createPost, fetchPosts } from "@/config/redux/action/postAction";
import { validatePostBody } from "@/config/validation";
import styles from "./styles.module.css";

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
]);
const ALLOWED_EXTS = new Set(["jpeg", "jpg", "png", "gif", "webp", "mp4", "webm"]);
const VIDEO_EXTS = new Set(["mp4", "webm"]);
const EMOJIS = ["😀", "😁", "😂", "🥹", "😍", "🤩", "👍", "👏", "🙏", "🎉", "🔥", "💯", "💡", "📌", "🚀", "❤️"];

const isAllowedFile = (file) => {
  const ext = String(file.name || "").split(".").pop().toLowerCase();
  return ALLOWED_TYPES.has(file.type) || ALLOWED_EXTS.has(ext);
};

const getKind = (file) => {
  const ext = String(file.name || "").split(".").pop().toLowerCase();
  if (file.type.startsWith("video/") || VIDEO_EXTS.has(ext)) return "video";
  return "image";
};

const createMediaItem = (file) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  file,
  previewUrl: URL.createObjectURL(file),
  kind: getKind(file),
  alt: "",
});

export default function CreatePost({ isOpen, onClose, user }) {
  const dispatch = useDispatch();
  const textareaRef = useRef(null);
  const mediaItemsRef = useRef([]);
  const [body, setBody] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const revokeAll = (items) => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  };

  mediaItemsRef.current = mediaItems;

  const resetDraft = () => {
    setMediaItems((current) => {
      revokeAll(current);
      return [];
    });
    setBody("");
    setSelectedIndex(0);
    setShowEditor(false);
    setShowEmoji(false);
    setShowPlus(false);
    setError("");
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (showEditor) {
        setShowEditor(false);
        return;
      }
      resetDraft();
      onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, showEditor, onClose]);

  useEffect(() => () => {
    revokeAll(mediaItemsRef.current);
  }, []);

  if (!isOpen) return null;

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const remaining = MAX_FILES - mediaItems.length;
    if (remaining <= 0) {
      setError("You can attach up to 10 files.");
      return;
    }

    const next = [];
    incoming.forEach((file) => {
      if (next.length >= remaining) return;
      if (!isAllowedFile(file)) {
        setError("Only jpeg, jpg, png, gif, webp, mp4, and webm files are supported.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Each file must be 10MB or smaller.");
        return;
      }
      next.push(createMediaItem(file));
    });

    if (next.length === 0) return;
    setMediaItems((current) => [...current, ...next]);
    if (mediaItems.length === 0) setSelectedIndex(0);
    if (incoming.length > remaining) setError("You can attach up to 10 files.");
  };

  const removeSelected = () => {
    if (mediaItems.length === 0) return;
    const removed = mediaItems[selectedIndex];
    URL.revokeObjectURL(removed.previewUrl);
    const next = mediaItems.filter((_, index) => index !== selectedIndex);
    setMediaItems(next);
    if (next.length === 0) {
      setSelectedIndex(0);
      setShowEditor(false);
      return;
    }
    setSelectedIndex((index) => (index >= next.length ? next.length - 1 : index));
  };

  const insertText = (text) => {
    const el = textareaRef.current;
    if (!el) {
      setBody((current) => current + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = body.slice(0, start) + text + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  };

  const closeComposer = () => {
    resetDraft();
    onClose?.();
  };

  const handleSubmit = async () => {
    const hasText = Boolean(body.trim());
    const hasMedia = mediaItems.length > 0;
    if (!hasText && !hasMedia) {
      setError("Add text or media to post.");
      return;
    }
    if (hasText) {
      const validationError = validatePostBody(body);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError("");
    setIsSubmitting(true);
    const result = await dispatch(
      createPost({
        body: body.trim(),
        mediaFiles: mediaItems.map((item) => item.file),
      })
    );
    if (createPost.fulfilled.match(result)) {
      await dispatch(fetchPosts());
      closeComposer();
    } else {
      setError(result.payload?.message || "Failed to create post");
    }
    setIsSubmitting(false);
  };

  const canPost = Boolean(body.trim() || mediaItems.length) && !isSubmitting;

  return (
    <>
      <div className={styles.overlay} onClick={closeComposer} role="presentation">
        <div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Create a post"
        >
          <header className={styles.header}>
            <Avatar user={user} size={48} />
            <div className={styles.identity}>
              <p className={styles.name}>{user?.name || "You"}</p>
              <div className={styles.audience}>
                <span>Post to Anyone</span>
                <span>Comments: Anyone</span>
              </div>
            </div>
            <button type="button" className={styles.closeBtn} onClick={closeComposer} aria-label="Close">
              ✕
            </button>
          </header>

          <textarea
            ref={textareaRef}
            className={`${styles.textarea} ${error ? styles.inputError : ""}`}
            placeholder="Share your thoughts ..."
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError("");
            }}
            maxLength={5000}
          />
          {error && <p className={styles.fieldError}>{error}</p>}

          {mediaItems.length > 0 && (
            <div className={styles.compactGallery}>
              {mediaItems.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={styles.compactTile}
                  onClick={() => {
                    setSelectedIndex(index);
                    setShowEditor(true);
                  }}
                  aria-label="Edit media"
                >
                  {item.kind === "video" ? (
                    <video src={item.previewUrl} muted />
                  ) : (
                    <img src={item.previewUrl} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className={styles.toolbar}>
            <div className={styles.tools}>
              <div className={styles.toolWrap}>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => {
                    setShowEmoji((open) => !open);
                    setShowPlus(false);
                  }}
                  aria-label="Emoji"
                >
                  😊
                </button>
                {showEmoji && (
                  <div className={styles.popover}>
                    {EMOJIS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        className={styles.emojiBtn}
                        onClick={() => {
                          insertText(emoji);
                          setShowEmoji(false);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => {
                  setShowEmoji(false);
                  setShowPlus(false);
                  setShowEditor(true);
                }}
                aria-label="Media"
              >
                🖼️
              </button>

              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => insertText("Celebrating a new achievement 🎉 ")}
                aria-label="Celebration"
              >
                🎉
              </button>

              <div className={styles.toolWrap}>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => {
                    setShowPlus((open) => !open);
                    setShowEmoji(false);
                  }}
                  aria-label="More"
                >
                  ➕
                </button>
                {showPlus && (
                  <div className={styles.popover}>
                    <button
                      type="button"
                      className={styles.plusItem}
                      onClick={() => {
                        setShowPlus(false);
                        setShowEditor(true);
                      }}
                    >
                      Media
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className={styles.toolBtn}
                disabled
                title="Scheduling is not available yet"
                aria-label="Schedule for later"
              >
                🕒
              </button>
            </div>

            <button
              type="button"
              className={styles.postBtn}
              onClick={handleSubmit}
              disabled={!canPost}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      <MediaEditor
        isOpen={showEditor}
        items={mediaItems}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onAddFiles={addFiles}
        onRemoveSelected={removeSelected}
        onBack={() => setShowEditor(false)}
        onNext={() => setShowEditor(false)}
        onClose={() => setShowEditor(false)}
      />
    </>
  );
}
