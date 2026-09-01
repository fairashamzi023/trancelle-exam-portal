"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { supabase } from "@/lib/supabase";

export default function CameraPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);

  const [cameraReady, setCameraReady] = useState(false);

  const [personCount, setPersonCount] =
    useState<number | null>(null);

  const [status, setStatus] =
    useState("Checking login...");

  const [authenticated, setAuthenticated] =
    useState(false);

  // ===============================
  // SUPABASE LOGIN PROTECTION
  // ===============================

  useEffect(() => {
    async function checkLogin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/student/login");
        return;
      }

      setAuthenticated(true);
    }

    checkLogin();
  }, [router]);

  // ===============================
  // CAMERA + PERSON DETECTION
  // ===============================

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    let stream: MediaStream | null = null;

    let detectionInterval:
      | ReturnType<typeof setInterval>
      | null = null;

    let cancelled = false;

    async function startCameraAndDetection() {
      try {
        setStatus("Loading TensorFlow...");

        // Initialize TensorFlow.js backend
        await tf.ready();

        if (cancelled) {
          return;
        }

        console.log(
          "TensorFlow backend:",
          tf.getBackend()
        );

        setStatus(
          "Loading person detection..."
        );

        const model =
          await cocoSsd.load();

        if (cancelled) {
          return;
        }

        setStatus(
          "Starting camera..."
        );

        stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

        if (cancelled) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          await new Promise<void>(
            (resolve) => {
              videoRef.current?.addEventListener(
                "loadeddata",
                () => resolve(),
                {
                  once: true,
                }
              );
            }
          );
        }

        setCameraReady(true);

        setStatus(
          "Checking for a person..."
        );

        detectionInterval =
          setInterval(async () => {
            if (
              cancelled ||
              !videoRef.current ||
              videoRef.current.readyState < 2
            ) {
              return;
            }

            try {
              const predictions =
                await model.detect(
                  videoRef.current
                );

              const people =
                predictions.filter(
                  (prediction) =>
                    prediction.class ===
                      "person" &&
                    prediction.score >= 0.6
                );

              if (cancelled) {
                return;
              }

              setPersonCount(
                people.length
              );

              if (
                people.length === 1
              ) {
                setStatus(
                  "One person detected. You are ready for the exam."
                );
              } else if (
                people.length === 0
              ) {
                setStatus(
                  "No person detected. Please sit in front of the camera."
                );
              } else {
                setStatus(
                  "Multiple people detected. Only one student may be present."
                );
              }
            } catch (error) {
              console.error(
                "Person detection error:",
                error
              );

              if (!cancelled) {
                setStatus(
                  "Person detection failed. Please check the browser console."
                );
              }
            }
          }, 1000);
      } catch (error) {
        console.error(
          "Camera or detection startup error:",
          error
        );

        if (cancelled) {
          return;
        }

        if (
          error instanceof DOMException
        ) {
          if (
            error.name ===
            "NotAllowedError"
          ) {
            setStatus(
              "Camera permission was denied. Please allow camera access in your browser settings."
            );
          } else if (
            error.name ===
            "NotFoundError"
          ) {
            setStatus(
              "No camera was found on this device."
            );
          } else if (
            error.name ===
            "NotReadableError"
          ) {
            setStatus(
              "Your camera is being used by another application. Please close Zoom, Meet, Teams, or other camera apps."
            );
          } else {
            setStatus(
              `Camera error: ${error.name} - ${error.message}`
            );
          }
        } else if (
          error instanceof Error
        ) {
          setStatus(
            `Detection system error: ${error.message}`
          );
        } else {
          setStatus(
            "An unknown error occurred while starting the camera."
          );
        }
      }
    }

    startCameraAndDetection();

    return () => {
      cancelled = true;

      if (detectionInterval) {
        clearInterval(
          detectionInterval
        );
      }

      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, [authenticated]);

  // ===============================
  // READY CHECK
  // ===============================

  const readyForExam =
    cameraReady &&
    personCount === 1;

  // ===============================
  // PAGE
  // ===============================

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.1)",
          textAlign: "center",
          color: "#111827",
        }}
      >
        <h1>
          Camera & Person Check
        </h1>

        <p>
          Please sit alone in front of
          the camera before starting
          your exam.
        </p>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            borderRadius: "12px",
            marginTop: "20px",
            background: "#000",
          }}
        />

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "10px",
            background:
              readyForExam
                ? "#dcfce7"
                : "#fef2f2",
            color: "#111827",
            fontWeight: "600",
          }}
        >
          {status}
        </div>

        {personCount !== null && (
          <p
            style={{
              marginTop: "12px",
              color: "#374151",
            }}
          >
            Persons detected:{" "}
            {personCount}
          </p>
        )}

        <button
          disabled={!readyForExam}
          onClick={() => {
            router.push(
              "/student/exam"
            );
          }}
          style={{
            marginTop: "15px",
            padding: "12px 25px",
            border: "none",
            borderRadius: "8px",
            background:
              readyForExam
                ? "#2563eb"
                : "#9ca3af",
            color: "white",
            fontSize: "16px",
            fontWeight: "600",
            cursor:
              readyForExam
                ? "pointer"
                : "not-allowed",
          }}
        >
          Continue to Exam
        </button>
      </div>
    </main>
  );
}