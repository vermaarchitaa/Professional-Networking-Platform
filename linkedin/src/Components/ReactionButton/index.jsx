import React, { useEffect, useRef, useState } from "react";
import { getReactionMeta, REACTIONS } from "@/config/reactions";
import styles from "./styles.module.css";

export default function ReactionButton({ myReaction, count = 0, onSelect, compact = false }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const hideTimer = useRef(null);
  const touchTimer = useRef(null);
  const selected = myReaction ? getReactionMeta(myReaction) : null;

  const clearHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const scheduleHide = () => {
    clearHide();
    hideTimer.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => () => {
    clearHide();
    if (touchTimer.current) clearTimeout(touchTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const isTouch = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  return (
    <div
      className={styles.wrap}
      ref={wrapRef}
      onMouseEnter={() => {
        if (!isTouch) {
          clearHide();
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (!isTouch) scheduleHide();
      }}
    >
      <button
        type="button"
        className={`${styles.trigger} ${selected ? styles.active : ""} ${compact ? styles.compact : ""}`}
        onClick={() => {
          if (isTouch) {
            setOpen((value) => !value);
            return;
          }
          onSelect(myReaction || "like");
        }}
        onTouchStart={() => {
          touchTimer.current = setTimeout(() => setOpen(true), 350);
        }}
        onTouchEnd={() => {
          if (touchTimer.current) clearTimeout(touchTimer.current);
        }}
        aria-label={selected ? selected.label : "Like"}
      >
        {selected ? selected.emoji : "👍"}
        {count > 0 ? ` ${count}` : ""}
      </button>

      {open && (
        <div className={styles.picker} role="listbox" aria-label="Reactions">
          {REACTIONS.map((reaction) => (
            <button
              type="button"
              key={reaction.type}
              className={`${styles.option} ${myReaction === reaction.type ? styles.optionActive : ""}`}
              title={reaction.label}
              onClick={() => {
                onSelect(reaction.type);
                setOpen(false);
              }}
            >
              <span>{reaction.emoji}</span>
              <span className={styles.optionLabel}>{reaction.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
