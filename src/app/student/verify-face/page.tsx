"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function VerifyFacePage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [status, setStatus] = useState(
    "Preparing face verification..."
  );

  const [cameraStarted, setCameraStarted] =
    useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [modelsLoaded, setModelsLoaded] =
    useState(false);

  // =====================================
  // CHECK STUDENT LOGIN
  // =====================================

  useEffect(() => {
    async function checkStudent() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/student/login");
        return;
      }
    }

    checkStudent();
  }, [router]);

  // =====================================
  // LOAD FACE RECOGNITION MODELS
  // =====================================

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        setStatus(
          "Loading face recognition models..."
        );

        // Load face-api only in the browser.
        const faceapi =
          await import("@vladmandic/face-api");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(
            "/models/face-api"
          ),

          faceapi.nets.faceLandmark68Net.loadFromUri(
            "/models/face-api"
          ),

          faceapi.nets.faceRecognitionNet.loadFromUri(
            "/models/face-api"
          ),
        ]);

        if (!cancelled) {
          setModelsLoaded(true);

          setStatus(
            "Face verification is ready. Please start your camera."
          );
        }
      } catch (error) {
        console.error(
          "Model loading error:",
          error
        );

        if (!cancelled) {
          setStatus(
            "Unable to load face recognition models."
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

  const startCamera = async () => {
    try {
      if (!modelsLoaded) {
        setStatus(
          "Please wait. Face recognition models are still loading..."
        );

        return;
      }

      setStatus(
        "Requesting camera access..."
      );

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
          },
          audio: false,
        });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }

      setCameraStarted(true);

      setStatus(
        "Camera is ready. Please look directly at the camera."
      );
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      setStatus(
        "Camera access failed. Please allow camera permission."
      );
    }
  };

  // =====================================
  // VERIFY FACE
  // =====================================

  const verifyFace = async () => {
    if (
      !videoRef.current ||
      !modelsLoaded
    ) {
      return;
    }

    try {
      setVerifying(true);

      setStatus(
        "Checking your registered face..."
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace(
          "/student/login"
        );

        return;
      }

      // =====================================
      // GET REGISTERED FACE DESCRIPTOR
      // =====================================

      const {
        data: student,
        error: studentError,
      } = await supabase
        .from("students")
        .select("face_descriptor")
        .eq(
          "user_id",
          user.id
        )
        .single();

      if (
        studentError ||
        !student
      ) {
        console.error(
          "Student data error:",
          studentError
        );

        setStatus(
          "Unable to find your registered face."
        );

        setVerifying(false);

        return;
      }

      if (
        !student.face_descriptor
      ) {
        setStatus(
          "No registered face was found for this account."
        );

        setVerifying(false);

        return;
      }

      // =====================================
      // LOAD FACE API IN THE BROWSER
      // =====================================

      const faceapi =
        await import(
          "@vladmandic/face-api"
        );

      // =====================================
      // DETECT LIVE FACE
      // =====================================

      setStatus(
        "Detecting your live face..."
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
          "No face detected. Please look directly at the camera and try again."
        );

        setVerifying(false);

        return;
      }

      // =====================================
      // CONVERT SAVED DESCRIPTOR
      // =====================================

      const registeredDescriptor =
        new Float32Array(
          student.face_descriptor
        );

      const liveDescriptor =
        detection.descriptor;

      // =====================================
      // CALCULATE FACE DISTANCE
      // =====================================

      const distance =
        faceapi.euclideanDistance(
          registeredDescriptor,
          liveDescriptor
        );

      console.log(
        "Face distance:",
        distance
      );

      // =====================================
      // FACE MATCH THRESHOLD
      //
      // Lower distance = better match
      // 0.6 is a common starting threshold
      // =====================================

      const FACE_MATCH_THRESHOLD =
        0.6;

      if (
        distance <=
        FACE_MATCH_THRESHOLD
      ) {
        setStatus(
          "✓ Face verified successfully! Entering examination..."
        );

        // Small delay so the student
        // can see the success message.
        setTimeout(() => {
          router.push(
            "/student/exam"
          );
        }, 1500);
      } else {
        setStatus(
          "✗ Face verification failed. Your face does not match the registered face. Please try again."
        );

        setVerifying(false);
      }
    } catch (error) {
      console.error(
        "Verification error:",
        error
      );

      setStatus(
        "Something went wrong during face verification."
      );

      setVerifying(false);
    }
  };

  // =====================================
  // STOP CAMERA WHEN LEAVING PAGE
  // =====================================

  useEffect(() => {
    return () => {
      if (
        videoRef.current?.srcObject
      ) {
        const stream =
          videoRef.current
            .srcObject as MediaStream;

        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }
    };
  }, []);

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
          maxWidth: "600px",
          background: "white",
          padding: "40px",
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
          Face Verification
        </h1>

        <p
          style={{
            color: "#4b5563",
            lineHeight: "1.6",
          }}
        >
          Please verify your identity
          before entering the examination.
        </p>

        <div
          style={{
            marginTop: "25px",
            background: "#111827",
            padding: "12px",
            borderRadius: "14px",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              borderRadius: "10px",
              display: "block",
              background: "#000",
            }}
          />
        </div>

        <p
          style={{
            marginTop: "20px",
            color: "#374151",
            fontWeight: "bold",
            lineHeight: "1.5",
          }}
        >
          {status}
        </p>

        {!cameraStarted ? (
          <button
            onClick={startCamera}
            disabled={!modelsLoaded}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background:
                modelsLoaded
                  ? "#2563eb"
                  : "#9ca3af",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              cursor:
                modelsLoaded
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {modelsLoaded
              ? "Start Camera"
              : "Loading Face Recognition..."}
          </button>
        ) : (
          <button
            onClick={verifyFace}
            disabled={verifying}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "10px",
              background:
                verifying
                  ? "#9ca3af"
                  : "#16a34a",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              cursor:
                verifying
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {verifying
              ? "Verifying..."
              : "Verify My Face"}
          </button>
        )}
      </div>
    </main>
  );
}