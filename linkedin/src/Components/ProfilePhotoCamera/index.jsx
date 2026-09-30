import React, { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/Components/CoverPhotoFlow/icons";
import { captureVideoFrame, stopMediaStream } from "@/Components/ProfilePhotoFlow/photoUtils";
import styles from "./styles.module.css";

export default function ProfilePhotoCamera({ onClose, onCancel, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState("Requesting camera access...");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const startStream = async (nextDeviceId) => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    setReady(false);
    setError("");
    setStatus("Starting camera...");

    const constraints = {
      video: nextDeviceId ? { deviceId: { exact: nextDeviceId } } : { facingMode: "user" },
      audio: false,
    };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
      setStatus("");

      const inputs = await navigator.mediaDevices.enumerateDevices();
      const cameras = inputs.filter((item) => item.kind === "videoinput");
      setDevices(cameras);
      const currentId = stream.getVideoTracks()[0]?.getSettings()?.deviceId || nextDeviceId || cameras[0]?.deviceId || "";
      setDeviceId(currentId);
    } catch (err) {
      stopMediaStream(stream || streamRef.current);
      streamRef.current = null;
      throw err;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not supported in this browser.");
        setStatus("");
        return;
      }
      try {
        await startStream("");
        if (cancelled) {
          stopMediaStream(streamRef.current);
          streamRef.current = null;
        }
      } catch (err) {
        if (cancelled) return;
        const denied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
        const missing = err?.name === "NotFoundError" || err?.name === "OverconstrainedError";
        setReady(false);
        setStatus("");
        if (denied) {
          setError("Camera permission was denied. Allow camera access to take a photo, or upload a file instead.");
        } else if (missing) {
          setError("No camera was found. You can upload a photo instead.");
        } else {
          setError("Could not start the camera. Check permissions and try again.");
        }
      }
    };

    boot();
    return () => {
      cancelled = true;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const handleDeviceChange = async (event) => {
    const nextId = event.target.value;
    setDeviceId(nextId);
    try {
      await startStream(nextId);
    } catch {
      setError("Could not switch cameras.");
    }
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !ready || capturing) return;
    setCapturing(true);
    try {
      const blob = await captureVideoFrame(video);
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      onCapture(blob);
    } catch {
      setError("Could not capture this photo. Try again.");
      setCapturing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-title"
      >
        <header className={styles.header}>
          <h2 id="camera-title">Take a photo</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.preview}>
          <video ref={videoRef} className={styles.video} playsInline muted autoPlay style={{ display: ready ? "block" : "none" }} />
          {!ready ? <p className={styles.status}>{error || status || "Camera unavailable"}</p> : null}
        </div>

        {error && ready ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.controls}>
          {devices.length > 1 ? (
            <label className={styles.deviceLabel}>
              Camera
              <select value={deviceId} onChange={handleDeviceChange} disabled={!ready}>
                {devices.map((device, index) => (
                  <option key={device.deviceId || index} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          ) : <span />}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={styles.captureBtn} onClick={handleCapture} disabled={!ready || capturing}>
              {capturing ? "Capturing..." : "Take photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
