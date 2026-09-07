"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const questions = [
  {
    question: "Which part of the mind contains thoughts and memories that are currently in awareness?",
    options: ["Conscious", "Unconscious", "Preconscious", "Id"],
  },
  {
    question: "According to Freud, which part of personality operates according to the pleasure principle?",
    options: ["Ego", "Superego", "Id", "Conscious"],
  },
  {
    question: "Which part of Freud's personality structure follows the reality principle?",
    options: ["Id", "Ego", "Superego", "Unconscious"],
  },
  {
    question: "The superego mainly represents:",
    options: [
      "Basic instincts",
      "Reality",
      "Moral standards",
      "Conscious memories",
    ],
  },
  {
    question: "According to Freud's iceberg model, the largest part of the mind is:",
    options: [
      "Conscious",
      "Preconscious",
      "Unconscious",
      "Ego",
    ],
  },
  {
    question: "Which of the following is an example of a defense mechanism?",
    options: [
      "Repression",
      "Learning",
      "Motivation",
      "Perception",
    ],
  },
  {
    question: "Repression involves:",
    options: [
      "Changing behavior through rewards",
      "Pushing disturbing thoughts out of awareness",
      "Remembering every experience",
      "Increasing motivation",
    ],
  },
  {
    question: "Which psychological process involves interpreting sensory information?",
    options: [
      "Motivation",
      "Perception",
      "Emotion",
      "Learning",
    ],
  },
  {
    question: "Self-concept refers to:",
    options: [
      "How a person views themselves",
      "How society views a person",
      "A person's intelligence score",
      "A person's unconscious mind",
    ],
  },
  {
    question: "Self-esteem refers to:",
    options: [
      "A person's memory",
      "A person's evaluation of their own worth",
      "A person's physical strength",
      "A person's level of intelligence",
    ],
  },
  {
    question: "Which theory emphasizes unconscious conflicts and early childhood experiences?",
    options: [
      "Behaviorism",
      "Psychoanalytic theory",
      "Humanistic theory",
      "Cognitive theory",
    ],
  },
  {
    question: "Who developed psychoanalytic theory?",
    options: [
      "Carl Rogers",
      "B.F. Skinner",
      "Sigmund Freud",
      "Jean Piaget",
    ],
  },
  {
    question: "Which of the following is associated with the humanistic approach?",
    options: [
      "Self-actualization",
      "Conditioning",
      "Unconscious conflict",
      "Reinforcement",
    ],
  },
  {
    question: "Carl Rogers emphasized the importance of:",
    options: [
      "Unconscious drives",
      "Unconditional positive regard",
      "Punishment",
      "Dream analysis",
    ],
  },
  {
    question: "Abraham Maslow is best known for:",
    options: [
      "Hierarchy of needs",
      "Classical conditioning",
      "Psychoanalysis",
      "Cognitive dissonance",
    ],
  },
  {
    question: "In Maslow's hierarchy, the most basic needs are:",
    options: [
      "Esteem needs",
      "Social needs",
      "Physiological needs",
      "Self-actualization",
    ],
  },
  {
    question: "Which approach focuses mainly on observable behavior?",
    options: [
      "Behaviorism",
      "Psychoanalysis",
      "Humanism",
      "Gestalt psychology",
    ],
  },
  {
    question: "Classical conditioning is strongly associated with:",
    options: [
      "Ivan Pavlov",
      "Sigmund Freud",
      "Carl Rogers",
      "Abraham Maslow",
    ],
  },
  {
    question: "Operant conditioning is mainly associated with:",
    options: [
      "B.F. Skinner",
      "Sigmund Freud",
      "Carl Jung",
      "Carl Rogers",
    ],
  },
  {
    question: "Positive reinforcement involves:",
    options: [
      "Adding a pleasant consequence to increase behavior",
      "Removing a pleasant consequence",
      "Adding punishment",
      "Ignoring behavior",
    ],
  },
  {
    question: "Memory refers to the ability to:",
    options: [
      "Interpret emotions",
      "Encode, store, and retrieve information",
      "Control reflexes",
      "Change personality",
    ],
  },
  {
    question: "Which type of memory holds information for a very short period?",
    options: [
      "Long-term memory",
      "Short-term memory",
      "Procedural memory",
      "Semantic memory",
    ],
  },
  {
    question: "Learning is best described as:",
    options: [
      "A relatively permanent change in behavior or knowledge",
      "A temporary emotional reaction",
      "A biological reflex",
      "A personality disorder",
    ],
  },
  {
    question: "Motivation refers to:",
    options: [
      "Forces that initiate and direct behavior",
      "Memory storage",
      "Sensory processing",
      "Dream interpretation",
    ],
  },
  {
    question: "Emotion generally involves:",
    options: [
      "Only physical reactions",
      "Only thoughts",
      "Feelings, physiological responses, and behavior",
      "Only memory",
    ],
  },
  {
    question: "Stress is commonly described as:",
    options: [
      "A response to perceived demands or threats",
      "A type of memory",
      "A personality trait",
      "A learning style",
    ],
  },
  {
    question: "Which of the following can be considered a social influence?",
    options: [
      "Conformity",
      "Memory",
      "Reflex",
      "Sensation",
    ],
  },
  {
    question: "Conformity means:",
    options: [
      "Changing behavior or beliefs to match a group",
      "Avoiding all social interaction",
      "Ignoring social rules",
      "Developing memory",
    ],
  },
  {
    question: "Personality refers to:",
    options: [
      "A person's characteristic patterns of thoughts, feelings, and behavior",
      "Only intelligence",
      "Only emotions",
      "Only physical appearance",
    ],
  },
  {
    question: "Psychology is primarily the scientific study of:",
    options: [
      "Only the brain",
      "Behavior and mental processes",
      "Only emotions",
      "Only personality",
    ],
  },
];

const correctAnswers = [
  "Conscious",
  "Id",
  "Ego",
  "Moral standards",
  "Unconscious",
  "Repression",
  "Pushing disturbing thoughts out of awareness",
  "Perception",
  "How a person views themselves",
  "A person's evaluation of their own worth",
  "Psychoanalytic theory",
  "Sigmund Freud",
  "Self-actualization",
  "Unconditional positive regard",
  "Hierarchy of needs",
  "Physiological needs",
  "Behaviorism",
  "Ivan Pavlov",
  "B.F. Skinner",
  "Adding a pleasant consequence to increase behavior",
  "Encode, store, and retrieve information",
  "Short-term memory",
  "A relatively permanent change in behavior or knowledge",
  "Forces that initiate and direct behavior",
  "Feelings, physiological responses, and behavior",
  "A response to perceived demands or threats",
  "Conformity",
  "Changing behavior or beliefs to match a group",
  "A person's characteristic patterns of thoughts, feelings, and behavior",
  "Behavior and mental processes",
];

const EXAM_DURATION = 60 * 60;

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
}

export default function StudentExamPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const personModelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const showWarningRef = useRef(false);
  const examEndedRef = useRef(false);

  const personWarningCountRef = useRef(0);
  const lookingAwayCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);

  const resultSavedRef = useRef(false);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const [examAlreadyUsed, setExamAlreadyUsed] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);

  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill("")
  );

  const [cameraStatus, setCameraStatus] = useState(
    "Camera not started"
  );
  const [cameraReady, setCameraReady] = useState(false);

  const [personCount, setPersonCount] = useState(0);

  const [personWarningCount, setPersonWarningCount] = useState(0);
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const [warningTitle, setWarningTitle] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const [examEnded, setExamEnded] = useState(false);

  const [examScore, setExamScore] = useState(0);
  const [examTotalQuestions, setExamTotalQuestions] = useState(
    questions.length
  );
  const [examPercentage, setExamPercentage] = useState(0);

  const [resultLoading, setResultLoading] = useState(false);

  const [startingExam, setStartingExam] = useState(false);

  /*
   * ============================================================
   * CHECK STUDENT LOGIN + ONE-TIME EXAM STATUS
   * ============================================================
   */

  useEffect(() => {
    async function checkLogin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAuthorized(false);
        router.replace("/student/login");
        return;
      }

      const { data: student, error } = await supabase
        .from("students")
        .select(
          "exam_started, exam_completed, exam_started_at, exam_ended_at"
        )
        .eq("user_id", session.user.id)
        .single();

      console.log("================================");
      console.log("CURRENT AUTH USER ID:", session.user.id);
      console.log("CURRENT AUTH EMAIL:", session.user.email);
      console.log("STUDENT DATA:", student);
      console.log("STUDENT ERROR:", error);
      console.log("================================");

      if (error || !student) {
        setAuthorized(false);
        alert("Unable to verify your examination status.");
        return;
      }

      /*
       * ONE-TIME SYSTEM
       *
       * If exam_started is already true,
       * the student has used their attempt.
       */

      if (student.exam_started === true) {
        setExamAlreadyUsed(true);
        setAuthorized(true);
        return;
      }

      setExamAlreadyUsed(false);
      setAuthorized(true);
    }

    checkLogin();
  }, [router]);

  /*
   * ============================================================
   * FETCH SAVED EXAM RESULT
   * ============================================================
   */

  async function fetchExamResult() {
    setResultLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setResultLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("exam_results")
      .select(
        "score, total_questions, percentage, looking_away_warnings, person_object_warnings, tab_switches, submitted_at"
      )
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Result fetch error:", error);
      setResultLoading(false);
      return;
    }

    if (data) {
      setExamScore(data.score ?? 0);
      setExamTotalQuestions(
        data.total_questions ?? questions.length
      );
      setExamPercentage(data.percentage ?? 0);

      setLookingAwayCount(data.looking_away_warnings ?? 0);
      setPersonWarningCount(data.person_object_warnings ?? 0);
      setTabSwitchCount(data.tab_switches ?? 0);
    }

    setResultLoading(false);
  }

  /*
   * ============================================================
   * START EXAM
   * ============================================================
   *
   * IMPORTANT:
   * This is the OLD simple one-time-open system.
   *
   * No start_exam RPC is used.
   */

  async function startExam() {
    if (startingExam) return;

    setStartingExam(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Your session has expired. Please login again.");
        router.replace("/student/login");
        return;
      }

      /*
       * Check again immediately before starting.
       * This prevents reopening the exam.
       */

      const { data: student, error: checkError } = await supabase
        .from("students")
        .select("exam_started, exam_completed")
        .eq("user_id", user.id)
        .single();

      if (checkError || !student) {
        console.error("Exam status error:", checkError);
        alert("Unable to verify your examination status.");
        return;
      }

      if (
        student.exam_started === true ||
        student.exam_completed === true
      ) {
        setExamAlreadyUsed(true);

        alert(
          "You have already used your examination attempt. You cannot take this exam again."
        );

        return;
      }

      /*
       * LOCK THE ATTEMPT
       */

      const { error: startError } = await supabase
        .from("students")
        .update({
          exam_started: true,
          exam_started_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("exam_started", false)
        .eq("exam_completed", false);

      if (startError) {
        console.error("Exam start error:", startError);
        alert("Unable to start the examination.");
        return;
      }

      /*
       * Exam is now permanently opened for this attempt.
       */

      setExamAlreadyUsed(false);
      setExamStarted(true);
      setInstructionsAccepted(true);
      setTimeLeft(EXAM_DURATION);
    } finally {
      setStartingExam(false);
    }
  }

  /*
   * ============================================================
   * SUBMIT EXAM
   * ============================================================
   */

  async function submitExam(reason = "submitted") {
    if (resultSavedRef.current) return;

    resultSavedRef.current = true;

    setExamEnded(true);
    examEndedRef.current = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      resultSavedRef.current = false;
      return;
    }

    let score = 0;

    answers.forEach((answer, index) => {
      if (answer === correctAnswers[index]) {
        score++;
      }
    });

    const totalQuestions = questions.length;
    const percentage = Math.round(
      (score / totalQuestions) * 100
    );

    setExamScore(score);
    setExamTotalQuestions(totalQuestions);
    setExamPercentage(percentage);

    /*
     * Save result
     */

    const { error: resultError } = await supabase
      .from("exam_results")
      .insert({
        student_id: user.id,
        student_name: user.user_metadata?.full_name ?? "",
        student_email: user.email ?? "",
        score,
        total_questions: totalQuestions,
        percentage,

        looking_away_warnings: lookingAwayCountRef.current,
        person_object_warnings: personWarningCountRef.current,
        tab_switches: tabSwitchCountRef.current,

        submitted_at: new Date().toISOString(),
      });

    if (resultError) {
      console.error("Result save error:", resultError);
    }

    /*
     * Mark student as completed
     */

    const { error: studentUpdateError } = await supabase
      .from("students")
      .update({
        exam_completed: true,
        exam_ended_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (studentUpdateError) {
      console.error(
        "Student completion update error:",
        studentUpdateError
      );
    }

    localStorage.removeItem("examAnswers");

    console.log("Exam ended because:", reason);
  }

  /*
   * ============================================================
   * RESTORE ANSWERS
   * ============================================================
   */

  useEffect(() => {
    if (!examStarted) return;

    const savedAnswers = localStorage.getItem("examAnswers");

    if (savedAnswers) {
      try {
        const parsed = JSON.parse(savedAnswers);

        if (Array.isArray(parsed)) {
          setAnswers(parsed);
        }
      } catch (error) {
        console.error("Could not restore answers:", error);
      }
    }
  }, [examStarted]);

  /*
   * ============================================================
   * TIMER
   * ============================================================
   */

  useEffect(() => {
    if (!examStarted || examEnded) return;

    const interval = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval);

          setTimeout(() => {
            submitExam("time expired");
          }, 0);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, examEnded]);

  /*
   * ============================================================
   * TAB SWITCH DETECTION
   * ============================================================
   */

  useEffect(() => {
    if (!examStarted || examEnded) return;

    function handleVisibilityChange() {
      if (document.hidden) {
        const newCount = tabSwitchCountRef.current + 1;

        tabSwitchCountRef.current = newCount;
        setTabSwitchCount(newCount);

        if (newCount >= 3) {
          submitExam("too many tab switches");
          return;
        }

        if (!showWarningRef.current) {
          showWarningRef.current = true;

          setWarningTitle(
            newCount === 2
              ? "FINAL WARNING"
              : "TAB SWITCH DETECTED"
          );

          setWarningMessage(
            newCount === 2
              ? "This is your final warning. Do not leave the examination window again."
              : "You switched away from the examination window. Please remain on the exam page."
          );

          setShowWarning(true);
        }
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [examStarted, examEnded]);

  /*
   * ============================================================
   * CAMERA + AI MONITORING
   * ============================================================
   */

  useEffect(() => {
    if (!examStarted || !authorized || examEnded) return;

    let mounted = true;
    let detectionInterval: ReturnType<typeof setInterval> | null =
      null;

    async function startCamera() {
      try {
        setCameraStatus("Requesting camera permission...");

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await videoRef.current.play();

          setCameraReady(true);
          setCameraStatus("Camera active");
        }

        /*
         * Load COCO-SSD
         */

        setCameraStatus("Loading monitoring system...");

        personModelRef.current = await cocoSsd.load();

        /*
         * Load MediaPipe Face Landmarker
         */

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
        );

        faceLandmarkerRef.current =
          await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 2,
          });

        setCameraStatus("AI monitoring active");

        /*
         * Run detection every 2.5 seconds.
         */

        detectionInterval = setInterval(async () => {
          if (
            !mounted ||
            examEndedRef.current ||
            showWarningRef.current ||
            !videoRef.current
          ) {
            return;
          }

          const video = videoRef.current;

          if (
            video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA
          ) {
            return;
          }

          /*
           * ====================================================
           * PERSON / OBJECT DETECTION
           * ====================================================
           */

          try {
            if (personModelRef.current) {
              const predictions =
                await personModelRef.current.detect(video);

              const people = predictions.filter(
                (prediction) =>
                  prediction.class === "person" &&
                  prediction.score >= 0.2
              );

              const otherObjects = predictions.filter(
                (prediction) =>
                  prediction.class !== "person" &&
                  prediction.score >= 0.5
              );

              setPersonCount(people.length);

              /*
               * More than one person OR another suspicious
               * object is detected.
               */

              if (
                people.length >= 2 ||
                otherObjects.length >= 1
              ) {
                const newCount =
                  personWarningCountRef.current + 1;

                personWarningCountRef.current = newCount;
                setPersonWarningCount(newCount);

                if (newCount >= 5) {
                  await submitExam(
                    "too many person/object violations"
                  );
                  return;
                }

                if (!showWarningRef.current) {
                  showWarningRef.current = true;

                  setWarningTitle(
                    newCount >= 4
                      ? "FINAL WARNING"
                      : "SUSPICIOUS ACTIVITY DETECTED"
                  );

                  setWarningMessage(
                    newCount >= 4
                      ? "Multiple monitoring violations have been detected. One more serious violation may end the examination."
                      : "More than one person or a suspicious object was detected in the camera view. Please remain alone and keep unauthorized objects away."
                  );

                  setShowWarning(true);
                  return;
                }
              }
            }
          } catch (error) {
            console.error(
              "Person detection error:",
              error
            );
          }

          /*
           * ====================================================
           * FACE / LOOKING-AWAY DETECTION
           * ====================================================
           */

          try {
            if (faceLandmarkerRef.current) {
              const now = performance.now();

              const result =
                faceLandmarkerRef.current.detectForVideo(
                  video,
                  now
                );

              const faces = result.faceLandmarks;

              if (!faces || faces.length === 0) {
                setCameraStatus("Face not detected");
                return;
              }

              if (faces.length >= 2) {
                const newCount =
                  personWarningCountRef.current + 1;

                personWarningCountRef.current = newCount;
                setPersonWarningCount(newCount);

                if (newCount >= 5) {
                  await submitExam(
                    "multiple faces detected"
                  );
                  return;
                }

                if (!showWarningRef.current) {
                  showWarningRef.current = true;

                  setWarningTitle(
                    "MULTIPLE FACES DETECTED"
                  );

                  setWarningMessage(
                    "More than one face was detected in the camera view. Please make sure you are the only person visible."
                  );

                  setShowWarning(true);
                  return;
                }
              }

              const face = faces[0];

              /*
               * Approximate face direction using landmarks.
               */

              const nose = face[1];
              const leftEye = face[33];
              const rightEye = face[263];

              if (
                nose &&
                leftEye &&
                rightEye
              ) {
                const eyeCenterX =
                  (leftEye.x + rightEye.x) / 2;

                const eyeDistance = Math.abs(
                  rightEye.x - leftEye.x
                );

                const noseOffset = Math.abs(
                  nose.x - eyeCenterX
                );

                if (
                  eyeDistance > 0 &&
                  noseOffset > eyeDistance * 0.32
                ) {
                  const newCount =
                    lookingAwayCountRef.current + 1;

                  lookingAwayCountRef.current =
                    newCount;

                  setLookingAwayCount(newCount);

                  if (newCount >= 5) {
                    await submitExam(
                      "too many looking-away violations"
                    );
                    return;
                  }

                  if (!showWarningRef.current) {
                    showWarningRef.current = true;

                    setWarningTitle(
                      newCount >= 4
                        ? "FINAL WARNING"
                        : "LOOKING AWAY DETECTED"
                    );

                    setWarningMessage(
                      newCount >= 4
                        ? "This is your final warning for looking away from the screen."
                        : "Please look directly at the examination screen."
                    );

                    setShowWarning(true);
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              "Face detection error:",
              error
            );
          }
        }, 2500);
      } catch (error) {
        console.error("Camera error:", error);

        setCameraStatus(
          "Camera access is required for this examination."
        );
      }
    }

    startCamera();

    return () => {
      mounted = false;

      if (detectionInterval) {
        clearInterval(detectionInterval);
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [examStarted, authorized, examEnded]);

  /*
   * ============================================================
   * FULLSCREEN MONITORING
   * ============================================================
   */

  useEffect(() => {
    if (!examStarted || examEnded) return;

    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        if (!showWarningRef.current) {
          showWarningRef.current = true;

          setWarningTitle("FULLSCREEN EXITED");

          setWarningMessage(
            "You exited fullscreen mode. The examination has been ended for security reasons."
          );

          setShowWarning(true);
        }

        setTimeout(() => {
          if (!examEndedRef.current) {
            submitExam("fullscreen exited");
          }
        }, 1500);
      }
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, [examStarted, examEnded]);

  /*
   * ============================================================
   * SELECT ANSWER
   * ============================================================
   */

  function selectAnswer(answer: string) {
    if (examEnded) return;

    const updatedAnswers = [...answers];

    updatedAnswers[currentQuestion] = answer;

    setAnswers(updatedAnswers);

    localStorage.setItem(
      "examAnswers",
      JSON.stringify(updatedAnswers)
    );
  }

  /*
   * ============================================================
   * CLOSE WARNING
   * ============================================================
   */

  function closeWarning() {
    showWarningRef.current = false;
    setShowWarning(false);
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">
            Checking examination access...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ONE-TIME EXAM USED SCREEN
   * ============================================================
   */

  if (examAlreadyUsed && !examEnded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white text-slate-900 rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>

          <h1 className="text-2xl font-bold mb-3">
            Examination Unavailable
          </h1>

          <p className="text-slate-600 leading-7 mb-6">
            This examination attempt has already been used.
            Each student is allowed only one examination
            attempt.
          </p>

          <div className="bg-slate-100 rounded-xl p-4 text-sm text-slate-600">
            You cannot start or take this examination again.
          </div>

          <button
            onClick={() =>
              router.push("/student/login")
            }
            className="mt-6 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * INSTRUCTIONS / START SCREEN
   * ============================================================
   */

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-8">
              <p className="text-sm uppercase tracking-widest text-slate-400 mb-2">
                TRANCELLE INTERNATIONAL ACADEMY
              </p>

              <h1 className="text-3xl font-bold">
                Examination Portal
              </h1>

              <p className="text-slate-300 mt-2">
                Psychology Examination
              </p>
            </div>

            <div className="p-8">
              <h2 className="text-xl font-bold mb-5">
                Examination Instructions
              </h2>

              <div className="space-y-4 text-slate-700">
                <div className="flex gap-3">
                  <span>⏱️</span>
                  <p>
                    You have{" "}
                    <strong>60 minutes</strong> to complete
                    the examination.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>📷</span>
                  <p>
                    Your camera must remain enabled during
                    the examination.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>👤</span>
                  <p>
                    Only the registered student should be
                    visible in the camera.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>🚫</span>
                  <p>
                    Do not use phones, books, or other
                    unauthorized materials.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>🖥️</span>
                  <p>
                    Do not switch tabs or leave the
                    examination window.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>🔒</span>
                  <p>
                    <strong>
                      Once you start the examination, your
                      attempt is permanently used.
                    </strong>
                  </p>
                </div>
              </div>

              <div className="mt-7 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                <strong>Important:</strong> Clicking
                "Start Examination" will use your one
                examination attempt.
              </div>

              <label className="flex items-center gap-3 mt-7 cursor-pointer">
                <input
                  type="checkbox"
                  checked={instructionsAccepted}
                  onChange={(e) =>
                    setInstructionsAccepted(
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />

                <span className="text-sm text-slate-700">
                  I have read and understood the examination
                  instructions.
                </span>
              </label>

              <button
                disabled={
                  !instructionsAccepted ||
                  startingExam
                }
                onClick={startExam}
                className="mt-6 w-full rounded-xl bg-slate-900 text-white py-4 font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition"
              >
                {startingExam
                  ? "Starting Examination..."
                  : "Start Examination"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * RESULT SCREEN
   * ============================================================
   */

  if (examEnded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white text-slate-900 rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✓</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Examination Completed
          </h1>

          {resultLoading ? (
            <p className="text-slate-500 mt-6">
              Loading your result...
            </p>
          ) : (
            <>
              <p className="text-slate-500 mb-7">
                Your examination has been submitted.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-100 rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    Score
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {examScore}
                  </p>

                  <p className="text-xs text-slate-500">
                    / {examTotalQuestions}
                  </p>
                </div>

                <div className="bg-slate-100 rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    Percentage
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {examPercentage}%
                  </p>
                </div>

                <div className="bg-slate-100 rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    Questions
                  </p>

                  <p className="text-3xl font-bold mt-1">
                    {examTotalQuestions}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div className="border rounded-xl p-3">
                  <p className="text-slate-500">
                    Looking Away
                  </p>

                  <p className="font-bold text-lg">
                    {lookingAwayCount}
                  </p>
                </div>

                <div className="border rounded-xl p-3">
                  <p className="text-slate-500">
                    Person/Object
                  </p>

                  <p className="font-bold text-lg">
                    {personWarningCount}
                  </p>
                </div>

                <div className="border rounded-xl p-3">
                  <p className="text-slate-500">
                    Tab Switches
                  </p>

                  <p className="font-bold text-lg">
                    {tabSwitchCount}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  router.push("/student/login")
                }
                className="mt-7 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition"
              >
                Return to Login
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * WARNING MODAL
   * ============================================================
   */

  const warningModal =
    showWarning &&
    typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-7 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">⚠️</span>
              </div>

              <h2 className="text-2xl font-bold text-red-600">
                {warningTitle}
              </h2>

              <p className="mt-4 text-slate-600 leading-7">
                {warningMessage}
              </p>

              <button
                onClick={closeWarning}
                className="mt-7 w-full bg-slate-900 text-white rounded-xl py-3 font-semibold hover:bg-slate-800"
              >
                I Understand
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  /*
   * ============================================================
   * MAIN EXAM PAGE
   * ============================================================
   */

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {warningModal}

      {/* HEADER */}

      <header className="sticky top-0 z-50 bg-slate-950 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              TRANCELLE INTERNATIONAL ACADEMY
            </p>

            <h1 className="font-bold text-lg">
              Psychology Examination
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-400">
                Time Remaining
              </p>

              <p
                className={`font-mono text-xl font-bold ${
                  timeLeft <= 300
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                {formatTime(timeLeft)}
              </p>
            </div>

            <button
              onClick={() => {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(
                    () => {}
                  );
                }
              }}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              Fullscreen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-5 lg:p-7">
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* QUESTION AREA */}

          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-sm text-slate-500">
                  Question
                </p>

                <h2 className="text-2xl font-bold">
                  {currentQuestion + 1}
                  <span className="text-slate-400">
                    {" "}
                    / {questions.length}
                  </span>
                </h2>
              </div>

              <div className="text-sm text-slate-500">
                {answers.filter(Boolean).length} answered
              </div>
            </div>

            <div className="h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{
                  width: `${
                    ((currentQuestion + 1) /
                      questions.length) *
                    100
                  }%`,
                }}
              />
            </div>

            <h3 className="text-xl lg:text-2xl font-semibold leading-relaxed">
              {questions[currentQuestion].question}
            </h3>

            <div className="mt-8 space-y-3">
              {questions[currentQuestion].options.map(
                (option, index) => {
                  const selected =
                    answers[currentQuestion] === option;

                  return (
                    <button
                      key={option}
                      onClick={() =>
                        selectAnswer(option)
                      }
                      className={`w-full text-left p-4 rounded-2xl border-2 transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 hover:border-slate-400 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                            selected
                              ? "bg-white text-slate-900"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(
                            65 + index
                          )}
                        </span>

                        <span className="font-medium">
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                disabled={currentQuestion === 0}
                onClick={() =>
                  setCurrentQuestion(
                    (previous) => previous - 1
                  )
                }
                className="px-5 py-3 rounded-xl border border-slate-300 font-semibold disabled:opacity-30"
              >
                Previous
              </button>

              {currentQuestion <
              questions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentQuestion(
                      (previous) => previous + 1
                    )
                  }
                  className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => submitExam("submitted")}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Submit Examination
                </button>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}

          <aside className="space-y-5">
            {/* CAMERA */}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">
                    Camera Monitoring
                  </h2>

                  <span
                    className={`w-3 h-3 rounded-full ${
                      cameraReady
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>
              </div>

              <div className="bg-black aspect-video relative">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />

                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm bg-black/70">
                    Camera loading...
                  </div>
                )}

                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black/60 backdrop-blur text-white rounded-lg px-3 py-2 text-xs">
                    {cameraStatus}
                  </div>
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-100 rounded-xl p-3">
                  <p className="text-slate-500">
                    People
                  </p>

                  <p className="text-xl font-bold">
                    {personCount}
                  </p>
                </div>

                <div className="bg-slate-100 rounded-xl p-3">
                  <p className="text-slate-500">
                    Camera
                  </p>

                  <p
                    className={`text-sm font-bold ${
                      cameraReady
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {cameraReady
                      ? "ACTIVE"
                      : "NOT READY"}
                  </p>
                </div>
              </div>
            </div>

            {/* SECURITY STATUS */}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-bold mb-4">
                Security Status
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Person/Object Warnings
                  </span>

                  <span className="font-bold">
                    {personWarningCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Looking Away
                  </span>

                  <span className="font-bold">
                    {lookingAwayCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Tab Switches
                  </span>

                  <span className="font-bold">
                    {tabSwitchCount}
                  </span>
                </div>
              </div>
            </div>

            {/* QUESTION NAVIGATION */}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-bold mb-4">
                Questions
              </h2>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => {
                  const answered = Boolean(
                    answers[index]
                  );

                  const active =
                    currentQuestion === index;

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        setCurrentQuestion(index)
                      }
                      className={`aspect-square rounded-lg text-sm font-bold transition ${
                        active
                          ? "bg-slate-900 text-white"
                          : answered
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SUBMIT */}

            <button
              onClick={() => {
                const confirmed = window.confirm(
                  "Are you sure you want to submit the examination? You cannot take it again."
                );

                if (confirmed) {
                  submitExam("manual submission");
                }
              }}
              className="w-full rounded-2xl bg-red-600 text-white py-4 font-bold hover:bg-red-700 transition"
            >
              Submit Examination
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}