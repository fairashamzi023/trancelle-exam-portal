"use client";

import Link from "next/link";

export default function StudentPortal() {
  return (
    <main className="portalPage">
      <Link href="/" className="backLink">
        ← Back to Exam Portal
      </Link>

      <section className="portalContainer">
        <div className="portalHeader">
          <p>TRANCELLE INTERNATIONAL ACADEMY</p>
          <h1>Student Portal</h1>
          <span>Online Examination System</span>
        </div>

        <div className="portalOptions">
          <div className="portalOption">
            <div className="optionIcon">🔐</div>
            <h2>Student Login</h2>
            <p>
              Already have an account? Login to access your examinations.
            </p>

            <a href="/student/login" className="loginButton">
  Login
</a>
          </div>

          <div className="portalOption">
            <div className="optionIcon">📝</div>
            <h2>New Student</h2>
            <p>
              Create your student account to access examinations assigned to you.
            </p>

            <a href="/student/register" className="registerButton">
  Register
</a>
          </div>
        </div>
      </section>
    </main>
  );
}