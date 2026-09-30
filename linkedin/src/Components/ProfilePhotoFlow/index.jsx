import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import ProfilePhotoMenu from "@/Components/ProfilePhotoMenu";
import ProfilePhotoIntro from "@/Components/ProfilePhotoIntro";
import ProfilePhotoCamera from "@/Components/ProfilePhotoCamera";
import ProfilePhotoEditor from "@/Components/ProfilePhotoEditor";
import ProfilePhotoFrames from "@/Components/ProfilePhotoFrames";
import ProfilePhotoDeleteDialog from "@/Components/ProfilePhotoDeleteDialog";
import { loadImageFromSrc } from "@/Components/CoverPhotoFlow/coverUtils";
import {
  PHOTO_ACCEPT,
  loadImageFromBlob,
  revokeImageUrl,
  validateProfilePhotoFile,
} from "@/Components/ProfilePhotoFlow/photoUtils";
import { deleteProfilePicture, updateProfilePhotoVisibility, updateProfilePictureFrame, uploadProfilePicture } from "@/config/redux/action/profileAction";

export default function ProfilePhotoFlow({
  open,
  hasPhoto,
  photoSrc,
  frameId,
  visibility,
  onClose,
}) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const loadGenRef = useRef(0);
  const cameraRequestRef = useRef(null);
  const savingRef = useRef(false);
  const deletingRef = useRef(false);
  const startView = hasPhoto ? "menu" : "intro";
  const wasOpenRef = useRef(open);
  const [view, setView] = useState(startView);
  const [returnView, setReturnView] = useState(startView);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [frameSaving, setFrameSaving] = useState(false);

  imageRef.current = image;

  if (open !== wasOpenRef.current) {
    wasOpenRef.current = open;
    setView(startView);
    setReturnView(startView);
  }

  const resetEditor = () => {
    loadGenRef.current += 1;
    revokeImageUrl(imageRef.current);
    imageRef.current = null;
    setImage(null);
    setPreviewSrc("");
  };

  const closeAll = () => {
    resetEditor();
    setView(startView);
    setReturnView(startView);
    setDeleteOpen(false);
    setError("");
    setSaving(false);
    savingRef.current = false;
    setDeleting(false);
    deletingRef.current = false;
    setFrameSaving(false);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      resetEditor();
      cameraRequestRef.current = null;
      setDeleteOpen(false);
      setError("");
      setSaving(false);
      savingRef.current = false;
      setDeleting(false);
      deletingRef.current = false;
      setFrameSaving(false);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (deleteOpen) {
        setError("");
        setDeleteOpen(false);
        return;
      }
      if (view === "editor") {
        resetEditor();
        setError("");
        setView(returnView);
        return;
      }
      if (view === "camera") {
        cameraRequestRef.current = null;
        setError("");
        setView("intro");
        return;
      }
      if (view === "frames") {
        setError("");
        setView("menu");
        return;
      }
      if (view === "intro" && hasPhoto) {
        setError("");
        setView("menu");
        return;
      }
      closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, view, returnView, deleteOpen, hasPhoto]);

  const openEditorFromSrc = async (src, nextReturnView) => {
    const gen = ++loadGenRef.current;
    setError("");
    try {
      const loaded = await loadImageFromSrc(src);
      if (gen !== loadGenRef.current) {
        revokeImageUrl(loaded);
        return;
      }
      revokeImageUrl(imageRef.current);
      imageRef.current = loaded;
      setImage(loaded);
      setPreviewSrc(loaded._objectUrl || src);
      setReturnView(nextReturnView);
      setView("editor");
    } catch {
      if (gen === loadGenRef.current) {
        setError("Could not load this image for editing.");
      }
    }
  };

  const openEditorFromBlob = async (blob, nextReturnView) => {
    const gen = ++loadGenRef.current;
    setError("");
    try {
      const loaded = await loadImageFromBlob(blob);
      if (gen !== loadGenRef.current) {
        revokeImageUrl(loaded);
        return;
      }
      revokeImageUrl(imageRef.current);
      imageRef.current = loaded;
      setImage(loaded);
      setPreviewSrc(loaded._objectUrl);
      setReturnView(nextReturnView);
      setView("editor");
    } catch {
      if (gen === loadGenRef.current) {
        setError("Could not load this image for editing.");
        setView("intro");
      }
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const message = validateProfilePhotoFile(file);
    if (message) {
      setError(message);
      setView("intro");
      return;
    }
    openEditorFromBlob(file, "intro");
  };

  const handleSave = async (file) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    const result = await dispatch(uploadProfilePicture(file));
    if (uploadProfilePicture.rejected.match(result)) {
      savingRef.current = false;
      setSaving(false);
      setError(result.payload?.message || "Failed to update photo");
      return;
    }
    closeAll();
  };

  const handleDelete = async () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);
    setError("");
    const result = await dispatch(deleteProfilePicture());
    if (deleteProfilePicture.rejected.match(result)) {
      deletingRef.current = false;
      setDeleting(false);
      setError(result.payload?.message || "Failed to delete profile picture");
      return;
    }
    closeAll();
  };

  const handleVisibilityChange = async (nextVisibility) => {
    setError("");
    const result = await dispatch(updateProfilePhotoVisibility(nextVisibility));
    if (updateProfilePhotoVisibility.rejected.match(result)) {
      setError(result.payload?.message || "Failed to update visibility");
      throw new Error("visibility");
    }
  };

  const handleApplyFrame = async (nextFrame) => {
    setFrameSaving(true);
    setError("");
    const result = await dispatch(updateProfilePictureFrame(nextFrame));
    setFrameSaving(false);
    if (updateProfilePictureFrame.rejected.match(result)) {
      setError(result.payload?.message || "Failed to update frame");
      return;
    }
    setView("menu");
  };

  if (!open) return null;

  return (
    <>
      {view === "menu" && (
        <ProfilePhotoMenu
          open
          photoSrc={photoSrc}
          frameId={frameId}
          visibility={visibility}
          error={!deleteOpen ? error : ""}
          onClose={closeAll}
          onEdit={() => openEditorFromSrc(photoSrc, "menu")}
          onUpdate={() => {
            setError("");
            setView("intro");
          }}
          onFrames={() => {
            setError("");
            setView("frames");
          }}
          onDelete={() => {
            setError("");
            setDeleteOpen(true);
          }}
          onVisibilityChange={handleVisibilityChange}
        />
      )}

      {view === "intro" && (
        <ProfilePhotoIntro
          error={error}
          onClose={hasPhoto ? () => {
            setError("");
            setView("menu");
          } : closeAll}
          onUseCamera={() => {
            setError("");
            cameraRequestRef.current = navigator.mediaDevices?.getUserMedia
              ? navigator.mediaDevices.getUserMedia({ video: true, audio: false })
              : null;
            setView("camera");
          }}
          onUploadPhoto={() => fileInputRef.current?.click()}
        />
      )}

      {view === "camera" && (
        <ProfilePhotoCamera
          initialRequest={cameraRequestRef.current}
          onClose={() => {
            cameraRequestRef.current = null;
            closeAll();
          }}
          onCancel={() => {
            cameraRequestRef.current = null;
            setError("");
            setView("intro");
          }}
          onCapture={(blob) => {
            cameraRequestRef.current = null;
            openEditorFromBlob(blob, "intro");
          }}
        />
      )}

      {view === "editor" && (
        <ProfilePhotoEditor
          image={image}
          previewSrc={previewSrc}
          saving={saving}
          error={error}
          onClose={() => {
            resetEditor();
            setError("");
            setView(returnView);
          }}
          onSave={handleSave}
        />
      )}

      {view === "frames" && (
        <ProfilePhotoFrames
          photoSrc={photoSrc}
          frameId={frameId}
          saving={frameSaving}
          error={error}
          onClose={() => {
            setError("");
            setView("menu");
          }}
          onApply={handleApplyFrame}
        />
      )}

      {deleteOpen && (
        <ProfilePhotoDeleteDialog
          error={error}
          deleting={deleting}
          onCancel={() => {
            setError("");
            setDeleteOpen(false);
          }}
          onConfirm={handleDelete}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        hidden
        onChange={handleFile}
      />
    </>
  );
}
