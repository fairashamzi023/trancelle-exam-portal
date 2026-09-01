"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as faceapi from "@vladmandic/face-api";
import { supabase } from "@/lib/supabase";

export default function FaceRegistrationPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [status, setStatus] = useState(
    "Loading face recognition models..."
  );

  const [modelsLoaded, setModelsLoaded] =
    useState(false);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  // =====================================
  // LOAD FACE API MODELS
  // =====================================

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        setStatus(
          "Loading face recognition models..."
        );

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
          setModelsLoaded(true);

          setStatus(
            "Face recognition system ready. Starting camera..."
          );
        }
      } catch (error) {
        console.error(
          "Face model loading error:",
          error
        );

        if (!cancelled) {
          setStatus(
            "❌ Unable to load face recognition models."
          );
        }
      }
    }

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================
  // START CAMERA
  // =====================================

  useEffect(() => {
    if (!modelsLoaded) {
      return;
    }

    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        setStatus(
          "Requesting camera access..."
        );

        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: {
                ideal: 640,
              },
              height: {
                ideal: 480,
              },
            },
            audio: false,
          });

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await videoRef.current.play();

          setCameraReady(true);

          setStatus(
            "Camera ready. Position your face clearly."
          );
        }
      } catch (error) {
        console.error(
          "Camera error:",
          error
        );

        setStatus(
          "❌ Unable to access camera. Please allow camera permission."
        );
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, [modelsLoaded]);

  // =====================================
  // REGISTER FACE
  // =====================================

  const registerFace = async () => {
    if (
      !videoRef.current ||
      !cameraReady ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      setStatus(
        "Scanning your face..."
      );

      const detection =
        await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      if (!detection) {
        setStatus(
          "⚠️ No face detected. Please look directly at the camera."
        );

        return;
      }

      // Convert Float32Array into a normal array
      // so Supabase can store it as JSONB.
      const faceDescriptor =
        Array.from(
          detection.descriptor
        );

      setStatus(
        "Saving your face registration..."
      );

      // =====================================
      // GET LOGGED-IN STUDENT
      // =====================================

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setStatus(
          "❌ Your login session was not found."
        );

        return;
      }

      // =====================================
      // SAVE FACE DESCRIPTOR
      // =====================================

      const {
        error: updateError,
      } =
        await supabase
          .from("students")
          .update({
            face_descriptor:
              faceDescriptor,
          })
          .eq(
            "user_id",
            user.id
          );

      if (updateError) {
        console.error(
          "Face save error:",
          updateError
        );

        setStatus(
          `❌ Unable to save your face: ${updateError.message}`
        );

        return;
      }

      setStatus(
        "✓ Face registered successfully!"
      );

      // Give the student a moment to see success
      setTimeout(() => {
        router.push(
          "/student/camera"
        );
      }, 1200);
    } catch (error) {
      console.error(
        "Face registration error:",
        error
      );

      setStatus(
        "❌ Face registration failed. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // PAGE
  // =====================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "white",
          padding: "35px",
          borderRadius: "18px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.12)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#2563eb",
            fontWeight: "bold",
            letterSpacing: "2px",
            fontSize: "13px",
          }}
        >
          TRANCELLE INTERNATIONAL ACADEMY
        </p>

        <h1>
          Face Registration
        </h1>

        <p
          style={{
            color: "#4b5563",
            lineHeight: "1.6",
          }}
        >
          Please position your face clearly
          in front of the camera.
        </p>

        <div
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            background: "#111827",
            borderRadius: "14px",
            overflow: "hidden",
            marginTop: "20px",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "10px",
            background: "#f8fafc",
            border:
              "1px solid #e2e8f0",
            color: "#374151",
            fontWeight: "600",
          }}
        >
          🔐 {status}
        </div>

        <button
          onClick={
            registerFace
          }
          disabled={
            !cameraReady ||
            !modelsLoaded ||
            saving
          }
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "15px",
            border: "none",
            borderRadius: "10px",
            background:
              cameraReady &&
              modelsLoaded &&
              !saving
                ? "#2563eb"
                : "#9ca3af",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor:
              cameraReady &&
              modelsLoaded &&
              !saving
                ? "pointer"
                : "not-allowed",
          }}
        >
          {saving
            ? "Registering Face..."
            : "Register My Face"}
        </button>
      </div>
    </main>
  );
}