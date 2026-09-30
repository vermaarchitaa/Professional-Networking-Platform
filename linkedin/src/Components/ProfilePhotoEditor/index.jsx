import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AdjustIcon,
  CloseIcon,
  CropIcon,
  FilterIcon,
} from "@/Components/CoverPhotoFlow/icons";
import {
  COVER_FILTERS,
  DEFAULT_EDIT_STATE,
  buildCoverFilter,
  drawCoverImage,
} from "@/Components/CoverPhotoFlow/coverUtils";
import { clampPhotoEdit, exportProfileBlob } from "@/Components/ProfilePhotoFlow/photoUtils";
import styles from "./styles.module.css";

const TABS = [
  { id: "crop", label: "Crop", Icon: CropIcon },
  { id: "filter", label: "Filter", Icon: FilterIcon },
  { id: "adjust", label: "Adjust", Icon: AdjustIcon },
];

export default function ProfilePhotoEditor({
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
    const width = canvas.clientWidth || 420;
    const height = width;
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
      const canvas = canvasRef.current;
      setEdit((current) => clampPhotoEdit(image, {
        ...current,
        zoom: current.zoom + (event.deltaY < 0 ? 0.08 : -0.08),
      }, canvas?.clientWidth || 420, canvas?.clientHeight || 420));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [image]);

  const toggleZoom = () => {
    const canvas = canvasRef.current;
    setEdit((current) => clampPhotoEdit(image, {
      ...current,
      zoom: current.zoom > 1.4 ? 1 : 2,
    }, canvas?.clientWidth || 420, canvas?.clientHeight || 420));
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
    setEdit((current) => clampPhotoEdit(image, {
      ...current,
      panX: drag.panX + dx,
      panY: drag.panY + dy,
    }, drag.width, drag.height));
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
      const blob = await exportProfileBlob(image, edit);
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
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
        aria-labelledby="edit-photo-title"
      >
        <header className={styles.header}>
          <h2 id="edit-photo-title">Edit photo</h2>
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
                  aria-pressed={tab === id}
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
                  Drag to reposition. Use the slider or scroll to zoom. Double-click to toggle zoom.
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
                  onChange={(event) => {
                    const canvas = canvasRef.current;
                    setEdit((current) => clampPhotoEdit(image, {
                      ...current,
                      zoom: Number(event.target.value),
                    }, canvas?.clientWidth || 420, canvas?.clientHeight || 420));
                  }}
                />
              </div>
            )}

            {tab === "filter" && (
              <div className={styles.filters}>
                {COVER_FILTERS.map((filter) => (
                  <button
                    type="button"
                    key={filter.id}
                    className={edit.filterId === filter.id ? styles.filterBtnActive : styles.filterBtn}
                    aria-pressed={edit.filterId === filter.id}
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
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy} aria-busy={busy}>
            {saving || exporting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
