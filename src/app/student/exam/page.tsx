"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import FaceAuthentication from "@/app/face-registration/FaceAuthentication";

const questions = [
  {
    question:
      "Which of the following is known as the study of human behavior and mental processes?",
    options: ["Psychology", "Biology", "Chemistry", "Physics"],
  },
  {
    question:
      "Which part of the brain is mainly responsible for thinking?",
    options: [
      "Cerebrum",
      "Cerebellum",
      "Medulla",
      "Spinal cord",
    ],
  },
  {
    question:
      "What is the process of acquiring new knowledge called?",
    options: [
      "Learning",
      "Forgetting",
      "Perception",
      "Sensation",
    ],
  },
  {
    question:
      "Which type of memory holds information for a very short time?",
    options: [
      "Sensory memory",
      "Long-term memory",
      "Permanent memory",
      "Semantic memory",
    ],
  },
  {
    question:
      "What is the ability to focus on a particular stimulus called?",
    options: [
      "Attention",
      "Memory",
      "Emotion",
      "Motivation",
    ],
  },
  {
    question:
      "Which of the following is an example of an emotion?",
    options: [
      "Happiness",
      "Height",
      "Weight",
      "Temperature",
    ],
  },
  {
    question:
      "The process of interpreting sensory information is called:",
    options: [
      "Perception",
      "Storage",
      "Forgetting",
      "Rehearsal",
    ],
  },
  {
    question:
      "What is problem solving mainly used for?",
    options: [
      "Finding solutions",
      "Storing memories",
      "Sleeping",
      "Detecting sounds",
    ],
  },
  {
    question:
      "Which of these is a type of long-term memory?",
    options: [
      "Declarative memory",
      "Camera memory",
      "Screen memory",
      "Temporary memory",
    ],
  },
  {
    question:
      "What is the ability to create new and useful ideas called?",
    options: [
      "Creativity",
      "Perception",
      "Sensation",
      "Attention",
    ],
  },
];

const correctAnswers = [
  "Psychology",
  "Cerebrum",
  "Learning",
  "Sensory memory",
  "Attention",
  "Happiness",
  "Perception",
  "Finding solutions",
  "Declarative memory",
  "Creativity",
];

export default function ExamPage() {
  const router = useRouter();

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const [authorized, setAuthorized] =
    useState<boolean | null>(null);

  const [examStarted, setExamStarted] =
    useState(false);

  const [
    instructionsAccepted,
    setInstructionsAccepted,
  ] = useState(false);

  const EXAM_DURATION = 10 * 60;

  const [timeLeft, setTimeLeft] =
    useState(EXAM_DURATION);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] =
    useState<string[]>(
      Array(questions.length).fill("")
    );

  const [cameraStatus, setCameraStatus] =
    useState(
      "Camera has not started yet."
    );

  const [cameraReady, setCameraReady] =
    useState(false);

  const [faceAuthenticated, setFaceAuthenticated] =
    useState(false);

  const [personCount, setPersonCount] =
    useState<number | null>(null);

  const [personWarningCount, setPersonWarningCount] =
    useState(0);

  const [lookingAwayCount, setLookingAwayCount] =
    useState(0);

  const [tabSwitchCount, setTabSwitchCount] =
    useState(0);

  const [warningTitle, setWarningTitle] =
    useState("");

  const [warningMessage, setWarningMessage] =
    useState("");

  const [showWarning, setShowWarning] =
    useState(false);

  const [examEnded, setExamEnded] =
    useState(false);

  const [examScore, setExamScore] =
    useState<number | null>(null);

  const [examTotalQuestions, setExamTotalQuestions] =
    useState<number | null>(null);

  const [examPercentage, setExamPercentage] =
    useState<number | null>(null);

  const [resultLoading, setResultLoading] =
    useState(false);

  const [examAlreadyUsed, setExamAlreadyUsed] =
    useState(false);

  const [startingExam, setStartingExam] =
    useState(false);

  const showWarningRef =
    useRef(false);

  const examEndedRef =
    useRef(false);

  const personWarningCountRef =
    useRef(0);

  const lookingAwayCountRef =
    useRef(0);

  const tabSwitchCountRef =
    useRef(0);

  const resultSavedRef =
    useRef(false);

  // =====================================
  // FETCH SAVED EXAM RESULT
  // =====================================

  const fetchExamResult = async () => {
    try {
      setResultLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const {
        data: result,
        error,
      } = await supabase
        .from("exam_results")
        .select(
          `
            score,
            total_questions,
            percentage,
            looking_away_warnings,
            person_object_warnings,
            tab_switches,
            submitted_at
          `
        )
        .eq(
          "student_id",
          user.id
        )
        .order(
          "submitted_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Result fetch error:",
          error
        );

        return;
      }

      if (result) {
        setExamScore(
          result.score
        );

        setExamTotalQuestions(
          result.total_questions
        );

        setExamPercentage(
          result.percentage
        );

        setLookingAwayCount(
          result.looking_away_warnings || 0
        );

        lookingAwayCountRef.current =
          result.looking_away_warnings || 0;

        setPersonWarningCount(
          result.person_object_warnings || 0
        );

        personWarningCountRef.current =
          result.person_object_warnings || 0;

        setTabSwitchCount(
          result.tab_switches || 0
        );

        tabSwitchCountRef.current =
          result.tab_switches || 0;
      }
    } catch (error) {
      console.error(
        "Unexpected result fetch error:",
        error
      );
    } finally {
      setResultLoading(false);
    }
  };

  // =====================================
  // SUPABASE LOGIN + ONE-TIME EXAM CHECK
  // =====================================

  useEffect(() => {
    async function checkLogin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAuthorized(false);

        router.replace(
          "/student/login"
        );

        return;
      }

      const {
        data: student,
        error,
      } = await supabase
        .from("students")
        .select(
          "exam_started, exam_completed"
        )
        .eq(
          "user_id",
          session.user.id
        )
        .single();

      if (error || !student) {
        console.error(
          "Student exam check error:",
          error
        );

        setAuthorized(false);

        alert(
          "Unable to verify your examination status."
        );

        return;
      }

      if (
        student.exam_completed === true
      ) {
        setExamEnded(true);
        await fetchExamResult();
        setAuthorized(true);
        return;
      }

      if (
        student.exam_started === true
      ) {
        setExamAlreadyUsed(true);
      }

      setAuthorized(true);
    }

    checkLogin();
  }, [router]);

  // =====================================
  // KEEP REFS UPDATED
  // =====================================

  useEffect(() => {
    showWarningRef.current =
      showWarning;
  }, [showWarning]);

  useEffect(() => {
    examEndedRef.current =
      examEnded;
  }, [examEnded]);

  // =====================================
  // LOAD SAVED ANSWERS
  // =====================================

  useEffect(() => {
    const savedAnswers =
      localStorage.getItem(
        "examAnswers"
      );

    if (savedAnswers) {
      try {
        const parsed =
          JSON.parse(savedAnswers);

        if (Array.isArray(parsed)) {
          setAnswers(parsed);
        }
      } catch {
        localStorage.removeItem(
          "examAnswers"
        );
      }
    }
  }, []);

  // =====================================
  // SUBMIT / SAVE EXAM RESULT
  // =====================================

  const submitExam = async () => {
    if (resultSavedRef.current) {
      return;
    }

    resultSavedRef.current = true;

    try {
      examEndedRef.current = true;

      setExamEnded(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        resultSavedRef.current =
          false;

        alert(
          "Student session not found."
        );

        return;
      }

      const score =
        answers.reduce(
          (
            total,
            answer,
            index
          ) => {
            if (
              answer ===
              correctAnswers[index]
            ) {
              return total + 1;
            }

            return total;
          },
          0
        );

      const percentage =
        Math.round(
          (score /
            questions.length) *
            100
        );

      setExamScore(score);

      setExamTotalQuestions(
        questions.length
      );

      setExamPercentage(
        percentage
      );

      const { error } =
        await supabase
          .from("exam_results")
          .insert({
            student_id:
              user.id,

            student_name:
              user.user_metadata
                ?.full_name || "",

            student_email:
              user.email || "",

            score,

            total_questions:
              questions.length,

            percentage,

            looking_away_warnings:
              lookingAwayCountRef.current,

            person_object_warnings:
              personWarningCountRef.current,

            tab_switches:
              tabSwitchCountRef.current,
          });

      if (error) {
        console.error(
          "Result save error:",
          error
        );

        resultSavedRef.current =
          false;

        alert(
          "Exam ended, but the result could not be saved: " +
            error.message
        );

        return;
      }

      const {
        error: completionError,
      } = await supabase
        .from("students")
        .update({
          exam_completed: true,

          exam_ended_at:
            new Date().toISOString(),
        })
        .eq(
          "user_id",
          user.id
        );

      if (completionError) {
        console.error(
          "Exam completion update error:",
          completionError
        );
      }

      localStorage.removeItem(
        "examAnswers"
      );

      console.log(
        "Exam result saved successfully."
      );

      await fetchExamResult();
    } catch (error) {
      console.error(
        "Submit exam error:",
        error
      );

      resultSavedRef.current =
        false;

      alert(
        "Exam ended, but something went wrong while saving the result."
      );
    }
  };

  // =====================================
  // TAB SWITCH DETECTION
  // =====================================

  useEffect(() => {
    if (
      !examStarted ||
      examEnded
    ) {
      return;
    }

    const handleVisibilityChange =
      () => {
        if (!document.hidden) {
          return;
        }

        tabSwitchCountRef.current += 1;

        const newCount =
          tabSwitchCountRef.current;

        setTabSwitchCount(
          newCount
        );

        if (newCount >= 3) {
          setWarningTitle(
            "🚫 EXAM ENDED"
          );

          setWarningMessage(
            "Your examination has been automatically ended because you left the examination tab three times."
          );

          submitExam();
        } else {
          setWarningTitle(
            "⚠️ TAB SWITCH WARNING"
          );

          setWarningMessage(
            `You left the examination tab. This is violation ${newCount} of 3.`
          );

          showWarningRef.current =
            true;

          setShowWarning(true);
        }
      };

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
  }, [
    examStarted,
    examEnded,
  ]);

  // =====================================
  // TIMER
  // =====================================

  useEffect(() => {
    if (
      !examStarted ||
      examEnded
    ) {
      return;
    }

    if (timeLeft <= 0) {
      submitExam();
      return;
    }

    const timer =
      setInterval(() => {
        setTimeLeft(
          (
            previousTime
          ) => {
            if (
              previousTime <= 1
            ) {
              clearInterval(
                timer
              );

              setTimeLeft(0);

              submitExam();

              return 0;
            }

            return (
              previousTime - 1
            );
          }
        );
      }, 1000);

    return () => {
      clearInterval(
        timer
      );
    };
  }, [
    examStarted,
    examEnded,
    timeLeft,
  ]);

  // =====================================
  // FORMAT TIMER
  // =====================================

  const formatTime = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(
        seconds / 60
      );

    const remainingSeconds =
      seconds % 60;

    return `${String(
      minutes
    ).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(
      2,
      "0"
    )}`;
  };

  // =====================================
  // CAMERA + AI MONITORING
  // =====================================

  useEffect(() => {
    if (
      !examStarted ||
      !authorized
    ) {
      return;
    }

    let stream:
      | MediaStream
      | null = null;

    let detectionInterval:
      | ReturnType<
          typeof setInterval
        >
      | null = null;

    const startMonitoring =
      async () => {
        try {
          setCameraStatus(
            "Requesting camera access..."
          );

          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: {
                  facingMode:
                    "user",
                  width: {
                    ideal: 1280,
                  },
                  height: {
                    ideal: 720,
                  },
                },
                audio: false,
              }
            );

          if (
            videoRef.current
          ) {
            videoRef.current.srcObject =
              stream;

            await videoRef.current.play();

            setCameraReady(
              true
            );

            setCameraStatus(
              "Camera monitoring is active."
            );
          }

          const objectModel =
            await cocoSsd.load();

          const vision =
            await FilesetResolver.forVisionTasks(
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

          const faceLandmarker =
            await FaceLandmarker.createFromOptions(
              vision,
              {
                baseOptions: {
                  modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                  delegate:
                    "GPU",
                },

                runningMode:
                  "VIDEO",

                numFaces: 2,

                outputFaceBlendshapes:
                  false,

                outputFacialTransformationMatrixes:
                  false,
              }
            );

          detectionInterval =
            setInterval(
              async () => {
                if (
                  !videoRef.current ||
                  examEndedRef.current ||
                  showWarningRef.current
                ) {
                  return;
                }

                const video =
                  videoRef.current;

                if (
                  video.readyState <
                  2
                ) {
                  return;
                }

                try {
                  // =====================
                  // PERSON DETECTION
                  // =====================

                  const predictions =
                    await objectModel.detect(
                      video
                    );

                  const persons =
                    predictions.filter(
                      (
                        prediction
                      ) =>
                        prediction.class ===
                        "person"
                    );

                  const detectedCount =
                    persons.length;

                  setPersonCount(
                    detectedCount
                  );

                  if (
                    detectedCount === 0
                  ) {
                    personWarningCountRef.current +=
                      1;

                    const newCount =
                      personWarningCountRef.current;

                    setPersonWarningCount(
                      newCount
                    );

                    if (
                      newCount >= 5
                    ) {
                      setWarningTitle(
                        "🚫 EXAM ENDED"
                      );

                      setWarningMessage(
                        "Your examination has been automatically ended because your face was not visible to the camera repeatedly."
                      );

                      submitExam();

                      return;
                    }

                    setWarningTitle(
                      "⚠️ CAMERA WARNING"
                    );

                    setWarningMessage(
                      `Your face is not clearly visible. Warning ${newCount} of 5.`
                    );

                    showWarningRef.current =
                      true;

                    setShowWarning(
                      true
                    );

                    return;
                  }

                  if (
                    detectedCount > 1
                  ) {
                    personWarningCountRef.current +=
                      1;

                    const newCount =
                      personWarningCountRef.current;

                    setPersonWarningCount(
                      newCount
                    );

                    if (
                      newCount >= 5
                    ) {
                      setWarningTitle(
                        "🚫 EXAM ENDED"
                      );

                      setWarningMessage(
                        "Your examination has been automatically ended because multiple people were repeatedly detected."
                      );

                      submitExam();

                      return;
                    }

                    setWarningTitle(
                      "⚠️ MULTIPLE PERSON WARNING"
                    );

                    setWarningMessage(
                      `More than one person was detected. Warning ${newCount} of 5.`
                    );

                    showWarningRef.current =
                      true;

                    setShowWarning(
                      true
                    );

                    return;
                  }

                  // =====================
                  // FACE DIRECTION
                  // =====================

                  const result =
                    faceLandmarker.detectForVideo(
                      video,
                      performance.now()
                    );

                  if (
                    !result.faceLandmarks ||
                    result.faceLandmarks.length ===
                      0
                  ) {
                    return;
                  }

                  const landmarks =
                    result.faceLandmarks[0];

                  const leftEye =
                    landmarks[33];

                  const rightEye =
                    landmarks[263];

                  const nose =
                    landmarks[1];

                  const eyeCenterX =
                    (
                      leftEye.x +
                      rightEye.x
                    ) / 2;

                  const eyeDistance =
                    Math.abs(
                      rightEye.x -
                        leftEye.x
                    );

                  const noseOffset =
                    Math.abs(
                      nose.x -
                        eyeCenterX
                    );

                  const lookingAway =
                    noseOffset >
                    eyeDistance *
                      0.32;

                  if (
                    lookingAway
                  ) {
                    lookingAwayCountRef.current +=
                      1;

                    const newCount =
                      lookingAwayCountRef.current;

                    setLookingAwayCount(
                      newCount
                    );

                    if (
                      newCount >= 5
                    ) {
                      setWarningTitle(
                        "🚫 EXAM ENDED"
                      );

                      setWarningMessage(
                        "Your examination has been automatically ended because you repeatedly looked away from the camera."
                      );

                      submitExam();

                      return;
                    }

                    setWarningTitle(
                      "⚠️ LOOKING AWAY WARNING"
                    );

                    setWarningMessage(
                      `Please look directly at the camera. Warning ${newCount} of 5.`
                    );

                    showWarningRef.current =
                      true;

                    setShowWarning(
                      true
                    );
                  }
                } catch (
                  detectionError
                ) {
                  console.error(
                    "AI detection error:",
                    detectionError
                  );
                }
              },
              2500
            );
        } catch (
          cameraError
        ) {
          console.error(
            "Camera monitoring error:",
            cameraError
          );

          setCameraStatus(
            "Camera access failed. Please allow camera permission."
          );
        }
      };

    startMonitoring();

    return () => {
      if (
        detectionInterval
      ) {
        clearInterval(
          detectionInterval
        );
      }

      if (stream) {
        stream
          .getTracks()
          .forEach(
            (
              track
            ) =>
              track.stop()
          );
      }
    };
  }, [
    examStarted,
    authorized,
  ]);

  // =====================================
  // START ONE-TIME EXAM
  // =====================================

  const startExam = async () => {
    if (
      !instructionsAccepted ||
      startingExam
    ) {
      return;
    }

    try {
      setStartingExam(
        true
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Student session not found."
        );

        router.replace(
          "/student/login"
        );

        return;
      }

      const {
        data: student,
        error: checkError,
      } = await supabase
        .from("students")
        .select(
          "exam_started, exam_completed"
        )
        .eq(
          "user_id",
          user.id
        )
        .single();

      if (
        checkError ||
        !student
      ) {
        console.error(
          "Exam status check error:",
          checkError
        );

        alert(
          "Unable to start the examination."
        );

        return;
      }

      if (
        student.exam_started ===
          true ||
        student.exam_completed ===
          true
      ) {
        setExamAlreadyUsed(
          true
        );

        alert(
          "You have already used your examination attempt. You cannot take this exam again."
        );

        return;
      }

      const {
        error: updateError,
      } = await supabase
        .from("students")
        .update({
          exam_started: true,

          exam_started_at:
            new Date().toISOString(),
        })
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "exam_started",
          false
        );

      if (
        updateError
      ) {
        console.error(
          "Exam lock error:",
          updateError
        );

        alert(
          "Unable to lock your examination attempt."
        );

        return;
      }

      try {
        if (
          document.documentElement
            .requestFullscreen
        ) {
          await document.documentElement
            .requestFullscreen();
        }
      } catch (
        fullscreenError
      ) {
        console.error(
          "Fullscreen error:",
          fullscreenError
        );
      }

      setExamStarted(
        true
      );
    } catch (
      error
    ) {
      console.error(
        "Start exam error:",
        error
      );

      alert(
        "Something went wrong while starting the examination."
      );
    } finally {
      setStartingExam(
        false
      );
    }
  };

  // =====================================
  // FULLSCREEN EXIT DETECTION
  // =====================================

  useEffect(() => {
    if (
      !examStarted ||
      examEnded
    ) {
      return;
    }

    const handleFullscreenChange =
      () => {
        if (
          document.fullscreenElement
        ) {
          return;
        }

        if (
          examEndedRef.current
        ) {
          return;
        }

        setWarningTitle(
          "🚫 EXAM ENDED"
        );

        setWarningMessage(
          "Your examination has been automatically ended because fullscreen mode was exited."
        );

        submitExam();
      };

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
  }, [
    examStarted,
    examEnded,
  ]);

  // =====================================
  // SELECT ANSWER
  // =====================================

  const selectAnswer = (
    answer: string
  ) => {
    if (
      examEnded
    ) {
      return;
    }

    setAnswers(
      (
        previousAnswers
      ) => {
        const updatedAnswers =
          [
            ...previousAnswers,
          ];

        updatedAnswers[
          currentQuestion
        ] = answer;

        localStorage.setItem(
          "examAnswers",
          JSON.stringify(
            updatedAnswers
          )
        );

        return updatedAnswers;
      }
    );
  };

  // =====================================
  // CLOSE WARNING
  // =====================================

  const closeWarning =
    () => {
      showWarningRef.current =
        false;

      setShowWarning(
        false
      );
    };

  // =====================================
  // EXAM ALREADY USED SCREEN
  // =====================================

  if (authorized === null) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          background: "#f5f7fb",
        }}
      >
        <p>
          Checking examination access...
        </p>
      </main>
    );
  }

  if (examAlreadyUsed) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f7fb",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            background: "white",
            padding: "40px",
            borderRadius: "18px",
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          <h1
            style={{
              color: "#dc2626",
            }}
          >
            Examination Unavailable
          </h1>

          <p
            style={{
              fontSize: "18px",
              lineHeight: "1.6",
              color: "#4b5563",
            }}
          >
            This examination attempt has already
            been used.
          </p>

          <p
            style={{
              marginTop: "20px",
              color: "#dc2626",
              fontWeight: "bold",
              lineHeight: "1.6",
            }}
          >
            Each student is allowed only one
            examination attempt. You cannot start
            or take this examination again.
          </p>

          <button
            onClick={async () => {
              await supabase.auth.signOut();

              router.replace(
                "/student/login"
              );
            }}
            style={{
              marginTop: "25px",
              padding: "13px 25px",
              border: "none",
              borderRadius: "10px",
              background: "#2563eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Return to Login
          </button>
        </div>
      </main>
    );
  }

  // =====================================
  // EXAM INSTRUCTIONS
  // =====================================

  if (!examStarted) {
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
        <section
          style={{
            width: "100%",
            maxWidth: "750px",
            background: "white",
            borderRadius: "18px",
            padding: "40px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          <p
            style={{
              textAlign: "center",
              color: "#2563eb",
              fontWeight: "bold",
              letterSpacing: "2px",
              fontSize: "13px",
            }}
          >
            TRANCELLE INTERNATIONAL ACADEMY
          </p>

          <h1
            style={{
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            Examination Instructions
          </h1>

          <p
            style={{
              textAlign: "center",
              color: "#4b5563",
              lineHeight: "1.6",
              marginBottom: "30px",
            }}
          >
            Please carefully read all instructions
            before starting your examination.
          </p>

          <div
            style={{
              background: "#f8fafc",
              borderRadius: "12px",
              padding: "25px",
              lineHeight: "1.8",
              color: "#374151",
            }}
          >
            <h3>
              Examination Rules
            </h3>

            <ol
              style={{
                paddingLeft: "20px",
              }}
            >
              <li>
                The examination can be attempted
                only once.
              </li>

              <li>
                Once you click Start Examination,
                your examination attempt will be
                permanently locked.
              </li>

              <li>
                You must remain visible to the
                camera throughout the examination.
              </li>

              <li>
                Do not allow another person to
                appear in the camera.
              </li>

              <li>
                Do not repeatedly look away from
                the examination screen.
              </li>

              <li>
                Do not switch browser tabs or
                leave the examination page.
              </li>

              <li>
                The examination will request
                fullscreen mode.
              </li>

              <li>
                Leaving fullscreen mode may
                automatically end your
                examination.
              </li>

              <li>
                Once the examination is submitted
                or ended, you cannot attempt it
                again.
              </li>
            </ol>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginTop: "25px",
              cursor: "pointer",
              color: "#374151",
              lineHeight: "1.5",
            }}
          >
            <input
              type="checkbox"
              checked={
                instructionsAccepted
              }
              onChange={(
                event
              ) =>
                setInstructionsAccepted(
                  event.target.checked
                )
              }
              style={{
                marginTop: "4px",
              }}
            />

            <span>
              I have read and understood all
              examination instructions. I
              understand that this is a one-time
              examination attempt and I will not
              be able to take the examination
              again after clicking Start
              Examination.
            </span>
          </label>

          <button
            disabled={
              !instructionsAccepted ||
              startingExam
            }
            onClick={
              startExam
            }
            style={{
              width: "100%",
              marginTop: "30px",
              padding: "16px",
              border: "none",
              borderRadius: "10px",
              background:
                instructionsAccepted &&
                !startingExam
                  ? "#2563eb"
                  : "#9ca3af",
              color: "white",
              fontSize: "17px",
              fontWeight: "bold",
              cursor:
                instructionsAccepted &&
                !startingExam
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {startingExam
              ? "Starting Examination..."
              : "Start Examination →"}
          </button>
        </section>
      </main>
    );
  }

  // =====================================
  // EXAM FINISHED + RESULT SCREEN
  // =====================================

  if (examEnded) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f5f7fb",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "650px",
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

          <h1
            style={{
              color: "#16a34a",
              marginTop: "10px",
            }}
          >
            Examination Finished
          </h1>

          <p
            style={{
              color: "#4b5563",
              lineHeight: "1.6",
              fontSize: "17px",
            }}
          >
            Your examination attempt has ended and
            your result has been processed.
          </p>

          {resultLoading ? (
            <div
              style={{
                marginTop: "30px",
                padding: "30px",
                background: "#f8fafc",
                borderRadius: "14px",
              }}
            >
              <p>
                Loading your result...
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  marginTop: "30px",
                  padding: "30px",
                  background: "#f0fdf4",
                  border:
                    "1px solid #bbf7d0",
                  borderRadius: "14px",
                }}
              >
                <h2
                  style={{
                    marginTop: 0,
                    color: "#166534",
                  }}
                >
                  Your Result
                </h2>

                <p
                  style={{
                    margin: "15px 0",
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: "#111827",
                  }}
                >
                  Score:{" "}
                  {examScore !== null
                    ? examScore
                    : "--"}{" "}
                  /{" "}
                  {examTotalQuestions !==
                  null
                    ? examTotalQuestions
                    : questions.length}
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: "#16a34a",
                  }}
                >
                  Percentage:{" "}
                  {examPercentage !==
                  null
                    ? `${examPercentage}%`
                    : "--"}
                </p>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "25px",
                  background: "#f8fafc",
                  borderRadius: "14px",
                  textAlign: "left",
                  color: "#111827",
                }}
              >
                <h3
                  style={{
                    textAlign: "center",
                    marginTop: 0,
                  }}
                >
                  Examination Monitoring Summary
                </h3>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      padding: "12px",
                      background: "white",
                      borderRadius: "8px",
                    }}
                  >
                    <span>
                      Looking Away Warnings
                    </span>

                    <strong>
                      {lookingAwayCount}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      padding: "12px",
                      background: "white",
                      borderRadius: "8px",
                    }}
                  >
                    <span>
                      Person / Camera Warnings
                    </span>

                    <strong>
                      {personWarningCount}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      padding: "12px",
                      background: "white",
                      borderRadius: "8px",
                    }}
                  >
                    <span>
                      Tab Switches
                    </span>

                    <strong>
                      {tabSwitchCount}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}

          <div
            style={{
              marginTop: "25px",
              padding: "18px",
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              borderRadius: "12px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#dc2626",
                fontWeight: "bold",
                lineHeight: "1.6",
              }}
            >
              Your examination attempt has been
              permanently completed. You cannot
              start or take this examination again.
            </p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();

              router.replace(
                "/student/login"
              );
            }}
            style={{
              marginTop: "25px",
              padding: "14px 28px",
              border: "none",
              borderRadius: "10px",
              background: "#2563eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Return to Login
          </button>
        </div>
      </main>
    );
  }

  // =====================================
  // WARNING PORTAL
  // =====================================

  const warningModal =
    showWarning
      ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",

            background:
              "rgba(0,0,0,0.75)",

            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            padding: "20px",
            boxSizing: "border-box",

            zIndex: 2147483647,

            isolation: "isolate",

            pointerEvents: "auto",
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div
            style={{
              position: "relative",

              width: "100%",
              maxWidth: "500px",

              background: "white",

              borderRadius: "18px",

              padding: "35px",

              textAlign: "center",

              boxSizing: "border-box",

              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5)",

              zIndex: 2147483647,
            }}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div
              style={{
                width: "70px",
                height: "70px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                background:
                  warningTitle.includes(
                    "ENDED"
                  )
                    ? "#fee2e2"
                    : "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "35px",
              }}
            >
              {warningTitle.includes(
                "ENDED"
              )
                ? "🚫"
                : "⚠️"}
            </div>

            <h2
              style={{
                marginTop: 0,
                marginBottom: "15px",
                color:
                  warningTitle.includes(
                    "ENDED"
                  )
                    ? "#dc2626"
                    : "#d97706",
                fontSize: "25px",
              }}
            >
              {warningTitle}
            </h2>

            <p
              style={{
                color: "#374151",
                fontSize: "17px",
                lineHeight: "1.6",
                margin:
                  "0 0 10px",
              }}
            >
              {warningMessage}
            </p>

            {!examEnded && (
              <button
                onClick={
                  closeWarning
                }
                style={{
                  marginTop: "20px",
                  padding:
                    "13px 28px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  minWidth: "150px",
                }}
              >
                I Understand
              </button>
            )}
          </div>
        </div>
      )
      : null;

  // =====================================
  // MAIN EXAM PAGE
  // =====================================

  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          fontFamily:
            "Arial, sans-serif",
          color: "#111827",

          position: "relative",
          zIndex: 1,
        }}
      >
        <header
          style={{
            background: "#111827",
            color: "white",
            padding: "15px 25px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "1.5px",
                color: "#93c5fd",
              }}
            >
              TRANCELLE INTERNATIONAL ACADEMY
            </p>

            <h2
              style={{
                margin:
                  "5px 0 0",
                fontSize: "20px",
              }}
            >
              Online Examination
            </h2>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "#d1d5db",
              }}
            >
              Time Remaining
            </p>

            <strong
              style={{
                fontSize: "22px",
                color:
                  timeLeft <= 60
                    ? "#f87171"
                    : "#ffffff",
              }}
            >
              {formatTime(
                timeLeft
              )}
            </strong>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 320px",
            gap: "25px",
            padding: "25px",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <section
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "30px",
              boxShadow:
                "0 5px 20px rgba(0,0,0,0.08)",
            }}
          >
            <p
              style={{
                color: "#2563eb",
                fontWeight: "bold",
                marginTop: 0,
              }}
            >
              Question{" "}
              {currentQuestion + 1}{" "}
              of{" "}
              {questions.length}
            </p>

            <h2
              style={{
                fontSize: "24px",
                lineHeight: "1.5",
                marginBottom: "30px",
              }}
            >
              {
                questions[
                  currentQuestion
                ].question
              }
            </h2>

            <div
              style={{
                display: "grid",
                gap: "15px",
              }}
            >
              {questions[
                currentQuestion
              ].options.map(
                (option) => (
                  <button
                    key={option}
                    onClick={() =>
                      selectAnswer(
                        option
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "18px",
                      border:
                        answers[
                          currentQuestion
                        ] ===
                        option
                          ? "2px solid #2563eb"
                          : "1px solid #d1d5db",
                      borderRadius:
                        "10px",
                      background:
                        answers[
                          currentQuestion
                        ] ===
                        option
                          ? "#eff6ff"
                          : "white",
                      textAlign:
                        "left",
                      fontSize: "16px",
                      cursor:
                        "pointer",
                      color:
                        "#111827",
                    }}
                  >
                    {option}
                  </button>
                )
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "15px",
                marginTop: "35px",
              }}
            >
              <button
                onClick={() =>
                  setCurrentQuestion(
                    (previous) =>
                      Math.max(
                        0,
                        previous - 1
                      )
                  )
                }
                disabled={
                  currentQuestion ===
                  0
                }
                style={{
                  padding:
                    "13px 22px",
                  border: "none",
                  borderRadius:
                    "10px",
                  background:
                    currentQuestion ===
                    0
                      ? "#d1d5db"
                      : "#6b7280",
                  color: "white",
                  fontSize:
                    "16px",
                  fontWeight:
                    "bold",
                  cursor:
                    currentQuestion ===
                    0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                ← Previous
              </button>

              {currentQuestion <
              questions.length -
                1 ? (
                <button
                  onClick={() =>
                    setCurrentQuestion(
                      (previous) =>
                        Math.min(
                          questions.length -
                            1,
                          previous + 1
                        )
                    )
                  }
                  style={{
                    padding:
                      "13px 22px",
                    border: "none",
                    borderRadius:
                      "10px",
                    background:
                      "#2563eb",
                    color: "white",
                    fontSize:
                      "16px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => {
                    const unanswered =
                      answers.filter(
                        (
                          answer
                        ) =>
                          answer ===
                          ""
                      ).length;

                    if (
                      unanswered >
                      0
                    ) {
                      const confirmSubmit =
                        window.confirm(
                          `You still have ${unanswered} unanswered question(s). Do you want to submit the exam anyway?`
                        );

                      if (
                        !confirmSubmit
                      ) {
                        return;
                      }
                    } else {
                      const confirmSubmit =
                        window.confirm(
                          "Are you sure you want to submit your examination? You cannot take this examination again."
                        );

                      if (
                        !confirmSubmit
                      ) {
                        return;
                      }
                    }

                    submitExam();
                  }}
                  style={{
                    padding:
                      "13px 22px",
                    border: "none",
                    borderRadius:
                      "10px",
                    background:
                      "#dc2626",
                    color: "white",
                    fontSize:
                      "16px",
                    fontWeight:
                      "bold",
                    cursor:
                      "pointer",
                  }}
                >
                  Submit Exam
                </button>
              )}
            </div>

            {/* QUESTION NAVIGATION */}

            <div
              style={{
                marginTop: "35px",
                paddingTop: "25px",
                borderTop:
                  "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontWeight:
                    "bold",
                  marginBottom:
                    "15px",
                }}
              >
                Question Navigation
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {questions.map(
                  (_, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setCurrentQuestion(
                          index
                        )
                      }
                      style={{
                        width:
                          "42px",
                        height:
                          "42px",
                        borderRadius:
                          "8px",
                        border:
                          currentQuestion ===
                          index
                            ? "2px solid #111827"
                            : "1px solid #d1d5db",
                        background:
                          answers[
                            index
                          ]
                            ? "#dcfce7"
                            : currentQuestion ===
                              index
                            ? "#dbeafe"
                            : "white",
                        color:
                          "#111827",
                        fontWeight:
                          "bold",
                        cursor:
                          "pointer",
                      }}
                    >
                      {index + 1}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          {/* CAMERA MONITORING PANEL */}

          <aside
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.08)",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                Camera Monitoring
              </h3>

              <div
                style={{
                  width: "100%",
                  overflow:
                    "hidden",
                  borderRadius:
                    "12px",
                  background:
                    "#111827",
                  aspectRatio:
                    "4 / 3",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
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
                    objectFit:
                      "cover",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: "14px",
                  lineHeight:
                    "1.5",
                  color:
                    cameraReady
                      ? "#16a34a"
                      : "#dc2626",
                  marginBottom: 0,
                }}
              >
                {cameraStatus}
              </p>
            </div>

            {/* EXAM STATUS */}

            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "20px",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.08)",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                Examination Status
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding: "10px",
                    background:
                      "#f9fafb",
                    borderRadius:
                      "8px",
                  }}
                >
                  <span>
                    Questions Answered
                  </span>

                  <strong>
                    {
                      answers.filter(
                        (
                          answer
                        ) =>
                          answer !==
                          ""
                      ).length
                    }
                    /
                    {
                      questions.length
                    }
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding: "10px",
                    background:
                      "#f9fafb",
                    borderRadius:
                      "8px",
                  }}
                >
                  <span>
                    Camera
                  </span>

                  <strong
                    style={{
                      color:
                        cameraReady
                          ? "#16a34a"
                          : "#dc2626",
                    }}
                  >
                    {cameraReady
                      ? "Active"
                      : "Checking"}
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding: "10px",
                    background:
                      "#f9fafb",
                    borderRadius:
                      "8px",
                  }}
                >
                  <span>
                    People Detected
                  </span>

                  <strong>
                    {personCount ===
                    null
                      ? "Checking"
                      : personCount}
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding: "10px",
                    background:
                      "#f9fafb",
                    borderRadius:
                      "8px",
                  }}
                >
                  <span>
                    Looking Away Warnings
                  </span>

                  <strong>
                    {
                      lookingAwayCount
                    }
                    /5
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding: "10px",
                    background:
                      "#f9fafb",
                    borderRadius:
                      "8px",
                  }}
                >
                  <span>
                    Person Warnings
                  </span>

                  <strong>
                    {
                      personWarningCount
                    }
                    /5
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    padding: "10px",
                    background:
                      "#f9fafb",
                    borderRadius:
                      "8px",
                  }}
                >
                  <span>
                    Tab Switches
                  </span>

                  <strong>
                    {
                      tabSwitchCount
                    }
                    /3
                  </strong>
                </div>
              </div>
            </div>

            {/* SECURITY STATUS */}

            <div
              style={{
                background: "#eff6ff",
                border:
                  "1px solid #bfdbfe",
                borderRadius:
                  "16px",
                padding: "20px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  color: "#1d4ed8",
                }}
              >
                Security Monitoring
              </h3>

              <p
                style={{
                  color: "#1e40af",
                  lineHeight:
                    "1.6",
                  fontSize: "14px",
                  marginBottom: 0,
                }}
              >
                Your examination is being monitored
                using camera detection and examination
                security checks.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* ===================================== */}
      {/* WARNING MODAL - RENDERED OUTSIDE MAIN */}
      {/* ===================================== */}

      {typeof document !==
        "undefined" &&
        warningModal &&
        createPortal(
          warningModal,
          document.body
        )}
    </>
  );
}