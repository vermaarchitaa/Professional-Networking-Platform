import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import ProfilePhotoIntro from "@/Components/ProfilePhotoIntro";
import ProfilePhotoCamera from "@/Components/ProfilePhotoCamera";
import ProfilePhotoEditor from "@/Components/ProfilePhotoEditor";
import {
  PHOTO_ACCEPT,
  loadImageFromBlob,
  revokeImageUrl,
  validateProfilePhotoFile,
} from "@/Components/ProfilePhotoFlow/photoUtils";
import { uploadProfilePicture } from "@/config/redux/action/profileAction";

export default function ProfilePhotoFlow({ open, onClose }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const loadGenRef = useRef(0);
  const [view, setView] = useState("intro");
  const [image, setImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  imageRef.current = image;

  const resetEditor = () => {
    loadGenRef.current += 1;
    revokeImageUrl(imageRef.current);
    imageRef.current = null;
    setImage(null);
    setPreviewSrc("");
  };

  const closeAll = () => {
    resetEditor();
    setView("intro");
    setError("");
    setSaving(false);
    savingRef.current = false;
    onClose();
  };

  useEffect(() => {
    if (!open) {
      resetEditor();
      setView("intro");
      setError("");
      setSaving(false);
      savingRef.current = false;
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
      if (view === "editor") {
        resetEditor();
        setError("");
        setView("intro");
        return;
      }
      if (view === "camera") {
        setError("");
        setView("intro");
        return;
      }
      closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, view]);

  const openEditorFromBlob = async (blob) => {
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
    openEditorFromBlob(file);
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

  if (!open) return null;

  return (
    <>
      {view === "intro" && (
        <ProfilePhotoIntro
          error={error}
          onClose={closeAll}
          onUseCamera={() => {
            setError("");
            setView("camera");
          }}
          onUploadPhoto={() => fileInputRef.current?.click()}
        />
      )}

      {view === "camera" && (
        <ProfilePhotoCamera
          onClose={closeAll}
          onCancel={() => {
            setError("");
            setView("intro");
          }}
          onCapture={(blob) => openEditorFromBlob(blob)}
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
            setView("intro");
          }}
          onSave={handleSave}
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
