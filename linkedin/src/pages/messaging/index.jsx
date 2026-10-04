import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import Avatar from "@/Components/Avatar";
import { getMediaUrl, getPublicProfilePath } from "@/config/utils";
import {
  DOCUMENT_ACCEPT,
  MEDIA_ACCEPT,
  MESSAGE_GIFTS,
  MESSAGE_MAX_FILE_BYTES,
  MESSAGE_STICKERS,
  TEXT_EMOJIS,
  conversationPreview,
  fileTypeLabel,
  formatFileSize,
  giftEmoji,
  isAllowedDocumentFile,
  isAllowedMediaFile,
  isVideoFile,
  stickerSrc,
} from "@/config/messageComposer";
import {
  fetchConversations,
  fetchConversationMessages,
  fetchMessagingPeer,
  fetchMessageRecipients,
  fetchShareProfile,
  fetchMessageUnreadCount,
  markConversationRead,
  sendChatMessage,
} from "@/config/redux/action/messageAction";
import { fetchUserProfile } from "@/config/redux/action/profileAction";
import { clearActiveConversation } from "@/config/redux/reducer/messageReducer";
import useAuthGuard from "@/hooks/useAuth";
import { tMessage, toIntlLocale, useI18n } from "@/i18n";
import { FileTextIcon, GiftIcon, ImageIcon, PaperclipIcon, SmileIcon } from "@/config/messagingIcons";
import GifPicker from "@/Components/GifPicker";
import ProfileShareCard from "@/Components/ProfileShareCard";
import styles from "./style.module.css";

function formatMessageTime(value, language) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(toIntlLocale(language), { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(toIntlLocale(language), { month: "short", day: "numeric" });
}

function senderKey(value) {
  return String(value?._id || value || "");
}

function MessageBody({ item, t, onOpenProfile }) {
  const type = item.messageType || "text";
  const attachment = item.attachment || {};
  const text = String(item.text || "").trim();

  if (type === "media" && attachment.filename) {
    const src = getMediaUrl(attachment.filename);
    return (
      <>
        {attachment.kind === "video" ? (
          <video className={styles.mediaVideo} src={src} controls preload="metadata" />
        ) : (
          <img className={styles.mediaImage} src={src} alt={t("photoMessage")} />
        )}
        {text ? <p>{text}</p> : null}
      </>
    );
  }

  if (type === "document" && attachment.filename) {
    const href = getMediaUrl(attachment.filename);
    const name = attachment.originalName || t("documentMessage");
    return (
      <a className={styles.docCard} href={href} target="_blank" rel="noopener noreferrer">
        <span className={styles.docIcon}><FileTextIcon size={20} /></span>
        <span className={styles.docMeta}>
          <strong>{name}</strong>
          <em>
            {[fileTypeLabel(name, attachment.mimeType), attachment.size ? formatFileSize(attachment.size) : ""]
              .filter(Boolean)
              .join(" · ")}
          </em>
          <span>{t("downloadDocument")}</span>
        </span>
      </a>
    );
  }

  if (type === "gif" && attachment.gifUrl) {
    return (
      <>
        <img className={styles.mediaImage} src={attachment.gifUrl} alt={t("gif")} />
        {text ? <p>{text}</p> : null}
      </>
    );
  }

  if (type === "gift") {
    const emoji = attachment.giftEmoji || giftEmoji(attachment.giftId);
    return (
      <>
        <div className={styles.giftDisplay} aria-label={t("giftMessage")}>
          <span className={styles.emojiGlyph}>{emoji}</span>
        </div>
        {text ? <p>{text}</p> : null}
      </>
    );
  }

  if (type === "profile" && (attachment.profile || attachment.username)) {
    return (
      <>
        {text ? <p>{text}</p> : null}
        <ProfileShareCard
          profile={attachment.profile || { username: attachment.username }}
          t={t}
          onOpen={onOpenProfile}
        />
      </>
    );
  }

  if (type === "sticker") {
    const src = stickerSrc(attachment.stickerId);
    if (!src) return text ? <p>{text}</p> : null;
    return (
      <>
        <img className={styles.stickerDisplay} src={src} alt={t("stickerMessage")} />
        {text ? <p>{text}</p> : null}
      </>
    );
  }

  return text ? <p>{text}</p> : null;
}

export default function MessagingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t, language } = useI18n();
  const { profile } = useSelector((state) => state.profile);
  const {
    conversations,
    activeConversationId,
    activePeer,
    messages,
    loading,
    sending,
    error,
    peerUnavailable,
  } = useSelector((state) => state.messages);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileThread, setMobileThread] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [openPicker, setOpenPicker] = useState("");
  const [composerError, setComposerError] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const endRef = useRef(null);
  const mediaInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const composerRef = useRef(null);
  const textareaRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const pendingCaretRef = useRef(null);
  const previewUrlRef = useRef("");

  useAuthGuard();

  const myId = String(profile?.userId?._id || "");
  const queryUserId = typeof router.query.userId === "string" ? router.query.userId : "";
  const shareProfileKey = typeof router.query.shareProfile === "string" ? router.query.shareProfile : "";

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
  };

  const resetComposer = () => {
    setDraft("");
    setAttachment(null);
    setOpenPicker("");
    setComposerError("");
    clearPreviewUrl();
    if (mediaInputRef.current) mediaInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  useEffect(() => () => clearPreviewUrl(), []);

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchConversations());
    dispatch(fetchMessageUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    if (!router.isReady || !shareProfileKey) return;
    dispatch(fetchShareProfile(shareProfileKey)).then((result) => {
      if (fetchShareProfile.fulfilled.match(result) && result.payload) {
        setAttachment({
          type: "profile",
          profileUserId: result.payload._id,
          username: result.payload.username,
          profile: result.payload,
        });
      } else {
        setComposerError(result.payload?.message || t("profileNotFound"));
      }
    });
    dispatch(fetchMessageRecipients()).then((result) => {
      if (fetchMessageRecipients.fulfilled.match(result)) {
        setRecipients(result.payload || []);
      }
    });
    setMobileThread(true);
  }, [dispatch, router.isReady, shareProfileKey, t]);

  useEffect(() => {
    if (!router.isReady || !queryUserId) return;
    dispatch(fetchMessagingPeer(queryUserId)).then((result) => {
      if (fetchMessagingPeer.fulfilled.match(result) && result.payload.hasMessages) {
        dispatch(fetchConversationMessages(result.payload.conversationId));
      }
    });
    setMobileThread(true);
  }, [dispatch, router.isReady, queryUserId]);

  useEffect(() => {
    if (!activeConversationId) return;
    dispatch(markConversationRead(activeConversationId));
  }, [dispatch, activeConversationId, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, activeConversationId]);

  useEffect(() => {
    if (!openPicker) return undefined;
    const handleClick = (event) => {
      if (composerRef.current && !composerRef.current.contains(event.target)) {
        setOpenPicker("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openPicker]);

  const visibleConversations = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return conversations;
    return conversations.filter((row) => {
      const name = String(row.peer?.name || "").toLowerCase();
      const username = String(row.peer?.username || "").toLowerCase();
      const preview = conversationPreview(row.lastMessage, t).toLowerCase();
      const filename = String(row.lastMessage?.attachment?.originalName || "").toLowerCase();
      return name.includes(value) || username.includes(value) || preview.includes(value) || filename.includes(value);
    });
  }, [conversations, search, t]);

  const openConversation = (conversationId) => {
    dispatch(fetchConversationMessages(conversationId));
    setMobileThread(true);
    if (attachment?.type !== "profile") resetComposer();
    else {
      setOpenPicker("");
      setComposerError("");
    }
  };

  const chooseRecipient = (userId) => {
    if (!userId) return;
    dispatch(fetchMessagingPeer(userId)).then((result) => {
      if (fetchMessagingPeer.fulfilled.match(result) && result.payload.hasMessages) {
        dispatch(fetchConversationMessages(result.payload.conversationId));
      }
    });
    setMobileThread(true);
  };

  const replaceAttachment = (next) => {
    clearPreviewUrl();
    if (next?.previewUrl) previewUrlRef.current = next.previewUrl;
    setAttachment(next);
    setComposerError("");
    setOpenPicker("");
  };

  const handleFileSelect = (file, kind) => {
    if (!file) return;
    if (file.size > MESSAGE_MAX_FILE_BYTES) {
      setComposerError(t("fileTooLarge"));
      return;
    }
    const allowed = kind === "media" ? isAllowedMediaFile(file) : isAllowedDocumentFile(file);
    if (!allowed) {
      setComposerError(t("unsupportedMessageFile"));
      return;
    }
    replaceAttachment({
      type: kind,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      mime: file.type,
      size: file.size,
    });
  };

  const rememberSelection = (event) => {
    const el = event?.target || textareaRef.current;
    if (!el) return;
    selectionRef.current = {
      start: typeof el.selectionStart === "number" ? el.selectionStart : draft.length,
      end: typeof el.selectionEnd === "number" ? el.selectionEnd : draft.length,
    };
  };

  const insertEmojiAtCaret = (emoji) => {
    if (!emoji || typeof emoji !== "string") return;
    const el = textareaRef.current;
    const start = el && typeof el.selectionStart === "number"
      ? el.selectionStart
      : selectionRef.current.start;
    const end = el && typeof el.selectionEnd === "number"
      ? el.selectionEnd
      : selectionRef.current.end;
    const safeStart = Math.max(0, Math.min(start, draft.length));
    const safeEnd = Math.max(safeStart, Math.min(end, draft.length));
    const next = `${draft.slice(0, safeStart)}${emoji}${draft.slice(safeEnd)}`;
    const caret = safeStart + emoji.length;
    pendingCaretRef.current = caret;
    selectionRef.current = { start: caret, end: caret };
    setDraft(next);
  };

  useEffect(() => {
    if (pendingCaretRef.current == null || !textareaRef.current) return;
    const caret = pendingCaretRef.current;
    pendingCaretRef.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(caret, caret);
  }, [draft]);

  const handleSend = () => {
    const text = draft.trim();
    const receiverId = activePeer?._id;
    if ((!text && !attachment) || !receiverId || sending) return;

    const payload = { receiverId, text };
    if (attachment?.type === "gift") payload.giftId = attachment.giftId;
    if (attachment?.type === "sticker") payload.stickerId = attachment.stickerId;
    if (attachment?.type === "gif") payload.gifUrl = attachment.gifUrl;
    if (attachment?.type === "profile") payload.profileUserId = attachment.profileUserId;
    if (attachment?.file) payload.file = attachment.file;

    dispatch(sendChatMessage(payload)).then((result) => {
      if (sendChatMessage.fulfilled.match(result)) {
        resetComposer();
        dispatch(fetchConversations());
        if (shareProfileKey) {
          router.replace("/messaging", undefined, { shallow: true });
        }
      }
    });
  };

  const canSend = Boolean(activePeer?._id) && !sending && Boolean(draft.trim() || attachment);
  const profilePath = getPublicProfilePath(activePeer?.username);
  const showThread = Boolean(activePeer) || peerUnavailable || Boolean(shareProfileKey);
  const visibleRecipients = useMemo(() => {
    const value = recipientSearch.trim().toLowerCase();
    const list = recipients.filter((row) => String(row._id) !== myId);
    if (!value) return list;
    return list.filter((row) => (
      String(row.name || "").toLowerCase().includes(value)
      || String(row.username || "").toLowerCase().includes(value)
    ));
  }, [recipients, recipientSearch, myId]);

  return (
    <DashboardLayout>
      <div className={`${styles.shell} ${mobileThread && showThread ? styles.shellThread : ""}`}>
        <aside className={styles.listPane}>
          <div className={styles.listHeader}>
            <h1 className={styles.heading}>{t("messaging")}</h1>
            <input
              type="search"
              className={styles.search}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchMessages")}
            />
          </div>
          {loading && conversations.length === 0 ? <p className={styles.empty}>{t("loading")}</p> : null}
          {!loading && visibleConversations.length === 0 ? (
            <p className={styles.empty}>{t("noConversations")}</p>
          ) : null}
          {visibleConversations.map((row) => {
            const active = row.conversationId === activeConversationId;
            return (
              <button
                type="button"
                key={row.conversationId}
                className={`${styles.conversation} ${active ? styles.conversationActive : ""}`}
                onClick={() => openConversation(row.conversationId)}
              >
                <Avatar user={row.peer} size={48} />
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationTop}>
                    <p className={styles.conversationName}>{row.peer?.name}</p>
                    <span className={styles.conversationTime}>
                      {formatMessageTime(row.lastMessage?.createdAt, language)}
                    </span>
                  </div>
                  <p className={styles.conversationPreview}>{conversationPreview(row.lastMessage, t)}</p>
                </div>
                {row.unreadCount > 0 ? <span className={styles.unreadDot} aria-label={t("unread")} /> : null}
              </button>
            );
          })}
        </aside>

        <section className={styles.threadPane}>
          {!showThread ? (
            <div className={styles.placeholder}>
              <p>{t("selectConversation")}</p>
            </div>
          ) : peerUnavailable ? (
            <div className={styles.placeholder}>
              <button type="button" className={styles.backBtn} onClick={() => { dispatch(clearActiveConversation()); setMobileThread(false); }}>
                {t("back")}
              </button>
              <p>{t("messageUnavailable")}</p>
              <p className={styles.placeholderHint}>{t("connectionRequired")}</p>
            </div>
          ) : shareProfileKey && !activePeer ? (
            <div className={styles.recipientPane}>
              <header className={styles.threadHeader}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => { setMobileThread(false); }}
                >
                  {t("back")}
                </button>
                <div>
                  <p className={styles.peerName}>{t("sendProfileMessage")}</p>
                  <p className={styles.peerHeadline}>{t("selectShareRecipient")}</p>
                </div>
              </header>
              {attachment?.type === "profile" ? (
                <div className={styles.sharePreview}>
                  <ProfileShareCard profile={attachment.profile} t={t} onOpen={(path) => router.push(path)} />
                </div>
              ) : null}
              <input
                type="search"
                className={styles.search}
                value={recipientSearch}
                onChange={(event) => setRecipientSearch(event.target.value)}
                placeholder={t("searchConnections")}
              />
              <div className={styles.recipientList}>
                {visibleRecipients.length === 0 ? (
                  <p className={styles.empty}>{t("noShareRecipients")}</p>
                ) : null}
                {visibleRecipients.map((person) => (
                  <button
                    type="button"
                    key={person._id}
                    className={styles.conversation}
                    onClick={() => chooseRecipient(person._id)}
                  >
                    <Avatar user={person} size={48} />
                    <div className={styles.conversationInfo}>
                      <p className={styles.conversationName}>{person.name}</p>
                      {person.headline ? <p className={styles.conversationPreview}>{person.headline}</p> : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <header className={styles.threadHeader}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => {
                    dispatch(clearActiveConversation());
                    setMobileThread(false);
                    if (attachment?.type !== "profile") resetComposer();
                  }}
                >
                  {t("back")}
                </button>
                <button
                  type="button"
                  className={styles.peerBtn}
                  onClick={() => profilePath && router.push(profilePath)}
                >
                  <Avatar user={activePeer} size={40} />
                  <div>
                    {activePeer?.name ? <p className={styles.peerName}>{activePeer.name}</p> : null}
                    {activePeer?.headline ? <p className={styles.peerHeadline}>{activePeer.headline}</p> : null}
                  </div>
                </button>
              </header>

              <div className={styles.thread}>
                {messages.length === 0 ? <p className={styles.empty}>{t("startConversation")}</p> : null}
                {messages.map((item) => {
                  const mine = senderKey(item.senderId) === myId;
                  const rich = item.messageType && item.messageType !== "text";
                  return (
                    <div key={item._id} className={`${styles.bubbleWrap} ${mine ? styles.mine : styles.theirs}`}>
                      <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs} ${rich ? styles.bubbleRich : ""}`}>
                        <MessageBody item={item} t={t} onOpenProfile={(path) => router.push(path)} />
                        <span>{formatMessageTime(item.createdAt, language)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {error ? <p className={styles.error}>{tMessage(t, error)}</p> : null}
              {composerError ? <p className={styles.error}>{composerError}</p> : null}

              <form
                className={styles.composer}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <div className={styles.composerBox} ref={composerRef}>
                  {openPicker === "gift" ? (
                    <div className={styles.picker} role="dialog" aria-label={t("giftPicker")}>
                      <div className={styles.pickerGrid}>
                        {MESSAGE_GIFTS.map((gift) => (
                          <button
                            type="button"
                            key={gift.id}
                            className={styles.giftBtn}
                            aria-label={`${t("pickGift")} ${gift.emoji}`}
                            title={`${t("pickGift")} ${gift.emoji}`}
                            onClick={() => replaceAttachment({ type: "gift", giftId: gift.id, giftEmoji: gift.emoji })}
                          >
                            <span className={styles.emojiGlyph} aria-hidden="true">{gift.emoji}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {openPicker === "emoji" || openPicker === "sticker" ? (
                    <div className={styles.picker} role="dialog" aria-label={openPicker === "sticker" ? t("stickerPicker") : t("emojiPicker")}>
                      <div className={styles.pickerTabs}>
                        <button
                          type="button"
                          className={`${styles.pickerTab} ${openPicker === "emoji" ? styles.pickerTabActive : ""}`}
                          onClick={() => setOpenPicker("emoji")}
                        >
                          {t("emojiTab")}
                        </button>
                        <button
                          type="button"
                          className={`${styles.pickerTab} ${openPicker === "sticker" ? styles.pickerTabActive : ""}`}
                          onClick={() => setOpenPicker("sticker")}
                        >
                          {t("stickerTab")}
                        </button>
                      </div>
                      {openPicker === "emoji" ? (
                        <div className={styles.emojiGrid}>
                          {TEXT_EMOJIS.map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              className={styles.emojiBtn}
                              aria-label={`${t("pickEmoji")} ${emoji}`}
                              title={emoji}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => insertEmojiAtCaret(emoji)}
                            >
                              <span className={styles.emojiGlyph} aria-hidden="true">{emoji}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.stickerGrid}>
                          {MESSAGE_STICKERS.map((sticker) => (
                            <button
                              type="button"
                              key={sticker.id}
                              className={styles.stickerBtn}
                              aria-label={t("pickSticker")}
                              title={t("pickSticker")}
                              onClick={() => replaceAttachment({ type: "sticker", stickerId: sticker.id })}
                            >
                              <img src={sticker.src} alt="" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <textarea
                    ref={textareaRef}
                    className={styles.input}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      rememberSelection(event);
                    }}
                    onSelect={rememberSelection}
                    onClick={rememberSelection}
                    onKeyUp={rememberSelection}
                    onBlur={rememberSelection}
                    placeholder={t("writeMessage")}
                    rows={3}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                  />

                  {attachment ? (
                    <div className={styles.preview}>
                      {attachment.type === "media" && attachment.previewUrl ? (
                        isVideoFile(attachment) ? (
                          <video className={styles.previewVideo} src={attachment.previewUrl} controls muted />
                        ) : (
                          <img className={styles.previewImage} src={attachment.previewUrl} alt={t("photoMessage")} />
                        )
                      ) : null}
                      {attachment.type === "document" ? (
                        <div className={styles.previewDoc}>
                          <FileTextIcon size={20} />
                          <div>
                            <p>{attachment.name}</p>
                            <span>{[fileTypeLabel(attachment.name, attachment.mime), formatFileSize(attachment.size)].join(" · ")}</span>
                          </div>
                        </div>
                      ) : null}
                      {attachment.type === "gif" && attachment.gifUrl ? (
                        <img className={styles.previewImage} src={attachment.gifUrl} alt={t("gif")} />
                      ) : null}
                      {attachment.type === "gift" ? (
                        <div className={styles.previewGift}>
                          <span className={styles.emojiGlyph} aria-hidden="true">{attachment.giftEmoji || giftEmoji(attachment.giftId)}</span>
                        </div>
                      ) : null}
                      {attachment.type === "sticker" ? (
                        <img className={styles.previewSticker} src={stickerSrc(attachment.stickerId)} alt={t("stickerMessage")} />
                      ) : null}
                      {attachment.type === "profile" ? (
                        <div className={styles.previewProfile}>
                          <ProfileShareCard
                            profile={attachment.profile}
                            t={t}
                            onOpen={(path) => router.push(path)}
                          />
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className={styles.removePreview}
                        aria-label={t("removeAttachment")}
                        title={t("removeAttachment")}
                        onClick={() => replaceAttachment(null)}
                      >
                        ×
                      </button>
                    </div>
                  ) : null}

                  <div className={styles.composerBar}>
                    <div className={styles.composerActions}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={t("attachMedia")}
                        title={t("attachMedia")}
                        onClick={() => {
                          setOpenPicker("");
                          mediaInputRef.current?.click();
                        }}
                      >
                        <ImageIcon size={20} />
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={t("attachDocument")}
                        title={t("attachDocument")}
                        onClick={() => {
                          setOpenPicker("");
                          documentInputRef.current?.click();
                        }}
                      >
                        <PaperclipIcon size={20} />
                      </button>
                      <div className={styles.gifWrap}>
                        <button
                          type="button"
                          className={`${styles.gifLabelBtn} ${openPicker === "gif" ? styles.gifLabelBtnActive : ""}`}
                          aria-label={t("gif")}
                          title={t("gif")}
                          aria-expanded={openPicker === "gif"}
                          onClick={() => setOpenPicker((current) => (current === "gif" ? "" : "gif"))}
                        >
                          {t("gif")}
                        </button>
                        {openPicker === "gif" ? (
                          <GifPicker
                            className={styles.gifPickerDock}
                            onSelect={(url) => replaceAttachment({ type: "gif", gifUrl: url, kind: "gif" })}
                            onClose={() => setOpenPicker("")}
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${openPicker === "gift" ? styles.iconBtnActive : ""}`}
                        aria-label={t("pickGift")}
                        title={t("pickGift")}
                        aria-expanded={openPicker === "gift"}
                        onClick={() => setOpenPicker((current) => (current === "gift" ? "" : "gift"))}
                      >
                        <GiftIcon size={20} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${openPicker === "emoji" || openPicker === "sticker" ? styles.iconBtnActive : ""}`}
                        aria-label={t("pickEmoji")}
                        title={t("pickEmoji")}
                        aria-expanded={openPicker === "emoji" || openPicker === "sticker"}
                        onMouseDown={() => rememberSelection()}
                        onClick={() => setOpenPicker((current) => (current === "emoji" || current === "sticker" ? "" : "emoji"))}
                      >
                        <SmileIcon size={20} />
                      </button>
                    </div>
                    <button type="submit" className={styles.sendBtn} disabled={!canSend}>
                      {t("sendMessage")}
                    </button>
                  </div>

                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept={MEDIA_ACCEPT}
                    className={styles.hiddenInput}
                    tabIndex={-1}
                    onChange={(event) => {
                      handleFileSelect(event.target.files?.[0], "media");
                      event.target.value = "";
                    }}
                  />
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept={DOCUMENT_ACCEPT}
                    className={styles.hiddenInput}
                    tabIndex={-1}
                    onChange={(event) => {
                      handleFileSelect(event.target.files?.[0], "document");
                      event.target.value = "";
                    }}
                  />
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
