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

const questions = [
  {
    question:
      "The word “Psychology” is derived from which language?",
    options: ["Latin", "Greek", "French"],
  },
  {
    question:
      "Who is known as the “Father of Psychology”?",
    options: [
      "Wilhelm Wundt",
      "Sigmund Freud",
      "John B. Watson",
    ],
  },
  {
    question:
      "Who defined Psychology as the “science of behavior”?",
    options: [
      "John B. Watson",
      "Sigmund Freud",
      "Edward Titchener",
    ],
  },
  {
    question:
      "What was the main aim of Structuralism in Psychology?",
    options: [
      "To study how the mind functions and helps people adapt to their environment",
      "To study the basic elements and structure of conscious experience",
      "To study only observable behavior",
    ],
  },
  {
    question:
      "What was the main focus of Functionalism in Psychology?",
    options: [
      "To understand how mental processes and behavior help individuals adapt to their environment",
      "To analyze consciousness into its basic elements",
      "To study behavior only through observable responses",
    ],
  },
  {
    question:
      "What does Behaviorism primarily focus on in the study of Psychology?",
    options: [
      "Unconscious conflicts and hidden desires",
      "The basic elements of conscious experience",
      "Observable and measurable behavior",
    ],
  },
  {
    question: "What is memory?",
    options: [
      "The ability to encode, store, and retrieve information",
      "The ability to see objects clearly",
      "The ability to control body temperature",
    ],
  },
  {
    question:
      "A student studies a new phone number and remembers it for only a few seconds while entering it into the phone. This is mainly an example of:",
    options: [
      "Short-term memory",
      "Long-term memory",
      "Procedural memory",
    ],
  },
  {
    question:
      "Which situation is the best example of short-term memory?",
    options: [
      "Remembering a phone number long enough to dial it",
      "Remembering your childhood home for many years",
      "Remembering how to ride a bicycle",
    ],
  },
  {
    question:
      "What is the simplest definition of Psychology?",
    options: [
      "The scientific study of behavior and mental processes",
      "The study of the human body only",
      "The study of plants and animals only",
    ],
  },
  {
    question:
      "A student who did not study for an exam says, “I failed because I was unlucky, not because I didn't study.” Which defense mechanism is this?",
    options: [
      "Rationalization",
      "Regression",
      "Repression",
    ],
  },
  {
    question:
      "According to Sigmund Freud’s Iceberg Theory, which part of the mind contains thoughts and feelings that are outside our immediate awareness?",
    options: [
      "Conscious mind",
      "Unconscious mind",
      "Physical mind",
    ],
  },
  {
    question:
      "After years of practice, a person can type on a keyboard without consciously thinking about the location of every key. This is mainly an example of:",
    options: [
      "Implicit/procedural memory",
      "Episodic memory",
      "Semantic memory",
    ],
  },
  {
    question:
      "A person automatically remembers how to tie their shoelaces even after not doing it for several months. This demonstrates:",
    options: [
      "Procedural memory",
      "Semantic memory",
      "Short-term memory",
    ],
  },
  {
    question:
      "A student fails an exam and says, “The teacher gave us an unfair question paper. I would have passed otherwise.” Which defense mechanism is this?",
    options: [
      "Rationalization",
      "Repression",
      "Sublimation",
    ],
  },
  {
    question:
      "A student who feels jealous of a classmate says, “That person is actually jealous of me.” Which defense mechanism is this?",
    options: [
      "Projection",
      "Regression",
      "Denial",
    ],
  },
  {
    question:
      "What does Structuralism in psychology mainly focus on?",
    options: [
      "The basic elements or structures of conscious experience",
      "Observable behavior only",
      "The unconscious mind only",
    ],
  },
  {
    question:
      "Pavlov's famous experiment involved:",
    options: [
      "Dogs and salivation",
      "Cats and puzzles",
      "Monkeys and language",
    ],
  },
  {
    question: "What is thinking?",
    options: [
      "The mental process of using information to form ideas, solve problems, and make decisions",
      "The process of storing information only for a few seconds",
      "The process of receiving information through the eyes only",
    ],
  },
  {
    question:
      "A child learns to say “thank you” after repeatedly being praised for saying it. This is an example of:",
    options: [
      "Learning through reinforcement",
      "False memory",
      "Sensory perception",
    ],
  },
  {
    question:
      "A person hears a rumor about an event and later remembers the rumor as if they personally witnessed the event. This is an example of:",
    options: [
      "False memory",
      "Procedural learning",
      "Sensory adaptation",
    ],
  },
  {
    question:
      "A student performs poorly in academics but tries very hard to become excellent in sports to compensate for the feeling of failure. Which defense mechanism is this?",
    options: [
      "Compensation",
      "Repression",
      "Displacement",
    ],
  },
  {
    question:
      "A student tries different methods to solve a difficult mathematics problem. This is an example of:",
    options: [
      "Problem-solving",
      "Sensory memory",
      "Perception only",
    ],
  },
  {
    question:
      "An adult becomes dependent, cries easily, and behaves like a young child when under extreme stress. Which defense mechanism is this?",
    options: [
      "Regression",
      "Rationalization",
      "Sublimation",
    ],
  },
  {
    question:
      "What does Functionalism mainly study?",
    options: [
      "The functions and purposes of mental processes and behavior",
      "The structure of consciousness only",
      "Dreams and unconscious conflicts only",
    ],
  },
  {
    question:
      "A person who is angry with their boss goes home and shouts at a family member. Which defense mechanism is this?",
    options: [
      "Displacement",
      "Projection",
      "Regression",
    ],
  },
  {
    question: "What is a false memory?",
    options: [
      "Remembering an event differently from how it actually happened, or remembering an event that did not happen",
      "Forgetting a phone number after a few seconds",
      "Learning a new physical skill",
    ],
  },
  {
    question:
      "Rahul remembers his first day at college, including where he sat and whom he met. This is:",
    options: [
      "Episodic memory",
      "Semantic memory",
      "Procedural memory",
    ],
  },
  {
    question:
      "Which of the following is an example of critical thinking?",
    options: [
      "Accepting every statement without questioning",
      "Evaluating evidence before making a conclusion",
      "Making decisions only based on emotions",
    ],
  },
  {
    question:
      "Which of the following is a basic human emotion?",
    options: [
      "Happiness",
      "Mathematics",
      "Intelligence",
    ],
  },
];

const correctAnswers = [
  "Greek",
  "Wilhelm Wundt",
  "John B. Watson",
  "To study the basic elements and structure of conscious experience",
  "To understand how mental processes and behavior help individuals adapt to their environment",
  "Observable and measurable behavior",
  "The ability to encode, store, and retrieve information",
  "Short-term memory",
  "Remembering a phone number long enough to dial it",
  "The scientific study of behavior and mental processes",
  "Rationalization",
  "Unconscious mind",
  "Implicit/procedural memory",
  "Procedural memory",
  "Rationalization",
  "Projection",
  "The basic elements or structures of conscious experience",
  "Dogs and salivation",
  "The mental process of using information to form ideas, solve problems, and make decisions",
  "Learning through reinforcement",
  "False memory",
  "Compensation",
  "Problem-solving",
  "Regression",
  "The functions and purposes of mental processes and behavior",
  "Displacement",
  "Remembering an event differently from how it actually happened, or remembering an event that did not happen",
  "Episodic memory",
  "Evaluating evidence before making a conclusion",
  "Happiness",
];

// =====================================
// EXAM AVAILABILITY
// =====================================

const EXAM_START_TIME =
  "2026-09-07T13:00:00+05:30";

const EXAM_END_TIME =
  "2026-09-08T00:00:00+05:30";

// =====================================
// EXAM DURATION
// =====================================

const EXAM_DURATION = 60 * 60;

// =====================================
// PERSON DETECTION SETTINGS
// =====================================

const PERSON_CONFIDENCE_THRESHOLD = 0.55;

// More than one person must remain detected
// continuously for 2.5 seconds before warning.
const MULTIPLE_PERSON_CONFIRMATION_MS = 2500;

// Maximum separate person incidents.
const MAX_PERSON_WARNINGS = 3;

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
  // PERSON-DETECTION INCIDENT REFS
  // =====================================

  // When did we first continuously detect
  // more than one person?
  const multiplePersonStartTimeRef =
    useRef<number | null>(null);

  // Prevents one continuous incident from
  // generating multiple warnings.
  const multiplePersonIncidentActiveRef =
    useRef(false);

  // Prevents overlapping AI detection calls.
  const aiDetectionRunningRef =
    useRef(false);

  // =====================================
  // EXAM TIME CHECK
  // =====================================

  const isExamTimeAvailable = () => {
    const now = new Date();

    const start =
      new Date(EXAM_START_TIME);

    const end =
      new Date(EXAM_END_TIME);

    return (
      now >= start &&
      now < end
    );
  };

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
  // LOGIN + ONE-TIME EXAM CHECK
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

      console.log(
        "================================"
      );

      console.log(
        "CURRENT AUTH USER ID:",
        session.user.id
      );

      console.log(
        "CURRENT AUTH EMAIL:",
        session.user.email
      );

      console.log(
        "STUDENT DATA:",
        student
      );

      console.log(
        "STUDENT ERROR:",
        error
      );

      console.log(
        "================================"
      );

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

      // =====================================
      // COMPLETED = PERMANENTLY LOCKED
      // =====================================

      if (
        student.exam_completed === true
      ) {
        setExamEnded(true);

        await fetchExamResult();

        setAuthorized(true);

        return;
      }

      // =====================================
      // STARTED = ALREADY USED
      // =====================================

      if (
        student.exam_started === true
      ) {
        setExamAlreadyUsed(true);

        setAuthorized(true);

        return;
      }

      // =====================================
      // NOT STARTED = ALLOWED
      // =====================================

      setExamAlreadyUsed(false);

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
        resultSavedRef.current = false;

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

        resultSavedRef.current = false;

        alert(
          "Exam ended, but the result could not be saved: " +
            error.message
        );

        return;
      }

      // =====================================
      // PERMANENTLY MARK EXAM COMPLETED
      // =====================================

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

      await fetchExamResult();
    } catch (error) {
      console.error(
        "Submit exam error:",
        error
      );

      resultSavedRef.current = false;

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
  // TIMER + MIDNIGHT HARD STOP
  // =====================================

  useEffect(() => {
    if (
      !examStarted ||
      examEnded
    ) {
      return;
    }

    const timer =
      setInterval(() => {
        const now =
          new Date();

        const examEnd =
          new Date(
            EXAM_END_TIME
          );

        // =====================================
        // MIDNIGHT HARD STOP
        // =====================================

        if (
          now >= examEnd
        ) {
          clearInterval(timer);

          setTimeLeft(0);

          setWarningTitle(
            "🚫 EXAM ENDED"
          );

          setWarningMessage(
            "The examination period ended at 12:00 AM on September 8, 2026. Your examination has been automatically submitted."
          );

          submitExam();

          return;
        }

        // =====================================
        // ONE-HOUR EXAM TIMER
        // =====================================

        setTimeLeft(
          (
            previousTime
          ) => {
            if (
              previousTime <= 1
            ) {
              clearInterval(timer);

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
      clearInterval(timer);
    };
  }, [
    examStarted,
    examEnded,
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

            setCameraReady(true);

            setCameraStatus(
              "Camera monitoring is active."
            );
          }

          // =====================================
          // LOAD COCO-SSD
          // =====================================

          const objectModel =
            await cocoSsd.load();

          // =====================================
          // LOAD MEDIAPIPE
          // =====================================

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

          // =====================================
          // AI DETECTION LOOP
          // =====================================

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

                // =====================================
                // PREVENT OVERLAPPING DETECTIONS
                // =====================================

                if (
                  aiDetectionRunningRef.current
                ) {
                  return;
                }

                aiDetectionRunningRef.current =
                  true;

                const video =
                  videoRef.current;

                if (
                  video.readyState <
                  2
                ) {
                  aiDetectionRunningRef.current =
                    false;

                  return;
                }

                try {
                  // =====================================
                  // PERSON DETECTION
                  // =====================================

                  const predictions =
                    await objectModel.detect(
                      video
                    );

                  const persons =
                    predictions.filter(
                      (prediction) =>
                        prediction.class ===
                          "person" &&
                        prediction.score >=
                          PERSON_CONFIDENCE_THRESHOLD
                    );

                  const detectedCount =
                    persons.length;

                  setPersonCount(
                    detectedCount
                  );

                  // =====================================
                  // IMPORTANT:
                  //
                  // 0 PEOPLE DOES NOT CREATE A
                  // PERSON WARNING.
                  //
                  // COCO-SSD can temporarily miss
                  // the student because of lighting,
                  // movement, camera quality, etc.
                  // =====================================

                  if (
                    detectedCount <= 1
                  ) {
                    multiplePersonStartTimeRef.current =
                      null;

                    multiplePersonIncidentActiveRef.current =
                      false;
                  }

                  // =====================================
                  // MULTIPLE PERSON DETECTION
                  //
                  // Must remain detected continuously
                  // for 2.5 seconds.
                  // =====================================

                  if (
                    detectedCount > 1
                  ) {
                    const now =
                      Date.now();

                    // Start timing the incident.
                    if (
                      multiplePersonStartTimeRef.current ===
                      null
                    ) {
                      multiplePersonStartTimeRef.current =
                        now;
                    }

                    const multiplePersonDuration =
                      now -
                      multiplePersonStartTimeRef.current;

                    // =====================================
                    // CONFIRMED AFTER 2.5 SECONDS
                    // =====================================

                    if (
                      multiplePersonDuration >=
                        MULTIPLE_PERSON_CONFIRMATION_MS &&
                      !multiplePersonIncidentActiveRef.current
                    ) {
                      // Lock this incident so the same
                      // continuous detection cannot produce
                      // another warning.
                      multiplePersonIncidentActiveRef.current =
                        true;

                      personWarningCountRef.current +=
                        1;

                      const newCount =
                        personWarningCountRef.current;

                      setPersonWarningCount(
                        newCount
                      );

                      // =====================================
                      // THIRD SEPARATE INCIDENT
                      // =====================================

                      if (
                        newCount >=
                        MAX_PERSON_WARNINGS
                      ) {
                        setWarningTitle(
                          "🚫 EXAM ENDED"
                        );

                        setWarningMessage(
                          "Your examination has been automatically ended because multiple people were detected on three separate confirmed occasions."
                        );

                        submitExam();

                        return;
                      }

                      // =====================================
                      // FIRST WARNING
                      // =====================================

                      if (
                        newCount ===
                        1
                      ) {
                        setWarningTitle(
                          "⚠️ PERSON DETECTION WARNING"
                        );

                        setWarningMessage(
                          "More than one person was continuously detected in the camera for 2.5 seconds. Please make sure you are the only person visible."
                        );
                      }

                      // =====================================
                      // SECOND / FINAL WARNING
                      // =====================================

                      else {
                        setWarningTitle(
                          "⚠️ FINAL PERSON DETECTION WARNING"
                        );

                        setWarningMessage(
                          "More than one person was detected again continuously for 2.5 seconds. This is your final person-detection warning. Another confirmed incident may end your examination."
                        );
                      }

                      showWarningRef.current =
                        true;

                      setShowWarning(true);

                      return;
                    }
                  }

                  // =====================================
                  // FACE DIRECTION
                  // =====================================

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

                  // =====================================
                  // LOOKING AWAY WARNING
                  // =====================================

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

                    setShowWarning(true);
                  }
                } catch (
                  detectionError
                ) {
                  console.error(
                    "AI detection error:",
                    detectionError
                  );
                } finally {
                  aiDetectionRunningRef.current =
                    false;
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

      aiDetectionRunningRef.current =
        false;

      multiplePersonStartTimeRef.current =
        null;

      multiplePersonIncidentActiveRef.current =
        false;

      if (stream) {
        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      }
    };
  }, [
    examStarted,
    authorized,
  ]);

  // =====================================
  // START EXAM
  // DIRECT ONE-TIME DATABASE LOCK
  // NO start_exam RPC
  // =====================================

  const startExam = async () => {
    if (
      !instructionsAccepted ||
      startingExam
    ) {
      return;
    }

    try {
      setStartingExam(true);

      // =====================================
      // CHECK EXAM TIME
      // =====================================

      if (
        !isExamTimeAvailable()
      ) {
        alert(
          "The examination is available only from 1:00 PM on September 7, 2026 until 12:00 AM on September 8, 2026."
        );

        return;
      }

      // =====================================
      // GET CURRENT USER
      // =====================================

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

      // =====================================
      // CHECK ONE-TIME STATUS
      // =====================================

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
          "Unable to verify your examination status."
        );

        return;
      }

      // =====================================
      // ALREADY STARTED OR COMPLETED
      // =====================================

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

      // =====================================
      // ONE-TIME DATABASE LOCK
      // =====================================

      const {
        data: lockedStudent,
        error: lockError,
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
        )
        .eq(
          "exam_completed",
          false
        )
        .select(
          "exam_started, exam_completed"
        )
        .maybeSingle();

      if (lockError) {
        console.error(
          "Exam lock error:",
          lockError
        );

        alert(
          "The examination could not be started. Please try again."
        );

        return;
      }

      // =====================================
      // VERIFY DATABASE LOCK
      // =====================================

      if (
        !lockedStudent ||
        lockedStudent.exam_started !== true
      ) {
        console.error(
          "Exam was not successfully locked in the database."
        );

        alert(
          "The examination could not be started."
        );

        return;
      }

      // =====================================
      // REQUEST FULLSCREEN
      // =====================================

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

      // =====================================
      // START EXAM UI
      // =====================================

      setExamAlreadyUsed(false);

      setExamStarted(true);

      setTimeLeft(
        EXAM_DURATION
      );

      // =====================================
      // RESET MONITORING COUNTERS
      // =====================================

      setPersonCount(null);

      setPersonWarningCount(0);

      setLookingAwayCount(0);

      setTabSwitchCount(0);

      personWarningCountRef.current = 0;

      lookingAwayCountRef.current = 0;

      tabSwitchCountRef.current = 0;

      resultSavedRef.current = false;

      multiplePersonStartTimeRef.current =
        null;

      multiplePersonIncidentActiveRef.current =
        false;

      aiDetectionRunningRef.current =
        false;
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
      setStartingExam(false);
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
    if (examEnded) {
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

      setShowWarning(false);
    };

  // =====================================
  // EXAM ACCESS CHECK
  // =====================================

  if (
    authorized === null
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontFamily:
            "Arial, sans-serif",
          background:
            "#f5f7fb",
        }}
      >
        <p>
          Checking examination access...
        </p>
      </main>
    );
  }

  // =====================================
  // EXAM ALREADY USED
  // =====================================

  if (
    examAlreadyUsed
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          background:
            "#f5f7fb",
          display:
            "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          padding:
            "20px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width:
              "100%",
            maxWidth:
              "600px",
            background:
              "white",
            padding:
              "40px",
            borderRadius:
              "18px",
            textAlign:
              "center",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          <h1
            style={{
              color:
                "#dc2626",
            }}
          >
            Examination Unavailable
          </h1>

          <p
            style={{
              fontSize:
                "18px",
              lineHeight:
                "1.6",
              color:
                "#4b5563",
            }}
          >
            This examination attempt has already
            been used.
          </p>

          <p
            style={{
              marginTop:
                "20px",
              color:
                "#dc2626",
              fontWeight:
                "bold",
              lineHeight:
                "1.6",
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
              marginTop:
                "25px",
              padding:
                "13px 25px",
              border:
                "none",
              borderRadius:
                "10px",
              background:
                "#2563eb",
              color:
                "white",
              fontSize:
                "16px",
              fontWeight:
                "bold",
              cursor:
                "pointer",
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

  if (
    !examStarted
  ) {
    const examAvailable =
      isExamTimeAvailable();

    return (
      <main
        style={{
          minHeight:
            "100vh",
          background:
            "#f5f7fb",
          display:
            "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          padding:
            "20px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <section
          style={{
            width:
              "100%",
            maxWidth:
              "750px",
            background:
              "white",
            borderRadius:
              "18px",
            padding:
              "40px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.12)",
          }}
        >
          <p
            style={{
              textAlign:
                "center",
              color:
                "#2563eb",
              fontWeight:
                "bold",
              letterSpacing:
                "2px",
              fontSize:
                "13px",
            }}
          >
            TRANCELLE INTERNATIONAL ACADEMY
          </p>

          <h1
            style={{
              textAlign:
                "center",
              marginBottom:
                "10px",
            }}
          >
            Examination Instructions
          </h1>

          <div
            style={{
              margin:
                "20px 0 25px",
              padding:
                "18px",
              background:
                examAvailable
                  ? "#f0fdf4"
                  : "#fff7ed",
              border:
                examAvailable
                  ? "1px solid #bbf7d0"
                  : "1px solid #fed7aa",
              borderRadius:
                "12px",
              textAlign:
                "center",
            }}
          >
            <strong
              style={{
                color:
                  examAvailable
                    ? "#15803d"
                    : "#c2410c",
                fontSize:
                  "17px",
              }}
            >
              {examAvailable
                ? "Examination is currently available"
                : "Examination is currently unavailable"}
            </strong>

            <p
              style={{
                margin:
                  "8px 0 0",
                color:
                  "#374151",
                lineHeight:
                  "1.5",
              }}
            >
              Exam Date:{" "}
              <strong>
                September 7–8, 2026
              </strong>
              <br />
              Available Time:{" "}
              <strong>
                1:00 PM Sep 7 – 12:00 AM Sep 8 IST
              </strong>
            </p>
          </div>

          <p
            style={{
              textAlign:
                "center",
              color:
                "#4b5563",
              lineHeight:
                "1.6",
              marginBottom:
                "30px",
            }}
          >
            Please carefully read all instructions
            before starting your examination.
          </p>

          <div
            style={{
              background:
                "#f8fafc",
              borderRadius:
                "12px",
              padding:
                "25px",
              lineHeight:
                "1.8",
              color:
                "#374151",
            }}
          >
            <h3>
              Examination Rules
            </h3>

            <ol
              style={{
                paddingLeft:
                  "20px",
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
                The examination can only be started
                between 1:00 PM on September 7,
                2026 and 12:00 AM on September 8,
                2026.
              </li>

              <li>
                The examination period ends
                automatically at 12:00 AM on
                September 8, 2026.
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
                automatically end your examination.
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
              display:
                "flex",
              alignItems:
                "flex-start",
              gap:
                "12px",
              marginTop:
                "25px",
              cursor:
                examAvailable
                  ? "pointer"
                  : "not-allowed",
              color:
                "#374151",
              lineHeight:
                "1.5",
            }}
          >
            <input
              type="checkbox"
              checked={
                instructionsAccepted
              }
              disabled={
                !examAvailable
              }
              onChange={(
                event
              ) =>
                setInstructionsAccepted(
                  event.target.checked
                )
              }
              style={{
                marginTop:
                  "4px",
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
              startingExam ||
              !examAvailable
            }
            onClick={
              startExam
            }
            style={{
              width:
                "100%",
              marginTop:
                "30px",
              padding:
                "16px",
              border:
                "none",
              borderRadius:
                "10px",
              background:
                instructionsAccepted &&
                !startingExam &&
                examAvailable
                  ? "#2563eb"
                  : "#9ca3af",
              color:
                "white",
              fontSize:
                "17px",
              fontWeight:
                "bold",
              cursor:
                instructionsAccepted &&
                !startingExam &&
                examAvailable
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {startingExam
              ? "Starting Examination..."
              : !examAvailable
              ? "Examination Not Available"
              : "Start Examination →"}
          </button>
        </section>
      </main>
    );
  }

  // =====================================
  // EXAM FINISHED + RESULT SCREEN
  // =====================================

  if (
    examEnded
  ) {
    return (
      <main
        style={{
          minHeight:
            "100vh",
          background:
            "#f5f7fb",
          display:
            "flex",
          justifyContent:
            "center",
          alignItems:
            "center",
          padding:
            "20px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width:
              "100%",
            maxWidth:
              "650px",
            background:
              "white",
            padding:
              "40px",
            borderRadius:
              "18px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.12)",
            textAlign:
              "center",
          }}
        >
          <p
            style={{
              color:
                "#2563eb",
              fontWeight:
                "bold",
              letterSpacing:
                "2px",
              fontSize:
                "13px",
            }}
          >
            TRANCELLE INTERNATIONAL ACADEMY
          </p>

          <h1
            style={{
              color:
                "#16a34a",
              marginTop:
                "10px",
            }}
          >
            Examination Finished
          </h1>

          <p
            style={{
              color:
                "#4b5563",
              lineHeight:
                "1.6",
              fontSize:
                "17px",
            }}
          >
            Your examination attempt has ended and
            your result has been processed.
          </p>

          {resultLoading ? (
            <div
              style={{
                marginTop:
                  "30px",
                padding:
                  "30px",
                background:
                  "#f8fafc",
                borderRadius:
                  "14px",
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
                  marginTop:
                    "30px",
                  padding:
                    "30px",
                  background:
                    "#f0fdf4",
                  border:
                    "1px solid #bbf7d0",
                  borderRadius:
                    "14px",
                }}
              >
                <h2
                  style={{
                    marginTop:
                      0,
                    color:
                      "#166534",
                  }}
                >
                  Your Result
                </h2>

                <p
                  style={{
                    margin:
                      "15px 0",
                    fontSize:
                      "28px",
                    fontWeight:
                      "bold",
                    color:
                      "#111827",
                  }}
                >
                  Score:{" "}
                  {examScore !==
                  null
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
                    margin:
                      0,
                    fontSize:
                      "22px",
                    fontWeight:
                      "bold",
                    color:
                      "#16a34a",
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
                  marginTop:
                    "20px",
                  padding:
                    "25px",
                  background:
                    "#f8fafc",
                  borderRadius:
                    "14px",
                  textAlign:
                    "left",
                  color:
                    "#111827",
                }}
              >
                <h3
                  style={{
                    textAlign:
                      "center",
                    marginTop:
                      0,
                  }}
                >
                  Examination Monitoring Summary
                </h3>

                <div
                  style={{
                    display:
                      "grid",
                    gap:
                      "12px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "12px",
                      background:
                        "white",
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
                    </strong>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "12px",
                      background:
                        "white",
                      borderRadius:
                        "8px",
                    }}
                  >
                    <span>
                      Person / Camera Warnings
                    </span>

                    <strong>
                      {
                        personWarningCount
                      }
                    </strong>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      padding:
                        "12px",
                      background:
                        "white",
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
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}

          <div
            style={{
              marginTop:
                "25px",
              padding:
                "18px",
              background:
                "#fef2f2",
              border:
                "1px solid #fecaca",
              borderRadius:
                "12px",
            }}
          >
            <p
              style={{
                margin:
                  0,
                color:
                  "#dc2626",
                fontWeight:
                  "bold",
                lineHeight:
                  "1.6",
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
              marginTop:
                "25px",
              padding:
                "14px 28px",
              border:
                "none",
              borderRadius:
                "10px",
              background:
                "#2563eb",
              color:
                "white",
              fontSize:
                "16px",
              fontWeight:
                "bold",
              cursor:
                "pointer",
            }}
          >
            Return to Login
          </button>
        </div>
      </main>
    );
  }

  // =====================================
  // WARNING MODAL
  // =====================================

  const warningModal =
    showWarning
      ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position:
              "fixed",
            top:
              0,
            left:
              0,
            right:
              0,
            bottom:
              0,
            width:
              "100vw",
            height:
              "100vh",
            background:
              "rgba(0,0,0,0.75)",
            display:
              "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            padding:
              "20px",
            boxSizing:
              "border-box",
            zIndex:
              2147483647,
            isolation:
              "isolate",
          }}
        >
          <div
            style={{
              width:
                "100%",
              maxWidth:
                "500px",
              background:
                "white",
              borderRadius:
                "18px",
              padding:
                "35px",
              textAlign:
                "center",
              boxSizing:
                "border-box",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width:
                  "70px",
                height:
                  "70px",
                margin:
                  "0 auto 20px",
                borderRadius:
                  "50%",
                background:
                  warningTitle.includes(
                    "ENDED"
                  )
                    ? "#fee2e2"
                    : "#fef3c7",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                fontSize:
                  "35px",
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
                marginTop:
                  0,
                marginBottom:
                  "15px",
                color:
                  warningTitle.includes(
                    "ENDED"
                  )
                    ? "#dc2626"
                    : "#d97706",
                fontSize:
                  "25px",
              }}
            >
              {
                warningTitle
              }
            </h2>

            <p
              style={{
                color:
                  "#374151",
                fontSize:
                  "17px",
                lineHeight:
                  "1.6",
                margin:
                  "0 0 10px",
              }}
            >
              {
                warningMessage
              }
            </p>

            {!examEnded && (
              <button
                onClick={
                  closeWarning
                }
                style={{
                  marginTop:
                    "20px",
                  padding:
                    "13px 28px",
                  border:
                    "none",
                  borderRadius:
                    "10px",
                  background:
                    "#2563eb",
                  color:
                    "white",
                  fontSize:
                    "16px",
                  fontWeight:
                    "bold",
                  cursor:
                    "pointer",
                  minWidth:
                    "150px",
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
          minHeight:
            "100vh",
          background:
            "#f3f4f6",
          fontFamily:
            "Arial, sans-serif",
          color:
            "#111827",
          position:
            "relative",
          zIndex:
            1,
        }}
      >
        <header
          style={{
            background:
              "#111827",
            color:
              "white",
            padding:
              "15px 25px",
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            position:
              "sticky",
            top:
              0,
            zIndex:
              100,
          }}
        >
          <div>
            <p
              style={{
                margin:
                  0,
                fontSize:
                  "12px",
                letterSpacing:
                  "1.5px",
                color:
                  "#93c5fd",
              }}
            >
              TRANCELLE INTERNATIONAL ACADEMY
            </p>

            <h2
              style={{
                margin:
                  "5px 0 0",
                fontSize:
                  "20px",
              }}
            >
              Online Examination
            </h2>
          </div>

          <div
            style={{
              textAlign:
                "right",
            }}
          >
            <p
              style={{
                margin:
                  0,
                fontSize:
                  "12px",
                color:
                  "#d1d5db",
              }}
            >
              Time Remaining
            </p>

            <strong
              style={{
                fontSize:
                  "22px",
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
            display:
              "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 320px",
            gap:
              "25px",
            padding:
              "25px",
            maxWidth:
              "1400px",
            margin:
              "0 auto",
          }}
        >
          <section
            style={{
              background:
                "white",
              borderRadius:
                "16px",
              padding:
                "30px",
              boxShadow:
                "0 5px 20px rgba(0,0,0,0.08)",
            }}
          >
            <p
              style={{
                color:
                  "#2563eb",
                fontWeight:
                  "bold",
                marginTop:
                  0,
              }}
            >
              Question{" "}
              {currentQuestion +
                1}{" "}
              of{" "}
              {questions.length}
            </p>

            <h2
              style={{
                fontSize:
                  "24px",
                lineHeight:
                  "1.5",
                marginBottom:
                  "30px",
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
                display:
                  "grid",
                gap:
                  "15px",
              }}
            >
              {questions[
                currentQuestion
              ].options.map(
                (
                  option
                ) => (
                  <button
                    key={
                      option
                    }
                    onClick={() =>
                      selectAnswer(
                        option
                      )
                    }
                    style={{
                      width:
                        "100%",
                      padding:
                        "18px",
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
                      fontSize:
                        "16px",
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
                display:
                  "flex",
                justifyContent:
                  "space-between",
                gap:
                  "15px",
                marginTop:
                  "35px",
              }}
            >
              <button
                onClick={() =>
                  setCurrentQuestion(
                    (
                      previous
                    ) =>
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
                  border:
                    "none",
                  borderRadius:
                    "10px",
                  background:
                    currentQuestion ===
                    0
                      ? "#d1d5db"
                      : "#6b7280",
                  color:
                    "white",
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
                      (
                        previous
                      ) =>
                        Math.min(
                          questions.length -
                            1,
                          previous +
                            1
                        )
                    )
                  }
                  style={{
                    padding:
                      "13px 22px",
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    background:
                      "#2563eb",
                    color:
                      "white",
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
                    border:
                      "none",
                    borderRadius:
                      "10px",
                    background:
                      "#dc2626",
                    color:
                      "white",
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

            <div
              style={{
                marginTop:
                  "35px",
                paddingTop:
                  "25px",
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
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "10px",
                }}
              >
                {questions.map(
                  (
                    _,
                    index
                  ) => (
                    <button
                      key={
                        index
                      }
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
                      {index +
                        1}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          {/* =====================================
              CAMERA MONITORING PANEL
          ===================================== */}

          <aside
            style={{
              display:
                "flex",
              flexDirection:
                "column",
              gap:
                "20px",
            }}
          >
            <div
              style={{
                background:
                  "white",
                borderRadius:
                  "16px",
                padding:
                  "20px",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.08)",
              }}
            >
              <h3
                style={{
                  marginTop:
                    0,
                }}
              >
                Camera Monitoring
              </h3>

              <div
                style={{
                  width:
                    "100%",
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
                  ref={
                    videoRef
                  }
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width:
                      "100%",
                    height:
                      "100%",
                    objectFit:
                      "cover",
                  }}
                />
              </div>

              <p
                style={{
                  fontSize:
                    "14px",
                  lineHeight:
                    "1.5",
                  color:
                    cameraReady
                      ? "#16a34a"
                      : "#dc2626",
                  marginBottom:
                    0,
                }}
              >
                {
                  cameraStatus
                }
              </p>
            </div>

            {/* =====================================
                EXAM STATUS
            ===================================== */}

            <div
              style={{
                background:
                  "white",
                borderRadius:
                  "16px",
                padding:
                  "20px",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.08)",
              }}
            >
              <h3
                style={{
                  marginTop:
                    0,
                }}
              >
                Examination Status
              </h3>

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "12px",
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
                    padding:
                      "10px",
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
                    padding:
                      "10px",
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
                    padding:
                      "10px",
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
                    padding:
                      "10px",
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
                    padding:
                      "10px",
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
                    /3
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
                    padding:
                      "10px",
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

            {/* =====================================
                SECURITY STATUS
            ===================================== */}

            <div
              style={{
                background:
                  "#eff6ff",
                border:
                  "1px solid #bfdbfe",
                borderRadius:
                  "16px",
                padding:
                  "20px",
              }}
            >
              <h3
                style={{
                  marginTop:
                    0,
                  color:
                    "#1d4ed8",
                }}
              >
                Security Monitoring
              </h3>

              <p
                style={{
                  color:
                    "#1e40af",
                  lineHeight:
                    "1.6",
                  fontSize:
                    "14px",
                  marginBottom:
                    0,
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

      {/* =====================================
          WARNING MODAL PORTAL
      ===================================== */}

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