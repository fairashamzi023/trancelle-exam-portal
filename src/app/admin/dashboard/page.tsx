"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type StudentData = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  warnings: number;
  lookingAwayWarnings: number;
  tabSwitches: number;
  score: string;
  percentage: number;
};

type StudentFaceData = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  faceImageUrl: string;
  createdAt: string;
};

type SidebarOption =
  | "Dashboard"
  | "Registered Students"
  | "Search Students"
  | "Exam Results"
  | "Active Exams"
  | "Completed Exams"
  | "Violations"
  | "Looking Away Records"
  | "Camera Monitoring"
  | "Student Faces"
  | "Admin Settings";

const ALLOWED_ADMINS = [
  "kcds2025trancelle@gmail.com",
  "trancelleinternational25@gmail.com",
];

export default function AdminDashboard() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [studentFaces, setStudentFaces] =
    useState<StudentFaceData[]>([]);

  const [activeSection, setActiveSection] =
    useState<SidebarOption>("Dashboard");

  const [searchStudent, setSearchStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [authChecking, setAuthChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // =====================================
  // CHECK ADMIN AUTHENTICATION
  // =====================================

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // No logged-in user
        if (!user) {
          window.location.href = "/admin";
          return;
        }

        const userEmail = user.email?.trim().toLowerCase();

        // User is not one of the two authorized admins
        if (
          !userEmail ||
          !ALLOWED_ADMINS.includes(userEmail)
        ) {
          await supabase.auth.signOut();
          window.location.href = "/admin";
          return;
        }

        // Authorized admin
        setAuthorized(true);
        setAuthChecking(false);

        loadStudents();
      } catch (error) {
        console.error(
          "Admin authentication error:",
          error
        );

        await supabase.auth.signOut();
        window.location.href = "/admin";
      }
    };

    checkAdminAccess();
  }, []);

  // =====================================
  // LOAD STUDENTS + EXAM RESULTS + FACES
  // =====================================

  const loadStudents = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      // =====================================
      // LOAD ALL REGISTERED STUDENTS
      // =====================================

      const {
        data: studentData,
        error: studentError,
      } = await supabase
        .from("students")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (studentError) {
        console.error(
          "Students Supabase error:",
          studentError
        );

        setErrorMessage(
          "Unable to load registered students: " +
            studentError.message
        );

        setStudents([]);
        return;
      }

      // =====================================
      // LOAD EXAM RESULTS
      // =====================================

      const {
        data: examData,
        error: examError,
      } = await supabase
        .from("exam_results")
        .select("*");

      if (examError) {
        console.warn(
          "Exam results could not be loaded:",
          examError.message
        );
      }

      // =====================================
      // LOAD REGISTERED STUDENT FACES
      // =====================================

      const {
        data: faceData,
        error: faceError,
      } = await supabase
        .from("student_faces")
        .select("*");

      if (faceError) {
        console.warn(
          "Student faces could not be loaded:",
          faceError.message
        );

        setStudentFaces([]);
      } else {
        const convertedFaces: StudentFaceData[] =
          (faceData || []).map((face: any) => {
            const student =
              (studentData || []).find(
                (item: any) =>
                  item.id === face.student_id
              );

            return {
              id: face.id,
              studentId: face.student_id,
              fullName:
                student?.full_name ||
                "Unknown Student",
              email:
                student?.email ||
                "No email",
              faceImageUrl:
                face.face_image_url || "",
              createdAt:
                face.created_at || "",
            };
          });

        setStudentFaces(convertedFaces);
      }

      // =====================================
      // CONVERT STUDENT DATA
      // =====================================

      const convertedStudents: StudentData[] =
        (studentData || []).map((student: any) => {
          const examResult =
            (examData || []).find(
              (result: any) =>
                result.student_id ===
                student.user_id
            );

          return {
            id:
              student.id ||
              student.user_id ||
              Math.random().toString(),

            fullName:
              student.full_name ||
              "Unknown Student",

            email:
              student.email ||
              "No email",

            phone:
              student.phone ||
              "Not available",

            status: examResult
              ? "Completed"
              : "Registered",

            warnings:
              Number(
                examResult?.person_object_warnings
              ) || 0,

            lookingAwayWarnings:
              Number(
                examResult?.looking_away_warnings
              ) || 0,

            tabSwitches:
              Number(
                examResult?.tab_switches
              ) || 0,

            score: examResult
              ? `${examResult.score || 0} / ${
                  examResult.total_questions || 0
                }`
              : "Not attempted",

            percentage:
              Number(examResult?.percentage) || 0,
          };
        });

      setStudents(convertedStudents);
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading student data."
      );

      setStudents([]);
      setStudentFaces([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // AUTHENTICATION CHECK SCREEN
  // =====================================

  if (authChecking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f7fb",
          fontFamily: "Arial, sans-serif",
          color: "#111827",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h2>Checking administrator access...</h2>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  // =====================================
  // BLOCK UNAUTHORIZED ACCESS
  // =====================================

  if (!authorized) {
    return null;
  }

  // =====================================
  // DASHBOARD STATISTICS
  // =====================================

  const totalStudents = students.length;

  const activeExams = students.filter(
    (student) =>
      student.status === "Active"
  ).length;

  const completedExams = students.filter(
    (student) =>
      student.status === "Completed"
  ).length;

  const totalViolations = students.reduce(
    (total, student) =>
      total +
      student.warnings +
      student.lookingAwayWarnings +
      student.tabSwitches,
    0
  );

  // =====================================
  // SEARCH
  // =====================================

  const filteredStudents = students.filter(
    (student) => {
      const search =
        searchStudent.toLowerCase();

      return (
        student.fullName
          .toLowerCase()
          .includes(search) ||
        student.email
          .toLowerCase()
          .includes(search)
      );
    }
  );

  // =====================================
  // PAGE CONTENT
  // =====================================

  const renderContent = () => {
    // =====================================
    // DASHBOARD
    // =====================================

    if (activeSection === "Dashboard") {
      return (
        <>
          <div style={headerStyle}>
            <p style={academyStyle}>
              TRANCELLE INTERNATIONAL ACADEMY
            </p>

            <h1
              style={{
                margin: "8px 0",
              }}
            >
              Administrator Dashboard
            </h1>

            <p
              style={{
                color: "#6b7280",
              }}
            >
              Examination Management & Student
              Monitoring
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginBottom: "35px",
            }}
          >
            <DashboardCard
              title="Total Students"
              value={String(totalStudents)}
              description="Registered students"
            />

            <DashboardCard
              title="Active Exams"
              value={String(activeExams)}
              description="Currently taking exams"
            />

            <DashboardCard
              title="Completed Exams"
              value={String(completedExams)}
              description="Successfully submitted"
            />

            <DashboardCard
              title="Violations"
              value={String(totalViolations)}
              description="Warnings detected"
            />
          </div>

          {errorMessage && (
            <ErrorBox message={errorMessage} />
          )}

          <StudentTable
            students={students}
            loading={loading}
          />
        </>
      );
    }

    // =====================================
    // REGISTERED STUDENTS
    // =====================================

    if (
      activeSection ===
      "Registered Students"
    ) {
      return (
        <>
          <PageTitle
            title="Registered Students"
            description="View all students registered in the examination system."
          />

          <DashboardCard
            title="Total Students"
            value={String(totalStudents)}
            description="Students registered in the system"
          />

          <div
            style={{
              marginTop: "30px",
            }}
          >
            <StudentTable
              students={students}
              loading={loading}
            />
          </div>
        </>
      );
    }

    // =====================================
    // SEARCH STUDENTS
    // =====================================

    if (
      activeSection ===
      "Search Students"
    ) {
      return (
        <>
          <PageTitle
            title="Search Students"
            description="Search for a student using their name or email address."
          />

          <div style={contentCardStyle}>
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchStudent}
              onChange={(event) =>
                setSearchStudent(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "8px",
                border:
                  "1px solid #d1d5db",
                fontSize: "16px",
                boxSizing:
                  "border-box",
                marginBottom: "25px",
              }}
            />

            {loading ? (
              <EmptyMessage message="Loading students..." />
            ) : searchStudent ? (
              filteredStudents.length > 0 ? (
                <StudentTable
                  students={filteredStudents}
                  loading={false}
                />
              ) : (
                <EmptyMessage message="No student found." />
              )
            ) : (
              <EmptyMessage
                message="Start typing to search for a student."
              />
            )}
          </div>
        </>
      );
    }

    // =====================================
    // EXAM RESULTS
    // =====================================

    if (
      activeSection ===
      "Exam Results"
    ) {
      return (
        <>
          <PageTitle
            title="Exam Results"
            description="View student examination scores and results."
          />

          <StudentTable
            students={students.filter(
              (student) =>
                student.status ===
                "Completed"
            )}
            loading={loading}
          />
        </>
      );
    }

    // =====================================
    // ACTIVE EXAMS
    // =====================================

    if (
      activeSection ===
      "Active Exams"
    ) {
      const activeStudents =
        students.filter(
          (student) =>
            student.status ===
            "Active"
        );

      return (
        <>
          <PageTitle
            title="Active Exams"
            description="Students currently taking an examination."
          />

          {activeStudents.length > 0 ? (
            <StudentTable
              students={activeStudents}
              loading={loading}
            />
          ) : (
            <div
              style={contentCardStyle}
            >
              <EmptyMessage
                message="No students are currently taking an examination."
              />
            </div>
          )}
        </>
      );
    }

    // =====================================
    // COMPLETED EXAMS
    // =====================================

    if (
      activeSection ===
      "Completed Exams"
    ) {
      const completedStudents =
        students.filter(
          (student) =>
            student.status ===
            "Completed"
        );

      return (
        <>
          <PageTitle
            title="Completed Exams"
            description="Students who have completed their examination."
          />

          {completedStudents.length > 0 ? (
            <StudentTable
              students={completedStudents}
              loading={loading}
            />
          ) : (
            <div
              style={contentCardStyle}
            >
              <EmptyMessage
                message="No completed examinations yet."
              />
            </div>
          )}
        </>
      );
    }

    // =====================================
    // VIOLATIONS
    // =====================================

    if (
      activeSection ===
      "Violations"
    ) {
      return (
        <>
          <PageTitle
            title="Violations"
            description="Person, object, looking-away, and tab-switch violations."
          />

          <div
            style={contentCardStyle}
          >
            {loading ? (
              <EmptyMessage
                message="Loading violation records..."
              />
            ) : students.length === 0 ? (
              <EmptyMessage
                message="No violation records available."
              />
            ) : (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: "700px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          "#f3f4f6",
                        textAlign:
                          "left",
                      }}
                    >
                      <th style={tableHeaderStyle}>
                        Student
                      </th>

                      <th style={tableHeaderStyle}>
                        Person/Object
                      </th>

                      <th style={tableHeaderStyle}>
                        Looking Away
                      </th>

                      <th style={tableHeaderStyle}>
                        Tab Switches
                      </th>

                      <th style={tableHeaderStyle}>
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (student) => (
                        <tr
                          key={
                            student.id
                          }
                        >
                          <td style={tableCellStyle}>
                            <strong>
                              {
                                student.fullName
                              }
                            </strong>

                            <br />

                            <span
                              style={{
                                color:
                                  "#6b7280",
                                fontSize:
                                  "13px",
                              }}
                            >
                              {
                                student.email
                              }
                            </span>
                          </td>

                          <td style={tableCellStyle}>
                            {
                              student.warnings
                            }
                          </td>

                          <td style={tableCellStyle}>
                            {
                              student.lookingAwayWarnings
                            }
                          </td>

                          <td style={tableCellStyle}>
                            {
                              student.tabSwitches
                            }
                          </td>

                          <td style={tableCellStyle}>
                            {student.warnings +
                              student.lookingAwayWarnings +
                              student.tabSwitches}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      );
    }

    // =====================================
    // LOOKING AWAY
    // =====================================

    if (
      activeSection ===
      "Looking Away Records"
    ) {
      return (
        <>
          <PageTitle
            title="Looking Away Records"
            description="Records of students detected looking away from the examination screen."
          />

          <div
            style={contentCardStyle}
          >
            {loading ? (
              <EmptyMessage
                message="Loading records..."
              />
            ) : students.length === 0 ? (
              <EmptyMessage
                message="No looking-away records available."
              />
            ) : (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: "600px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          "#f3f4f6",
                        textAlign:
                          "left",
                      }}
                    >
                      <th style={tableHeaderStyle}>
                        Student
                      </th>

                      <th style={tableHeaderStyle}>
                        Looking Away Violations
                      </th>

                      <th style={tableHeaderStyle}>
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(
                      (student) => (
                        <tr
                          key={
                            student.id
                          }
                        >
                          <td style={tableCellStyle}>
                            <strong>
                              {
                                student.fullName
                              }
                            </strong>

                            <br />

                            <span
                              style={{
                                color:
                                  "#6b7280",
                                fontSize:
                                  "13px",
                              }}
                            >
                              {
                                student.email
                              }
                            </span>
                          </td>

                          <td style={tableCellStyle}>
                            {
                              student.lookingAwayWarnings
                            }{" "}
                            / 5
                          </td>

                          <td style={tableCellStyle}>
                            {student.lookingAwayWarnings >=
                            5 ? (
                              <span
                                style={{
                                  color:
                                    "#dc2626",
                                  fontWeight:
                                    "bold",
                                }}
                              >
                                Exam Ended
                              </span>
                            ) : (
                              <span
                                style={{
                                  color:
                                    "#16a34a",
                                }}
                              >
                                Within Limit
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      );
    }

    // =====================================
    // CAMERA MONITORING
    // =====================================

    if (
      activeSection ===
      "Camera Monitoring"
    ) {
      return (
        <>
          <PageTitle
            title="Camera Monitoring"
            description="Camera and AI monitoring information for examinations."
          />

          <div
            style={contentCardStyle}
          >
            <h2>
              📷 AI Monitoring System
            </h2>

            <p>
              The examination system
              monitors students using
              camera-based detection.
            </p>

            <ul
              style={{
                lineHeight: "2",
              }}
            >
              <li>
                👤 Additional people
              </li>

              <li>
                🚫 Unauthorized objects
              </li>

              <li>
                👤 Face visibility
              </li>

              <li>
                👀 Looking-away
                violations
              </li>

              <li>
                🔄 Examination tab
                switching
              </li>
            </ul>

            <div
              style={{
                marginTop: "25px",
                padding: "20px",
                background:
                  "#eff6ff",
                borderRadius:
                  "10px",
              }}
            >
              <strong>
                Current monitoring records
              </strong>

              <p
                style={{
                  marginBottom: 0,
                  color:
                    "#4b5563",
                }}
              >
                Students monitored:{" "}
                {students.length}
              </p>

              <p
                style={{
                  marginBottom: 0,
                  color:
                    "#4b5563",
                }}
              >
                Total violations:{" "}
                {totalViolations}
              </p>
            </div>
          </div>
        </>
      );
    }

    // =====================================
    // STUDENT FACES
    // =====================================

    if (
      activeSection ===
      "Student Faces"
    ) {
      return (
        <>
          <PageTitle
            title="Student Faces"
            description="View registered student face photographs used for examination verification."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "25px",
            }}
          >
            {loading ? (
              <div
                style={{
                  ...contentCardStyle,
                  gridColumn:
                    "1 / -1",
                }}
              >
                <EmptyMessage
                  message="Loading student faces..."
                />
              </div>
            ) : studentFaces.length === 0 ? (
              <div
                style={{
                  ...contentCardStyle,
                  gridColumn:
                    "1 / -1",
                }}
              >
                <EmptyMessage
                  message="No student faces have been registered yet."
                />
              </div>
            ) : (
              studentFaces.map(
                (face) => (
                  <div
                    key={face.id}
                    style={{
                      background:
                        "white",
                      borderRadius:
                        "16px",
                      padding:
                        "20px",
                      boxShadow:
                        "0 10px 30px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        width:
                          "100%",
                        aspectRatio:
                          "4 / 3",
                        borderRadius:
                          "12px",
                        overflow:
                          "hidden",
                        background:
                          "#111827",
                      }}
                    >
                      {face.faceImageUrl ? (
                        <img
                          src={
                            face.faceImageUrl
                          }
                          alt={`${face.fullName} face`}
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            objectFit:
                              "cover",
                            display:
                              "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            color:
                              "white",
                          }}
                        >
                          No image
                        </div>
                      )}
                    </div>

                    <h3
                      style={{
                        margin:
                          "18px 0 5px",
                      }}
                    >
                      {face.fullName}
                    </h3>

                    <p
                      style={{
                        margin:
                          "0 0 12px",
                        color:
                          "#6b7280",
                        fontSize:
                          "14px",
                      }}
                    >
                      {face.email}
                    </p>

                    <div
                      style={{
                        display:
                          "inline-block",
                        padding:
                          "6px 10px",
                        borderRadius:
                          "999px",
                        background:
                          "#dcfce7",
                        color:
                          "#166534",
                        fontSize:
                          "12px",
                        fontWeight:
                          "bold",
                      }}
                    >
                      ✓ Face Registered
                    </div>

                    {face.createdAt && (
                      <p
                        style={{
                          margin:
                            "12px 0 0",
                          color:
                            "#9ca3af",
                          fontSize:
                            "12px",
                        }}
                      >
                        Registered:{" "}
                        {new Date(
                          face.createdAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )
              )
            )}
          </div>
        </>
      );
    }

    // =====================================
    // ADMIN SETTINGS
    // =====================================

    if (
      activeSection ===
      "Admin Settings"
    ) {
      return (
        <>
          <PageTitle
            title="Admin Settings"
            description="Manage examination monitoring settings."
          />

          <div
            style={contentCardStyle}
          >
            <h2>
              Examination Settings
            </h2>

            <p>
              Current examination duration:
              <strong>
                {" "}
                10 minutes
              </strong>
            </p>

            <p>
              Looking-away limit:
              <strong>
                {" "}
                5 violations
              </strong>
            </p>

            <p>
              Tab-switch limit:
              <strong>
                {" "}
                3 violations
              </strong>
            </p>

            <p>
              Person/object limit:
              <strong>
                {" "}
                3 violations
              </strong>
            </p>

            <p
              style={{
                marginTop:
                  "25px",
                color:
                  "#6b7280",
              }}
            >
              These settings currently
              match the examination
              monitoring system.
            </p>
          </div>
        </>
      );
    }

    return null;
  };

  // =====================================
  // MAIN LAYOUT
  // =====================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily:
          "Arial, sans-serif",
        color: "#111827",
        display: "flex",
      }}
    >
      {/* SIDEBAR */}

      <aside
        style={{
          width: "260px",
          minHeight: "100vh",
          background: "#111827",
          color: "white",
          padding: "25px 15px",
          boxSizing:
            "border-box",
          position: "sticky",
          top: 0,
        }}
      >
        <div
          style={{
            padding:
              "10px 15px 30px",
            borderBottom:
              "1px solid #374151",
            marginBottom:
              "20px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight:
                "bold",
              color: "#93c5fd",
              letterSpacing:
                "1px",
            }}
          >
            TRANCELLE
          </p>

          <h2
            style={{
              margin:
                "8px 0 0",
              fontSize:
                "20px",
            }}
          >
            Admin Portal
          </h2>
        </div>

        <SidebarHeading title="MAIN" />

        <SidebarButton
          icon="🏠"
          label="Dashboard"
          active={
            activeSection ===
            "Dashboard"
          }
          onClick={() =>
            setActiveSection(
              "Dashboard"
            )
          }
        />

        <SidebarHeading
          title="STUDENT MANAGEMENT"
        />

        <SidebarButton
          icon="👨‍🎓"
          label="Registered Students"
          active={
            activeSection ===
            "Registered Students"
          }
          onClick={() =>
            setActiveSection(
              "Registered Students"
            )
          }
        />

        <SidebarButton
          icon="🔍"
          label="Search Students"
          active={
            activeSection ===
            "Search Students"
          }
          onClick={() =>
            setActiveSection(
              "Search Students"
            )
          }
        />

        <SidebarHeading
          title="EXAMINATION"
        />

        <SidebarButton
          icon="📊"
          label="Exam Results"
          active={
            activeSection ===
            "Exam Results"
          }
          onClick={() =>
            setActiveSection(
              "Exam Results"
            )
          }
        />

        <SidebarButton
          icon="🟢"
          label="Active Exams"
          active={
            activeSection ===
            "Active Exams"
          }
          onClick={() =>
            setActiveSection(
              "Active Exams"
            )
          }
        />

        <SidebarButton
          icon="✅"
          label="Completed Exams"
          active={
            activeSection ===
            "Completed Exams"
          }
          onClick={() =>
            setActiveSection(
              "Completed Exams"
            )
          }
        />

        <SidebarHeading
          title="MONITORING"
        />

        <SidebarButton
          icon="⚠️"
          label="Violations"
          active={
            activeSection ===
            "Violations"
          }
          onClick={() =>
            setActiveSection(
              "Violations"
            )
          }
        />

        <SidebarButton
          icon="👀"
          label="Looking Away Records"
          active={
            activeSection ===
            "Looking Away Records"
          }
          onClick={() =>
            setActiveSection(
              "Looking Away Records"
            )
          }
        />

        <SidebarButton
          icon="📷"
          label="Camera Monitoring"
          active={
            activeSection ===
            "Camera Monitoring"
          }
          onClick={() =>
            setActiveSection(
              "Camera Monitoring"
            )
          }
        />

        <SidebarButton
          icon="👤"
          label="Student Faces"
          active={
            activeSection ===
            "Student Faces"
          }
          onClick={() =>
            setActiveSection(
              "Student Faces"
            )
          }
        />

        <SidebarHeading
          title="ACCOUNT"
        />

        <SidebarButton
          icon="⚙️"
          label="Admin Settings"
          active={
            activeSection ===
            "Admin Settings"
          }
          onClick={() =>
            setActiveSection(
              "Admin Settings"
            )
          }
        />

        {/* LOGOUT */}

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            display: "flex",
            alignItems:
              "center",
            gap: "10px",
            padding:
              "12px 15px",
            marginTop:
              "10px",
            color: "#fecaca",
            background:
              "transparent",
            border: "none",
            borderRadius:
              "8px",
            fontSize:
              "14px",
            cursor:
              "pointer",
            textAlign:
              "left",
          }}
        >
          🚪 Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}

      <section
        style={{
          flex: 1,
          padding: "40px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {renderContent()}
        </div>
      </section>
    </main>
  );
}

/* =====================================
   PAGE TITLE
===================================== */

function PageTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        marginBottom:
          "30px",
      }}
    >
      <h1
        style={{
          margin: 0,
        }}
      >
        {title}
      </h1>

      <p
        style={{
          color:
            "#6b7280",
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* =====================================
   EMPTY MESSAGE
===================================== */

function EmptyMessage({
  message,
}: {
  message: string;
}) {
  return (
    <p
      style={{
        textAlign:
          "center",
        color:
          "#6b7280",
        padding:
          "35px",
      }}
    >
      {message}
    </p>
  );
}

/* =====================================
   ERROR BOX
===================================== */

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div
      style={{
        background:
          "#fee2e2",
        color:
          "#991b1b",
        border:
          "1px solid #fecaca",
        padding:
          "15px 20px",
        borderRadius:
          "10px",
        marginBottom:
          "25px",
      }}
    >
      ⚠️ {message}
    </div>
  );
}

/* =====================================
   SIDEBAR HEADING
===================================== */

function SidebarHeading({
  title,
}: {
  title: string;
}) {
  return (
    <p
      style={{
        fontSize:
          "10px",
        fontWeight:
          "bold",
        color:
          "#9ca3af",
        letterSpacing:
          "1px",
        margin:
          "25px 15px 8px",
      }}
    >
      {title}
    </p>
  );
}

/* =====================================
   SIDEBAR BUTTON
===================================== */

function SidebarButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        padding:
          "12px 15px",
        borderRadius:
          "8px",
        background:
          active
            ? "#2563eb"
            : "transparent",
        color:
          active
            ? "white"
            : "#d1d5db",
        cursor:
          "pointer",
        textAlign:
          "left",
        fontSize:
          "14px",
        marginBottom:
          "4px",
      }}
    >
      <span
        style={{
          marginRight:
            "10px",
        }}
      >
        {icon}
      </span>

      {label}
    </button>
  );
}

/* =====================================
   STUDENT TABLE
===================================== */

function StudentTable({
  students,
  loading,
}: {
  students: StudentData[];
  loading: boolean;
}) {
  return (
    <div
      style={{
        background:
          "white",
        borderRadius:
          "16px",
        padding:
          "25px",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
        }}
      >
        Student Records
      </h2>

      {loading ? (
        <EmptyMessage
          message="Loading student records..."
        />
      ) : students.length === 0 ? (
        <EmptyMessage
          message="No registered students yet."
        />
      ) : (
        <div
          style={{
            overflowX:
              "auto",
          }}
        >
          <table
            style={{
              width:
                "100%",
              borderCollapse:
                "collapse",
              minWidth:
                "900px",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "#f3f4f6",
                  textAlign:
                    "left",
                }}
              >
                <th style={tableHeaderStyle}>
                  Student
                </th>

                <th style={tableHeaderStyle}>
                  Email
                </th>

                <th style={tableHeaderStyle}>
                  Phone
                </th>

                <th style={tableHeaderStyle}>
                  Status
                </th>

                <th style={tableHeaderStyle}>
                  Person/Object
                </th>

                <th style={tableHeaderStyle}>
                  Looking Away
                </th>

                <th style={tableHeaderStyle}>
                  Tab Switches
                </th>

                <th style={tableHeaderStyle}>
                  Score
                </th>

                <th style={tableHeaderStyle}>
                  Percentage
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map(
                (student) => (
                  <tr
                    key={
                      student.id
                    }
                  >
                    <td style={tableCellStyle}>
                      <strong>
                        {
                          student.fullName
                        }
                      </strong>
                    </td>

                    <td style={tableCellStyle}>
                      {
                        student.email
                      }
                    </td>

                    <td style={tableCellStyle}>
                      {
                        student.phone
                      }
                    </td>

                    <td style={tableCellStyle}>
                      <span
                        style={{
                          color:
                            student.status ===
                            "Completed"
                              ? "#16a34a"
                              : student.status ===
                                "Active"
                              ? "#2563eb"
                              : "#6b7280",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {
                          student.status
                        }
                      </span>
                    </td>

                    <td style={tableCellStyle}>
                      {
                        student.warnings
                      }
                    </td>

                    <td style={tableCellStyle}>
                      {
                        student.lookingAwayWarnings
                      }
                    </td>

                    <td style={tableCellStyle}>
                      {
                        student.tabSwitches
                      }
                    </td>

                    <td style={tableCellStyle}>
                      {
                        student.score
                      }
                    </td>

                    <td style={tableCellStyle}>
                      <strong>
                        {
                          student.percentage
                        }%
                      </strong>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* =====================================
   DASHBOARD CARD
===================================== */

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div
      style={{
        background:
          "white",
        padding:
          "25px",
        borderRadius:
          "14px",
        boxShadow:
          "0 8px 20px rgba(0,0,0,0.07)",
      }}
    >
      <p
        style={{
          margin: 0,
          color:
            "#6b7280",
          fontSize:
            "14px",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          fontSize:
            "36px",
          margin:
            "10px 0",
        }}
      >
        {value}
      </h2>

      <p
        style={{
          margin: 0,
          color:
            "#9ca3af",
          fontSize:
            "13px",
        }}
      >
        {description}
      </p>
    </div>
  );
}

/* =====================================
   STYLES
===================================== */

const headerStyle = {
  marginBottom:
    "35px",
};

const academyStyle = {
  margin: 0,
  fontSize:
    "13px",
  fontWeight:
    "bold",
  color:
    "#2563eb",
};

const contentCardStyle = {
  background:
    "white",
  padding:
    "30px",
  borderRadius:
    "16px",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.08)",
};

const tableHeaderStyle = {
  padding:
    "14px",
  borderBottom:
    "1px solid #e5e7eb",
  fontSize:
    "14px",
};

const tableCellStyle = {
  padding:
    "14px",
  borderBottom:
    "1px solid #e5e7eb",
};