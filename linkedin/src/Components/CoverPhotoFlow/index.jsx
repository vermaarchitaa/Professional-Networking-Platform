import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import CoverPhotoMenu from "@/Components/CoverPhotoMenu";
import CoverPhotoEditor from "@/Components/CoverPhotoEditor";
import CoverPhotoPicker from "@/Components/CoverPhotoPicker";
import CoverDeleteDialog from "@/Components/CoverDeleteDialog";
import {
  BUILTIN_COVERS,
  createGradientCoverBlob,
  loadImageFromBlob,
  loadImageFromSrc,
  revokeImageUrl,
} from "@/Components/CoverPhotoFlow/coverUtils";
import { deleteCoverPicture, uploadCoverPicture } from "@/config/redux/action/profileAction";

export default function CoverPhotoFlow({ open, coverSrc, hasCover, onClose }) {
  const dispatch = useDispatch();
  const imageRef = useRef(null);
  const loadGenRef = useRef(0);
  const [view, setView] = useState("menu");
  const [returnView, setReturnView] = useState("menu");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setView("menu");
    setReturnView("menu");
    setDeleteOpen(false);
    setError("");
    setSaving(false);
    setDeleting(false);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      resetEditor();
      setView("menu");
      setReturnView("menu");
      setDeleteOpen(false);
      setError("");
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
        setDeleteOpen(false);
        return;
      }
      if (view === "editor") {
        resetEditor();
        setError("");
        setView(returnView);
        return;
      }
      if (view === "picker") {
        setError("");
        setView("menu");
        return;
      }
      closeAll();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, deleteOpen, view, returnView]);

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
      }
    }
  };

  const handleSave = async (file) => {
    setSaving(true);
    setError("");
    const result = await dispatch(uploadCoverPicture(file));
    setSaving(false);
    if (uploadCoverPicture.rejected.match(result)) {
      setError(result.payload?.message || "Failed to update cover photo");
      return;
    }
    closeAll();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    const result = await dispatch(deleteCoverPicture());
    setDeleting(false);
    if (deleteCoverPicture.rejected.match(result)) {
      setError(result.payload?.message || "Failed to delete cover photo");
      return;
    }
    closeAll();
  };

  if (!open) return null;

  return (
    <>
      {view === "menu" && (
        <CoverPhotoMenu
          coverSrc={coverSrc}
          hasCover={hasCover}
          error={!deleteOpen ? error : ""}
          onClose={closeAll}
          onEdit={() => openEditorFromSrc(hasCover ? coverSrc : "", "menu")}
          onChangePhoto={() => {
            setError("");
            setView("picker");
          }}
          onDelete={() => {
            setError("");
            setDeleteOpen(true);
          }}
        />
      )}

      {view === "picker" && (
        <CoverPhotoPicker
          error={error}
          onClose={() => {
            setError("");
            setView("menu");
          }}
          onUploadFile={(file) => openEditorFromBlob(file, "picker")}
          onChooseBuiltin={async (id) => {
            const cover = BUILTIN_COVERS.find((item) => item.id === id);
            if (!cover) return;
            try {
              const blob = await createGradientCoverBlob(cover.stops);
              await openEditorFromBlob(blob, "picker");
            } catch {
              setError("Could not open that cover image.");
            }
          }}
        />
      )}

      {view === "editor" && (
        <CoverPhotoEditor
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

      {deleteOpen && (
        <CoverDeleteDialog
          error={error}
          deleting={deleting}
          onCancel={() => {
            setError("");
            setDeleteOpen(false);
          }}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
