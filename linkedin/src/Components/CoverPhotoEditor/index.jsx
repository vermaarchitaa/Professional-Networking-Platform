import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AdjustIcon,
  CloseIcon,
  CropIcon,
  FilterIcon,
  FlipHIcon,
  FlipVIcon,
  RotateLeftIcon,
  RotateRightIcon,
} from "@/Components/CoverPhotoFlow/icons";
import {
  COVER_FILTERS,
  DEFAULT_EDIT_STATE,
  buildCoverFilter,
  drawCoverImage,
  exportCoverBlob,
} from "@/Components/CoverPhotoFlow/coverUtils";
import styles from "./styles.module.css";

const TABS = [
  { id: "crop", label: "Crop", Icon: CropIcon },
  { id: "filter", label: "Filter", Icon: FilterIcon },
  { id: "adjust", label: "Adjust", Icon: AdjustIcon },
];

export default function CoverPhotoEditor({
  image,
  previewSrc,
  saving,
  error,
  onClose,
  onSave,
}) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const lastTapRef = useRef(0);
  const [tab, setTab] = useState("crop");
  const [edit, setEdit] = useState(() => ({ ...DEFAULT_EDIT_STATE }));
  const [processError, setProcessError] = useState("");
  const [exporting, setExporting] = useState(false);
  const busy = saving || exporting || !image;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const width = canvas.clientWidth || 760;
    const height = Math.max(1, Math.round(width / 4));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCoverImage(ctx, image, { width, height, ...edit });
  }, [edit, image]);

  useEffect(() => {
    setEdit({ ...DEFAULT_EDIT_STATE });
    setTab("crop");
    setProcessError("");
  }, [image]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new ResizeObserver(() => redraw());
    observer.observe(stage);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      setEdit((current) => ({
        ...current,
        zoom: Math.min(3, Math.max(1, current.zoom + (event.deltaY < 0 ? 0.08 : -0.08))),
      }));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  const toggleZoom = () => {
    setEdit((current) => ({ ...current, zoom: current.zoom > 1.4 ? 1 : 2 }));
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      toggleZoom();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    const canvas = canvasRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: edit.panX,
      panY: edit.panY,
      width: canvas?.clientWidth || 1,
      height: canvas?.clientHeight || 1,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.startX) / drag.width;
    const dy = (event.clientY - drag.startY) / drag.height;
    setEdit((current) => ({
      ...current,
      panX: drag.panX + dx,
      panY: drag.panY + dy,
    }));
  };

  const onPointerUp = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setProcessError("");
    setExporting(true);
    try {
      const blob = await exportCoverBlob(image, edit);
      const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
      await onSave(file);
    } catch {
      setProcessError("Could not process this image. Try another file.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => { if (!saving && !exporting) onClose(); }} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-image-title"
      >
        <header className={styles.header}>
          <h2 id="edit-image-title">Edit image</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.layout}>
          <div className={styles.previewPane}>
            <div
              ref={stageRef}
              className={styles.cropStage}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={toggleZoom}
            >
              <canvas ref={canvasRef} className={styles.previewCanvas} />
              <div className={styles.cropGuide} />
            </div>
          </div>

          <aside className={styles.controls}>
            <div className={styles.tabs}>
              {TABS.map(({ id, label, Icon }) => (
                <button
                  type="button"
                  key={id}
                  className={tab === id ? styles.tabActive : styles.tab}
                  onClick={() => setTab(id)}
                >
                  <Icon />
                  {label}
                </button>
              ))}
            </div>

            {tab === "crop" && (
              <div className={styles.panel}>
                <p className={styles.hint}>
                  Drag to reposition. Scroll or pinch-style zoom with the slider. Double-click to toggle zoom.
                </p>
                <label className={styles.label}>
                  Zoom
                  <span>{Math.round(edit.zoom * 100)}%</span>
                </label>
                <input
                  className={styles.slider}
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={edit.zoom}
                  onChange={(event) => setEdit((current) => ({ ...current, zoom: Number(event.target.value) }))}
                />
                <div className={styles.toolRow}>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => setEdit((current) => ({ ...current, rotation: (current.rotation - 90 + 360) % 360 }))}
                  >
                    <RotateLeftIcon /> Rotate left
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => setEdit((current) => ({ ...current, rotation: (current.rotation + 90) % 360 }))}
                  >
                    <RotateRightIcon /> Rotate right
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => setEdit((current) => ({ ...current, flipH: !current.flipH }))}
                  >
                    <FlipHIcon /> Flip horizontal
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => setEdit((current) => ({ ...current, flipV: !current.flipV }))}
                  >
                    <FlipVIcon /> Flip vertical
                  </button>
                </div>
              </div>
            )}

            {tab === "filter" && (
              <div className={styles.filters}>
                {COVER_FILTERS.map((filter) => (
                  <button
                    type="button"
                    key={filter.id}
                    className={edit.filterId === filter.id ? styles.filterBtnActive : styles.filterBtn}
                    onClick={() => setEdit((current) => ({ ...current, filterId: filter.id }))}
                  >
                    <img
                      src={previewSrc}
                      alt=""
                      className={styles.filterThumb}
                      style={{ filter: buildCoverFilter(filter.id, 100, 100, 100) }}
                    />
                    <span className={styles.filterLabel}>{filter.label}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === "adjust" && (
              <div className={styles.panel}>
                {[
                  ["brightness", "Brightness"],
                  ["contrast", "Contrast"],
                  ["saturation", "Saturation"],
                ].map(([key, label]) => (
                  <React.Fragment key={key}>
                    <label className={styles.label}>
                      {label}
                      <span>{edit[key]}</span>
                    </label>
                    <input
                      className={styles.slider}
                      type="range"
                      min="0"
                      max="200"
                      value={edit[key]}
                      onChange={(event) => setEdit((current) => ({ ...current, [key]: Number(event.target.value) }))}
                    />
                  </React.Fragment>
                ))}
                <label className={styles.label}>
                  Vignette
                  <span>{edit.vignette}</span>
                </label>
                <input
                  className={styles.slider}
                  type="range"
                  min="0"
                  max="100"
                  value={edit.vignette}
                  onChange={(event) => setEdit((current) => ({ ...current, vignette: Number(event.target.value) }))}
                />
              </div>
            )}
          </aside>
        </div>

        {(error || processError) ? <p className={styles.error}>{error || processError}</p> : null}

        <div className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy}>
            {saving || exporting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
