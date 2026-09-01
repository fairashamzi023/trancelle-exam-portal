"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StudentLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      alert("Login successful!");

      // Go to face verification first
      router.push("/student/verify-face");
    }

    setLoading(false);
  };

  return (
    <main className="loginPage">
      <div className="loginCard">
        <h1>Student Login</h1>

        <p className="loginSubtitle">
          Login to access your examination portal
        </p>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <label>Password</label>

          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "20px",
            }}
          >
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                paddingRight: "55px",
              }}
            />

            {password.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
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
                  zIndex: 10,
                  width: "24px",
                  height: "24px",
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

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="registerText">
          Don't have an account?{" "}
          <a href="/student/register">
            Register here
          </a>
        </p>
      </div>
    </main>
  );
}