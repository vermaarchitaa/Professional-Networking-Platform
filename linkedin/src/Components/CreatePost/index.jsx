import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { createPost, fetchPosts } from "@/config/redux/action/postAction";
import { validatePostBody } from "@/config/validation";
import styles from "./styles.module.css";

export default function CreatePost() {
  const dispatch = useDispatch();
  const [body, setBody] = useState("");
  const [media, setMedia] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const validationError = validatePostBody(body);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);
    await dispatch(createPost({ body: body.trim(), media }));
    await dispatch(fetchPosts());
    setBody("");
    setMedia(null);
    setIsSubmitting(false);
  };

  return (
    <div className={styles.card}>
      <textarea
        className={`${styles.textarea} ${error ? styles.inputError : ""}`}
        placeholder="Share something with your network..."
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (error) setError("");
        }}
        rows={3}
        maxLength={5000}
      />
      {error && <p className={styles.fieldError}>{error}</p>}
      <div className={styles.footer}>
        <label className={styles.fileLabel}>
          📎 Attach media
          <input
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => setMedia(e.target.files?.[0] || null)}
          />
        </label>
        {media && <span className={styles.fileName}>{media.name}</span>}
        <span className={styles.charCount}>{body.length}/5000</span>
        <button
          className={styles.postBtn}
          onClick={handleSubmit}
          disabled={isSubmitting || !body.trim()}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
