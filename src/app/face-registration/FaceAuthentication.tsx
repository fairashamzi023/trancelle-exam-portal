"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";

type FaceAuthenticationProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onAuthenticated: () => void;
};

export default function FaceAuthentication({
  videoRef,
  onAuthenticated,
}: FaceAuthenticationProps) {
  const [status, setStatus] = useState(
    "Loading face authentication..."
  );

  const authenticatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        setStatus("Loading face authentication models...");

        await faceapi.nets.tinyFaceDetector.loadFromUri(
          "/models/face-api"
        );

        await faceapi.nets.faceLandmark68Net.loadFromUri(
          "/models/face-api"
        );

        await faceapi.nets.faceRecognitionNet.loadFromUri(
          "/models/face-api"
        );

        if (!cancelled) {
          setStatus(
            "✓ Face authentication models loaded"
          );
        }
      } catch (error) {
        console.error(
          "Face authentication model error:",
          error
        );

        if (!cancelled) {
          setStatus(
            "❌ Unable to load face authentication models"
          );
        }
      }
    }

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authenticatedRef.current) {
      return;
    }

    const interval = setInterval(async () => {
      const video = videoRef.current;

      if (
        !video ||
        video.readyState < 2 ||
        authenticatedRef.current
      ) {
        return;
      }

      try {
        const detection =
          await faceapi
            .detectSingleFace(
              video,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
          setStatus(
            "⚠️ Please position your face in the camera"
          );

          return;
        }

        authenticatedRef.current = true;

        setStatus(
          "✓ Face detected"
        );

        onAuthenticated();
      } catch (error) {
        console.error(
          "Face detection error:",
          error
        );
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [videoRef, onAuthenticated]);

  return (
    <div
      style={{
        marginTop: "10px",
        padding: "10px",
        borderRadius: "8px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        fontSize: "13px",
        fontWeight: "bold",
        color: "#374151",
      }}
    >
      🔐 {status}
    </div>
  );
}