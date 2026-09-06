"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function FaceRegistrationPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const faceApiRef = useRef<any>(null);

  const [status, setStatus] = useState(
    "Loading face recognition system..."
  );

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [saving, setSaving] = useState(false);

  // =====================================
  // LOAD FACE API ONLY IN BROWSER
  // =====================================

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        setStatus("Loading face recognition models...");

        // IMPORTANT:
        // Dynamic import prevents the Vercel TextEncoder
        // error during server-side prerendering.
        const faceapi = await import("@vladmandic/face-api");

        if (cancelled) return;

        faceApiRef.current = faceapi;

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
        console.error("Face model loading error:", error);

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
    if (!modelsLoaded) return;

    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        setStatus("Requesting camera access...");

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
          videoRef.current.srcObject = stream;

          await videoRef.current.play();

          setCameraReady(true);

          setStatus(
            "Camera ready. Position your face clearly."
          );
        }
      } catch (error) {
        console.error("Camera error:", error);

        setStatus(
          "❌ Unable to access camera. Please allow camera permission."
        );
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
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
      !modelsLoaded ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      setStatus("Scanning your face...");

      const faceapi = faceApiRef.current;

      if (!faceapi) {
        setStatus(
          "❌ Face recognition system is not ready."
        );
        return;
      }

      // =====================================
      // DETECT FACE
      // =====================================

      const detection =
        await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.5,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

      if (!detection) {
        setStatus(
          "⚠️ No face detected. Please look directly at the camera."
        );

        return;
      }

      // =====================================
      // CONVERT FACE DESCRIPTOR
      // =====================================

      const faceDescriptor = Array.from(
        detection.descriptor
      );

      // =====================================
      // GET LOGGED-IN USER
      // =====================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus(
          "❌ Your login session was not found."
        );

        return;
      }

      // =====================================
      // GET STUDENT RECORD
      // =====================================

      const {
        data: student,
        error: studentError,
      } = await supabase
        .from("students")
        .select("id, user_id")
        .eq("user_id", user.id)
        .single();

      if (studentError || !student) {
        console.error(
          "Student lookup error:",
          studentError
        );

        setStatus(
          "❌ Student account could not be found."
        );

        return;
      }

      // =====================================
      // CAPTURE FACE IMAGE
      // =====================================

      setStatus("Capturing your face image...");

      const video = videoRef.current;

      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        setStatus(
          "❌ Camera image is not ready. Please try again."
        );

        return;
      }

      const canvas =
        document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        setStatus(
          "❌ Unable to capture camera image."
        );

        return;
      }

      // Mirror the image so it looks like the
      // student's camera preview.
      context.translate(
        canvas.width,
        0
      );
      context.scale(-1, 1);

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageBlob =
        await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              (blob) =>
                resolve(blob),
              "image/jpeg",
              0.9
            );
          }
        );

      if (!imageBlob) {
        setStatus(
          "❌ Unable to create face image."
        );

        return;
      }

      // =====================================
      // UPLOAD FACE IMAGE TO SUPABASE STORAGE
      // =====================================

      setStatus(
        "Uploading your face image..."
      );

      const filePath =
        `${user.id}/face-${Date.now()}.jpg`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("student-faces")
        .upload(
          filePath,
          imageBlob,
          {
            contentType:
              "image/jpeg",
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "Face image upload error:",
          uploadError
        );

        setStatus(
          `❌ Face image upload failed: ${uploadError.message}`
        );

        return;
      }

      // =====================================
      // GET PUBLIC IMAGE URL
      // =====================================

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("student-faces")
        .getPublicUrl(filePath);

      const faceImageUrl =
        publicUrlData.publicUrl;

      // =====================================
      // SAVE DESCRIPTOR IN STUDENTS TABLE
      // =====================================

      setStatus(
        "Saving face registration..."
      );

      const {
        error: studentUpdateError,
      } = await supabase
        .from("students")
        .update({
          face_descriptor:
            faceDescriptor,
        })
        .eq(
          "user_id",
          user.id
        );

      if (studentUpdateError) {
        console.error(
          "Student face descriptor error:",
          studentUpdateError
        );

        setStatus(
          `❌ Unable to save face descriptor: ${studentUpdateError.message}`
        );

        return;
      }

      // =====================================
      // REMOVE OLD FACE REGISTRATION
      // =====================================

      const {
        error: deleteError,
      } = await supabase
        .from("student_faces")
        .delete()
        .eq(
          "student_id",
          student.id
        );

      if (deleteError) {
        console.error(
          "Old face deletion error:",
          deleteError
        );
      }

      // =====================================
      // SAVE FACE IN STUDENT_FACES
      // =====================================

      const {
        error: faceInsertError,
      } = await supabase
        .from("student_faces")
        .insert({
          student_id:
            student.id,
          face_embedding:
            faceDescriptor,
          face_image_url:
            faceImageUrl,
        });

      if (faceInsertError) {
        console.error(
          "Student face insert error:",
          faceInsertError
        );

        setStatus(
          `❌ Unable to save face registration: ${faceInsertError.message}`
        );

        return;
      }

      // =====================================
      // SUCCESS
      // =====================================

      setStatus(
        "✓ Face registered successfully!"
      );

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
              transform:
                "scaleX(-1)",
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
          onClick={registerFace}
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