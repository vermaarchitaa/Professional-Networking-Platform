import React, { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/Components/CoverPhotoFlow/icons";
import { captureVideoFrame } from "@/Components/ProfilePhotoFlow/photoUtils";
import styles from "./styles.module.css";

function cameraErrorMessage(err, permissionState) {
  const name = err?.name;
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    if (permissionState === "denied") {
      return "Camera access is blocked for this site. Enable camera permission for localhost in Chrome settings, then try again.";
    }
    return "Camera access was denied. Please allow camera access in your browser settings and try again.";
  }
  if (name === "NotFoundError") {
    return "No camera was found. You can upload a photo instead.";
  }
  if (name === "OverconstrainedError") {
    return "This camera could not be started. Try another camera if one is available.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is already in use by another app or tab. Close it and try again.";
  }
  if (name === "SecurityError") {
    return "This browser blocked camera access. Use localhost or HTTPS and try again.";
  }
  return "Could not start the camera. Check permissions and try again.";
}

async function readCameraPermissionState() {
  try {
    const status = await navigator.permissions.query({ name: "camera" });
    return status.state;
  } catch {
    return "";
  }
}

function stopTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function ProfilePhotoCamera({ initialRequest, onClose, onCancel, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(0);
  const inflightRef = useRef(null);
  const initialRequestRef = useRef(initialRequest);
  const [cameraKey, setCameraKey] = useState(0);
  const [preferredDeviceId, setPreferredDeviceId] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [status, setStatus] = useState("Waiting for camera permission...");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const session = ++sessionRef.current;
    let acquired = null;
    const requestKey = `${cameraKey}|${preferredDeviceId}`;

    const isCurrent = () => sessionRef.current === session;

    const releaseIfOwned = (stream) => {
      stopTracks(stream);
      if (streamRef.current === stream) streamRef.current = null;
      if (videoRef.current && videoRef.current.srcObject === stream) {
        videoRef.current.srcObject = null;
      }
    };

    const run = async () => {
      setReady(false);
      setCapturing(false);
      setError("");
      setStatus(preferredDeviceId ? "Starting camera..." : "Waiting for camera permission...");

      if (!navigator.mediaDevices?.getUserMedia && !initialRequestRef.current) {
        if (!isCurrent()) return;
        setStatus("");
        setError("Camera is not supported in this browser.");
        return;
      }

      try {
        let inflight = inflightRef.current;
        if (!inflight || inflight.key !== requestKey) {
          const useInitial = !preferredDeviceId && cameraKey === 0 && initialRequestRef.current;
          const promise = useInitial
            ? initialRequestRef.current
            : navigator.mediaDevices.getUserMedia({
              video: preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : true,
              audio: false,
            });
          if (useInitial) initialRequestRef.current = null;
          inflight = { key: requestKey, promise };
          inflightRef.current = inflight;
        }

        const stream = await inflight.promise;
        acquired = stream;

        if (!isCurrent()) {
          acquired = null;
          const leftover = stream;
          queueMicrotask(() => {
            if (streamRef.current !== leftover) stopTracks(leftover);
          });
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          if (!isCurrent()) {
            releaseIfOwned(stream);
            acquired = null;
            return;
          }
          throw new Error("Camera preview is unavailable.");
        }

        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");

        if (!isCurrent()) {
          releaseIfOwned(stream);
          acquired = null;
          return;
        }

        setReady(true);
        setStatus("");
        setError("");

        try {
          await video.play();
        } catch (playErr) {
          if (!isCurrent()) return;
          if (playErr?.name === "AbortError") return;
          if (video.srcObject === stream && video.readyState >= 2) return;
          throw playErr;
        }

        if (!isCurrent()) return;
        if (video.srcObject !== stream) return;

        try {
          const inputs = await navigator.mediaDevices.enumerateDevices();
          if (!isCurrent() || streamRef.current !== stream) return;
          const cameras = inputs.filter((item) => item.kind === "videoinput");
          setDevices(cameras);
          const currentId = stream.getVideoTracks()[0]?.getSettings()?.deviceId || preferredDeviceId || cameras[0]?.deviceId || "";
          setDeviceId(currentId);
        } catch {
          /* Device labels are optional; keep the live preview. */
        }
      } catch (err) {
        releaseIfOwned(acquired);
        acquired = null;
        if (inflightRef.current?.key === requestKey) inflightRef.current = null;
        if (!isCurrent()) return;
        setReady(false);
        setStatus("");
        let permissionState = "";
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          permissionState = await readCameraPermissionState();
          if (!isCurrent()) return;
        }
        const message = cameraErrorMessage(err, permissionState);
        if (message) setError(message);
      }
    };

    run();

    return () => {
      if (sessionRef.current === session) {
        sessionRef.current += 1;
      }
      if (acquired && inflightRef.current?.key === requestKey) {
        inflightRef.current = null;
      }
      releaseIfOwned(acquired);
      acquired = null;
    };
  }, [cameraKey, preferredDeviceId]);

  const handleRetry = () => {
    sessionRef.current += 1;
    stopTracks(streamRef.current);
    streamRef.current = null;
    inflightRef.current = null;
    initialRequestRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPreferredDeviceId("");
    setReady(false);
    setError("");
    setStatus("Waiting for camera permission...");
    setCameraKey((key) => key + 1);
  };

  const handleDeviceChange = (event) => {
    setPreferredDeviceId(event.target.value);
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !ready || capturing) return;
    setCapturing(true);
    try {
      const blob = await captureVideoFrame(video);
      sessionRef.current += 1;
      stopTracks(stream);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      onCapture(blob);
    } catch {
      setError("Could not capture this photo. Try again.");
      setCapturing(false);
    }
  };

  const handleCancel = () => {
    sessionRef.current += 1;
    stopTracks(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    onCancel();
  };

  const handleClose = () => {
    sessionRef.current += 1;
    stopTracks(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-title"
      >
        <header className={styles.header}>
          <h2 id="camera-title">Take a photo</h2>
          <button type="button" className={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.preview}>
          <video
            ref={videoRef}
            className={styles.video}
            playsInline
            muted
            autoPlay
          />
          {!ready ? (
            <div className={styles.statusBox}>
              <p className={styles.status}>{error || status || "Camera unavailable"}</p>
              {error ? (
                <button type="button" className={styles.retryBtn} onClick={handleRetry}>
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}
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
            <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
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
