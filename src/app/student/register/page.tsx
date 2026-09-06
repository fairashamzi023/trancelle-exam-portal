"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentRegister() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [faceDescriptor, setFaceDescriptor] =
    useState<number[] | null>(null);

  const [faceImageBlob, setFaceImageBlob] =
    useState<Blob | null>(null);

  const [faceStatus, setFaceStatus] = useState(
    "Face registration not started."
  );

  const [cameraStarted, setCameraStarted] =
    useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  // ==========================
  // START CAMERA
  // ==========================

  const startCamera = async () => {
    try {
      setFaceStatus("Starting camera...");

      const stream =
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

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }

      setCameraStarted(true);

      setFaceStatus(
        "Camera ready. Position your face and click Capture Face."
      );
    } catch (error) {
      console.error("Camera error:", error);

      setFaceStatus(
        "❌ Camera access failed. Please allow camera permission."
      );
    }
  };

  // ==========================
  // CAPTURE FACE
  // ==========================

  const captureFace = async () => {
    if (!videoRef.current || !cameraStarted) {
      return;
    }

    try {
      setFaceStatus(
        "Loading face authentication..."
      );

      const faceapi =
        await import("@vladmandic/face-api");

      setFaceStatus(
        "Loading face authentication models..."
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

      setFaceStatus("Detecting your face...");

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
        setFaceStatus(
          "❌ No face detected. Look directly at the camera and try again."
        );

        return;
      }

      const descriptor = Array.from(
        detection.descriptor
      );

      // ==========================
      // CAPTURE CAMERA IMAGE
      // ==========================

      const video = videoRef.current;

      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        setFaceStatus(
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
        setFaceStatus(
          "❌ Unable to capture camera image."
        );

        return;
      }

      // Mirror the captured image so it matches
      // what the student sees in the camera.
      context.translate(canvas.width, 0);
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
              (blob) => resolve(blob),
              "image/jpeg",
              0.9
            );
          }
        );

      if (!imageBlob) {
        setFaceStatus(
          "❌ Unable to create face image."
        );

        return;
      }

      setFaceDescriptor(descriptor);
      setFaceImageBlob(imageBlob);

      setFaceStatus(
        "✓ Face captured successfully! You can now create your account."
      );
    } catch (error) {
      console.error(
        "Face capture error:",
        error
      );

      setFaceStatus(
        "❌ Could not capture face. Please try again."
      );
    }
  };

  // ==========================
  // REGISTER STUDENT
  // ==========================

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!faceDescriptor || !faceImageBlob) {
      alert(
        "Please start the camera and capture your face before creating your account."
      );
      return;
    }

    setLoading(true);

    try {
      // ==========================
      // CREATE SUPABASE AUTH USER
      // ==========================

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });

      if (error) {
        console.error(
          "Supabase signup error:",
          error
        );

        alert(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        alert(
          "Unable to create student account."
        );

        setLoading(false);
        return;
      }

      // IMPORTANT:
      // This is the Supabase Auth user ID.
      //
      // student_faces.student_id references
      // auth.users.id, NOT students.id.
      const userId = data.user.id;

      console.log(
        "Supabase Auth User ID:",
        userId
      );

      console.log(
        "Signup session:",
        data.session
      );

      // ==========================
      // CHECK LOGIN SESSION
      // ==========================

      const {
        data: sessionData,
      } = await supabase.auth.getSession();

      if (!sessionData.session) {
        alert(
          "Your account was created, but Supabase did not create a login session yet. Please check your email and confirm your account before face registration can be completed."
        );

        setLoading(false);
        return;
      }

      // ==========================
      // SAVE STUDENT INFORMATION
      // ==========================

      setFaceStatus(
        "Saving student information..."
      );

      const {
        data: student,
        error: studentError,
      } = await supabase
        .from("students")
        .insert({
          user_id: userId,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          face_descriptor: faceDescriptor,
        })
        .select("id")
        .single();

      if (studentError || !student) {
        console.error(
          "Student save error:",
          studentError
        );

        alert(
          "Account created, but student information could not be saved: " +
            (studentError?.message ||
              "Unknown error")
        );

        setLoading(false);
        return;
      }

      console.log(
        "Student table row created:",
        student
      );

      // ==========================
      // UPLOAD FACE IMAGE
      // ==========================

      setFaceStatus(
        "Uploading your face image..."
      );

      const filePath =
        `${userId}/face-${Date.now()}.jpg`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("student-faces")
        .upload(
          filePath,
          faceImageBlob,
          {
            contentType: "image/jpeg",
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "Face image upload error:",
          uploadError
        );

        alert(
          "Student account was created, but the face image could not be uploaded: " +
            uploadError.message
        );

        setLoading(false);
        return;
      }

      console.log(
        "Face image uploaded:",
        filePath
      );

      // ==========================
      // GET PUBLIC IMAGE URL
      // ==========================

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("student-faces")
        .getPublicUrl(filePath);

      const faceImageUrl =
        publicUrlData.publicUrl;

      console.log(
        "Face image URL:",
        faceImageUrl
      );

      // ==========================
      // SAVE FACE RECORD
      // ==========================

      setFaceStatus(
        "Saving face registration..."
      );

      const {
        error: faceInsertError,
      } = await supabase
        .from("student_faces")
        .insert({
          // IMPORTANT:
          // Use the Supabase Auth user ID here.
          //
          // DO NOT use:
          // student.id
          //
          // student_faces.student_id references
          // auth.users.id.
          student_id: userId,

          face_embedding: faceDescriptor,

          face_image_url: faceImageUrl,
        });

      if (faceInsertError) {
        console.error(
          "Student face insert error:",
          faceInsertError
        );

        alert(
          "Student account was created, but the face registration could not be saved: " +
            faceInsertError.message
        );

        setLoading(false);
        return;
      }

      console.log(
        "Face registration saved successfully."
      );

      // ==========================
      // SUCCESS
      // ==========================

      setFaceStatus(
        "✓ Face registered successfully!"
      );

      alert(
        "Student account and face registered successfully! You can now log in."
      );

      // Stop camera
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        streamRef.current = null;
      }

      // Go to login
      window.location.href =
        "/student/login";
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      alert(
        "Something went wrong while creating your account."
      );

      setLoading(false);
    }
  };

  return (
    <main className="portalPage">
      <Link
        href="/student"
        className="backLink"
      >
        ← Back to Student Portal
      </Link>

      <section className="registerContainer">
        <div className="portalHeader">
          <p>TRANCELLE INTERNATIONAL ACADEMY</p>

          <h1>Student Registration</h1>

          <span>
            Create your student account
          </span>
        </div>

        <form
          className="registerForm"
          onSubmit={handleRegister}
        >
          {/* FULL NAME */}

          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
              )
            }
            required
          />

          {/* EMAIL */}

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
          />

          {/* PHONE */}

          <label>Phone Number</label>

          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
            required
          />

          {/* FACE REGISTRATION */}

          <label>Face Registration</label>

          <div
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "12px",
              padding: "15px",
              background: "#f8fafc",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                maxWidth: "400px",
                display: "block",
                margin: "0 auto",
                borderRadius: "10px",
                background: "#000",
              }}
            />

            <p
              style={{
                textAlign: "center",
                marginTop: "10px",
                color: faceDescriptor
                  ? "#16a34a"
                  : "#6b7280",
                fontWeight: "bold",
              }}
            >
              {faceStatus}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {/* START CAMERA */}

              <button
                type="button"
                onClick={startCamera}
                disabled={cameraStarted}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    cameraStarted
                      ? "#9ca3af"
                      : "#374151",
                  color: "white",
                  fontWeight: "bold",
                  cursor:
                    cameraStarted
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {cameraStarted
                  ? "Camera Started"
                  : "Start Camera"}
              </button>

              {/* CAPTURE FACE */}

              <button
                type="button"
                onClick={captureFace}
                disabled={!cameraStarted}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    cameraStarted
                      ? "#2563eb"
                      : "#9ca3af",
                  color: "white",
                  fontWeight: "bold",
                  cursor:
                    cameraStarted
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Capture Face
              </button>
            </div>
          </div>

          {/* CREATE PASSWORD */}

          <label>Create Password</label>

          <div
            style={{
              position: "relative",
              width: "100%",
            }}
          >
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Create a secure password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                paddingRight:
                  password
                    ? "55px"
                    : undefined,
              }}
            />

            {password && (
              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                style={{
                  all: "unset",
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  color: "#374151",
                  width: "24px",
                  height: "24px",
                  zIndex: 10,
                }}
              >
                {showPassword ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5.52 0 9.27 5.24 10 8-.37 1.48-1.53 3.47-3.36 5.08" />
                    <path d="M6.61 6.61C4.62 8.16 3.28 10.3 2 12c.73 2.76 4.48 8 10 8 1.06 0 2.08-.19 3.03-.54" />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* CONFIRM PASSWORD */}

          <label>Confirm Password</label>

          <div
            style={{
              position: "relative",
              width: "100%",
            }}
          >
            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                paddingRight:
                  confirmPassword
                    ? "55px"
                    : undefined,
              }}
            />

            {confirmPassword && (
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) =>
                      !previous
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
                style={{
                  all: "unset",
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  color: "#374151",
                  width: "24px",
                  height: "24px",
                  zIndex: 10,
                }}
              >
                {showConfirmPassword ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5.52 0 9.27 5.24 10 8-.37 1.48-1.53 3.47-3.36 5.08" />
                    <path d="M6.61 6.61C4.62 6.61 4.62 6.61 2 12c.73 2.76 4.48 8 10 8 1.06 0 2.08-.19 3.03-.54" />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* CREATE ACCOUNT */}

          <button
            type="submit"
            className="portalAction"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Student Account →"}
          </button>
        </form>

        <p className="loginRedirect">
          Already have an account?{" "}
          <Link href="/student/login">
            Login here
          </Link>
        </p>
      </section>
    </main>
  );
}
