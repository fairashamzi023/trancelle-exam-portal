"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
const [role, setRole] = useState<"student" | "admin" | null>(null);

return ( <main className="home">
{/* NAVBAR */} <nav className="navbar"> <div className="brand"> <h1>TRANCELLE</h1> <p>INTERNATIONAL ACADEMY</p> </div>
```
    <div className="navLinks">
      <a href="#home">Home</a>
      <a href="#about">About Us</a>
      <a href="#contact">Contact</a>
    </div>

    <div className="portalName">EXAM PORTAL</div>
  </nav>

  {/* HERO */}
  <section className="hero" id="home">
    <div className="heroContent">
      <p className="badge">TRANCELLE INTERNATIONAL ACADEMY</p>

      <h2>
        Online <span>Examination</span>
        <br />
        Portal
      </h2>

      <p className="description">
        Welcome to the official online examination portal of
        Trancelle International Academy. Access your examinations
        securely and manage multiple academic assessments from one
        platform.
      </p>

      {/* PORTAL BUTTONS */}
      <div className="roleButtons">
        <button
          type="button"
          className={`roleButton ${
            role === "student" ? "active" : ""
          }`}
          onClick={() => setRole("student")}
        >
          🎓 Student Portal
        </button>

        <button
          type="button"
          className={`roleButton ${
            role === "admin" ? "active" : ""
          }`}
          onClick={() => setRole("admin")}
        >
          👨‍💼 Administrator Portal
        </button>
      </div>

      {/* SELECTION BOX */}
      {role !== null && (
        <div className="selectionBox">
          <h3>
            {role === "student"
              ? "Student Examination Portal"
              : "Administrator Portal"}
          </h3>

          <p>
            {role === "student"
              ? "Login or register to access your assigned examinations."
              : "Manage examinations, questions, students, activation codes, and results."}
          </p>

          <Link
            href={role === "student" ? "/student" : "/admin"}
            className="continueButton"
          >
            Continue →
          </Link>
        </div>
      )}
    </div>

    {/* EXAM SYSTEM CARD */}
    <div className="heroCard">
      <div className="cardTop">
        <span className="academySmall">TRANCELLE</span>

        <span className="status">● ONLINE</span>
      </div>

      <h3>Examination System</h3>

      <div className="cardItem">
        <span>📝</span>

        <div>
          <strong>Multiple Examinations</strong>

          <p>Conduct and manage different exams</p>
        </div>
      </div>

      <div className="cardItem">
        <span>🔐</span>

        <div>
          <strong>Secure Access</strong>

          <p>Student accounts and activation codes</p>
        </div>
      </div>

      <div className="cardItem">
        <span>📊</span>

        <div>
          <strong>Central Management</strong>

          <p>Manage students, exams, and results</p>
        </div>
      </div>
    </div>
  </section>

  {/* FEATURES */}
  <section className="features">
    <p className="sectionBadge">EXAMINATION PLATFORM</p>

    <h2>One Portal. Multiple Examinations.</h2>

    <div className="featureGrid">
      <div className="feature">
        <div className="featureIcon">📝</div>

        <h3>Create Examinations</h3>

        <p>
          Create and manage multiple examinations from
          one administrator dashboard.
        </p>
      </div>

      <div className="feature">
        <div className="featureIcon">🎓</div>

        <h3>Student Access</h3>

        <p>
          Students can register, login, and access their
          assigned examinations.
        </p>
      </div>

      <div className="feature">
        <div className="featureIcon">🔑</div>

        <h3>Activation Codes</h3>

        <p>
          Secure each examination using unique activation
          codes and access controls.
        </p>
      </div>
    </div>
  </section>

  {/* ABOUT US */}
  <section className="aboutSection" id="about">
    <div className="aboutContent">
      <p className="sectionBadge">ABOUT TRANCELLE</p>

      <h2>Trancelle International Academy</h2>

      <p>
        Trancelle International Academy is committed to
        providing quality education and professional academic
        development opportunities for students.
      </p>

      <p>
        Our online examination platform is designed to provide
        students and administrators with a secure, organized,
        and modern examination experience.
      </p>

      <p>
        Through our digital systems, students can access their
        examinations securely while administrators can manage
        examinations, questions, students, and results from
        one centralized platform.
      </p>
    </div>

    <div className="aboutCard">
      <div className="aboutItem">
        <span>🎓</span>

        <div>
          <h3>Quality Education</h3>

          <p>Supporting students in their academic journey.</p>
        </div>
      </div>

      <div className="aboutItem">
        <span>💻</span>

        <div>
          <h3>Digital Learning</h3>

          <p>Modern technology for education and examinations.</p>
        </div>
      </div>

      <div className="aboutItem">
        <span>🔒</span>

        <div>
          <h3>Secure Examinations</h3>

          <p>A structured and secure examination environment.</p>
        </div>
      </div>
    </div>
  </section>

  {/* CONTACT */}
  <section className="contactSection" id="contact">
    <p className="sectionBadge">CONTACT INFORMATION</p>

    <h2>Get In Touch With Us</h2>

    <p className="contactIntro">
      For information regarding admissions, courses,
      examinations, or student support, please contact
      Trancelle International Academy.
    </p>

    <div className="contactGrid">
      <div className="contactCard">
        <div className="contactIcon">📧</div>

        <h3>Email</h3>

        <a href="mailto:trancelleinternational25@gmail.com">
          trancelleinternational25@gmail.com
        </a>
      </div>

      <div className="contactCard">
        <div className="contactIcon">🏫</div>

        <h3>Academy</h3>

        <p>Trancelle International Academy</p>
      </div>

      <div className="contactCard">
        <div className="contactIcon">💬</div>

        <h3>Support</h3>

        <p>Contact us for examination and student support.</p>
      </div>
    </div>
  </section>

  {/* FOOTER */}
  <footer className="footer">
    <div>
      <strong>TRANCELLE INTERNATIONAL ACADEMY</strong>

      <span>Online Examination Portal</span>
    </div>

    <div className="footerLinks">
      <a href="#home">Home</a>
      <a href="#about">About Us</a>
      <a href="#contact">Contact</a>
    </div>
  </footer>
</main>


);
}
