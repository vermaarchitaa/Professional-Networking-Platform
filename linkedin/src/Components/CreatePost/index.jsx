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

const VISIBILITY_LABELS = {
  anyone: "Post to Anyone",
  connections: "Post to Connections only",
  group: "Post to Group",
};

const COMMENT_LABELS = {
  anyone: "Comments: Anyone",
  connections: "Comments: Connections only",
  off: "Comments: Off",
};

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const GlobeIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Icon>
);

const ConnectionsIcon = () => (
  <Icon>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M16 14.5c2.4.3 4.5 1.7 5 4.5" />
  </Icon>
);

const GroupIcon = () => (
  <Icon>
    <circle cx="8" cy="9" r="2.4" />
    <circle cx="16" cy="9" r="2.4" />
    <circle cx="12" cy="7.5" r="2.2" />
    <path d="M3.8 19a4.4 4.4 0 0 1 8.4 0M11.8 19a4.4 4.4 0 0 1 8.4 0" />
  </Icon>
);

const CommentsOffIcon = () => (
  <Icon>
    <path d="M5 16.5 3 20l4.2-1.5A8.5 8.5 0 1 0 5 16.5Z" />
    <path d="m8 9 8 8M16 9l-8 8" />
  </Icon>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

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
  const visibilityRef = useRef(null);
  const commentsRef = useRef(null);
  const [body, setBody] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPostVisibility, setSelectedPostVisibility] = useState("anyone");
  const [selectedCommentPermission, setSelectedCommentPermission] = useState("anyone");
  const [brandPartnership, setBrandPartnership] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

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
    setOpenDropdown(null);
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
      if (openDropdown) {
        setOpenDropdown(null);
        return;
      }
      resetDraft();
      onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, showEditor, openDropdown, onClose]);

  useEffect(() => {
    if (!isOpen) setOpenDropdown(null);
  }, [isOpen]);

  useEffect(() => {
    if (!openDropdown) return undefined;
    const onPointerDown = (event) => {
      const target = event.target;
      if (visibilityRef.current?.contains(target)) return;
      if (commentsRef.current?.contains(target)) return;
      setOpenDropdown(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openDropdown]);

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
        commentPermission: selectedCommentPermission,
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
                <div className={styles.settingWrap} ref={visibilityRef}>
                  <button
                    type="button"
                    className={styles.audienceBtn}
                    aria-haspopup="dialog"
                    aria-expanded={openDropdown === "visibility"}
                    onClick={() => {
                      setOpenDropdown((current) => (current === "visibility" ? null : "visibility"));
                      setShowEmoji(false);
                      setShowPlus(false);
                    }}
                  >
                    {VISIBILITY_LABELS[selectedPostVisibility]}
                    <ChevronDownIcon />
                  </button>
                  {openDropdown === "visibility" && (
                    <div className={styles.settingsMenu} role="dialog" aria-label="Who can see your post?">
                      <p className={styles.settingsTitle}>Who can see your post?</p>
                      <button
                        type="button"
                        className={styles.settingsOption}
                        onClick={() => {
                          setSelectedPostVisibility("anyone");
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.optionIcon}><GlobeIcon /></span>
                        <span className={styles.optionText}>
                          <span className={styles.optionLabel}>Anyone</span>
                          <span className={styles.optionDesc}>Anyone on or off LinkedIn</span>
                        </span>
                        <span className={selectedPostVisibility === "anyone" ? styles.radioOn : styles.radioOff} />
                      </button>
                      <button
                        type="button"
                        className={styles.settingsOption}
                        onClick={() => {
                          setSelectedPostVisibility("connections");
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.optionIcon}><ConnectionsIcon /></span>
                        <span className={styles.optionText}>
                          <span className={styles.optionLabel}>Connections only</span>
                        </span>
                        <span className={selectedPostVisibility === "connections" ? styles.radioOn : styles.radioOff} />
                      </button>
                      <button
                        type="button"
                        className={styles.settingsOption}
                        onClick={() => {
                          setSelectedPostVisibility("group");
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.optionIcon}><GroupIcon /></span>
                        <span className={styles.optionText}>
                          <span className={styles.optionLabel}>Group</span>
                        </span>
                        <span className={styles.optionTrailing}>
                          <span className={selectedPostVisibility === "group" ? styles.radioOn : styles.radioOff} />
                          <ChevronRightIcon />
                        </span>
                      </button>
                      <div className={styles.brandRow}>
                        <div>
                          <p className={styles.brandTitle}>Brand Partnership</p>
                          <button type="button" className={styles.learnMore}>Learn more</button>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={brandPartnership}
                          aria-label="Brand Partnership"
                          className={`${styles.toggle} ${brandPartnership ? styles.toggleOn : ""}`}
                          onClick={() => setBrandPartnership((current) => !current)}
                        >
                          <span className={styles.toggleKnob} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.settingWrap} ref={commentsRef}>
                  <button
                    type="button"
                    className={styles.audienceBtn}
                    aria-haspopup="dialog"
                    aria-expanded={openDropdown === "comments"}
                    onClick={() => {
                      setOpenDropdown((current) => (current === "comments" ? null : "comments"));
                      setShowEmoji(false);
                      setShowPlus(false);
                    }}
                  >
                    {COMMENT_LABELS[selectedCommentPermission]}
                    <ChevronDownIcon />
                  </button>
                  {openDropdown === "comments" && (
                    <div className={`${styles.settingsMenu} ${styles.settingsMenuEnd}`} role="dialog" aria-label="Comment settings">
                      <p className={styles.settingsTitle}>Comment settings</p>
                      <button
                        type="button"
                        className={styles.settingsOption}
                        onClick={() => {
                          setSelectedCommentPermission("anyone");
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.optionIcon}><GlobeIcon /></span>
                        <span className={styles.optionText}>
                          <span className={styles.optionLabel}>Anyone</span>
                        </span>
                        <span className={selectedCommentPermission === "anyone" ? styles.radioOn : styles.radioOff} />
                      </button>
                      <button
                        type="button"
                        className={styles.settingsOption}
                        onClick={() => {
                          setSelectedCommentPermission("connections");
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.optionIcon}><ConnectionsIcon /></span>
                        <span className={styles.optionText}>
                          <span className={styles.optionLabel}>Connections only</span>
                        </span>
                        <span className={selectedCommentPermission === "connections" ? styles.radioOn : styles.radioOff} />
                      </button>
                      <button
                        type="button"
                        className={styles.settingsOption}
                        onClick={() => {
                          setSelectedCommentPermission("off");
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.optionIcon}><CommentsOffIcon /></span>
                        <span className={styles.optionText}>
                          <span className={styles.optionLabel}>Off</span>
                        </span>
                        <span className={selectedCommentPermission === "off" ? styles.radioOn : styles.radioOff} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button type="button" className={styles.closeBtn} onClick={closeComposer} aria-label="Close">
              ✕
            </button>
          </header>

          <div className={styles.composerBody}>
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
          </div>

          <div className={styles.toolbar}>
            <div className={styles.tools}>
              <div className={styles.toolWrap}>
                <button
                  type="button"
                  className={styles.toolBtn}
                  onClick={() => {
                    setShowEmoji((open) => !open);
                    setShowPlus(false);
                    setOpenDropdown(null);
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
                  setOpenDropdown(null);
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
                    setOpenDropdown(null);
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
