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
} from "@/Components/CoverPhotoFlow/coverUtils";
import { clampPhotoEdit, exportProfileBlob } from "@/Components/ProfilePhotoFlow/photoUtils";
import { tMessage, useI18n } from "@/i18n";
import styles from "./styles.module.css";

const TABS = [
  { id: "crop", labelKey: "crop", Icon: CropIcon },
  { id: "filter", labelKey: "filter", Icon: FilterIcon },
  { id: "adjust", labelKey: "adjust", Icon: AdjustIcon },
];

export default function ProfilePhotoEditor({
  image,
  previewSrc,
  saving,
  error,
  onClose,
  onSave,
}) {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const editRef = useRef({ ...DEFAULT_EDIT_STATE, zoom: 1.2 });
  const [tab, setTab] = useState("crop");
  const [edit, setEdit] = useState(() => ({ ...DEFAULT_EDIT_STATE, zoom: 1.2 }));
  const [processError, setProcessError] = useState("");
  const [exporting, setExporting] = useState(false);
  const busy = saving || exporting || !image;
  editRef.current = edit;

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
    setEdit({ ...DEFAULT_EDIT_STATE, zoom: 1.2 });
    setTab("crop");
    setProcessError("");
  }, [image]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => () => {
    document.body.style.userSelect = "";
    dragRef.current = null;
  }, []);

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
    return () => {
      stage.removeEventListener("wheel", onWheel);
    };
  }, [image]);

  const applyEdit = (patch) => {
    const canvas = canvasRef.current;
    setEdit((current) => clampPhotoEdit(image, {
      ...current,
      ...patch,
    }, canvas?.clientWidth || 420, canvas?.clientHeight || 420));
  };

  const toggleZoom = () => {
    applyEdit({ zoom: edit.zoom > 1.4 ? 1 : 2 });
  };

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    document.body.style.userSelect = "none";
    const canvas = canvasRef.current;
    const current = editRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: current.panX,
      panY: current.panY,
      width: Math.max(canvas?.clientWidth || 0, 1),
      height: Math.max(canvas?.clientHeight || 0, 1),
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* some browsers reject capture on this node */
    }
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dx = (event.clientX - drag.startX) / drag.width;
    const dy = (event.clientY - drag.startY) / drag.height;
    setEdit((current) => clampPhotoEdit(image, {
      ...current,
      panX: drag.panX + dx,
      panY: drag.panY + dy,
    }, drag.width, drag.height));
  };

  const endDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const target = event.currentTarget;
    dragRef.current = null;
    document.body.style.userSelect = "";
    if (target?.hasPointerCapture?.(event.pointerId)) {
      try {
        target.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
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
      setProcessError("couldNotProcessImage");
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
          <h2 id="edit-photo-title">{t("editPhoto")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")}>
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
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onDoubleClick={toggleZoom}
              onDragStart={(event) => event.preventDefault()}
            >
              <canvas
                ref={canvasRef}
                className={styles.previewCanvas}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
              />
              <div className={styles.cropGuide} />
            </div>
          </div>

          <aside className={styles.controls}>
            <div className={styles.tabs}>
              {TABS.map(({ id, labelKey, Icon }) => (
                <button
                  type="button"
                  key={id}
                  className={tab === id ? styles.tabActive : styles.tab}
                  aria-pressed={tab === id}
                  onClick={() => setTab(id)}
                >
                  <Icon />
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {tab === "crop" && (
              <div className={styles.panel}>
                <div className={styles.toolRow}>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => applyEdit({ rotation: (edit.rotation - 90 + 360) % 360 })}
                  >
                    <RotateLeftIcon /> Rotate left
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => applyEdit({ rotation: (edit.rotation + 90) % 360 })}
                  >
                    <RotateRightIcon /> Rotate right
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => applyEdit({ flipH: !edit.flipH })}
                  >
                    <FlipHIcon /> Flip horizontal
                  </button>
                  <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => applyEdit({ flipV: !edit.flipV })}
                  >
                    <FlipVIcon /> Flip vertical
                  </button>
                </div>
                <label className={styles.label}>
                  {t("zoom")}
                  <span>{Math.round(edit.zoom * 100)}%</span>
                </label>
                <input
                  className={styles.slider}
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={edit.zoom}
                  onChange={(event) => applyEdit({ zoom: Number(event.target.value) })}
                />
                <label className={styles.label}>
                  Rotate
                  <span>{Math.round(edit.rotation)}°</span>
                </label>
                <input
                  className={styles.slider}
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={edit.rotation}
                  onChange={(event) => applyEdit({ rotation: Number(event.target.value) })}
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
                  ["brightness", "brightness"],
                  ["contrast", "contrast"],
                  ["saturation", "saturation"],
                ].map(([key, labelKey]) => (
                  <React.Fragment key={key}>
                    <label className={styles.label}>
                      {t(labelKey)}
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
                  {t("vignette")}
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

        {(error || processError) ? <p className={styles.error}>{tMessage(t, error || processError)}</p> : null}

        <div className={styles.footer}>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy} aria-busy={busy}>
            {saving || exporting ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
