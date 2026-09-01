"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ALLOWED_ADMINS = [
  "kcds2025trancelle@gmail.com",
  "trancelleinternational25@gmail.com",
];

export default function AdminPortal() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    // Only the two approved administrator emails
    // are allowed to attempt administrator login.
    if (!ALLOWED_ADMINS.includes(normalizedEmail)) {
      setErrorMessage(
        "This email address is not authorized to access the Administrator Portal."
      );
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error) {
        console.error("Admin login error:", error);

        setErrorMessage(
          "Invalid administrator email or password."
        );

        return;
      }

      if (!data.user) {
        setErrorMessage(
          "Unable to verify administrator account."
        );

        return;
      }

      // Double-check the authenticated user's email.
      if (
        !ALLOWED_ADMINS.includes(
          data.user.email?.toLowerCase() || ""
        )
      ) {
        await supabase.auth.signOut();

        setErrorMessage(
          "This account is not authorized to access the Administrator Portal."
        );

        return;
      }

      router.replace("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        "Something went wrong while logging in."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="portalPage">
      <Link href="/" className="backLink">
        ← Back to Exam Portal
      </Link>

      <section className="adminLoginContainer">
        <div className="portalHeader">
          <p>
            TRANCELLE INTERNATIONAL ACADEMY
          </p>

          <h1>
            Administrator Portal
          </h1>

          <span>
            Secure Examination Management
          </span>
        </div>

        <form
          className="loginForm"
          onSubmit={handleLogin}
        >
          <label>
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter administrator email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label>
            Password
          </label>

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
              placeholder="Enter password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                paddingRight: "55px",
              }}
            />

            {password && (
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
                  justifyContent: "center",
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

          {errorMessage && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                border:
                  "1px solid #fecaca",
                padding: "12px 15px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="portalAction"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Login to Dashboard →"}
          </button>
        </form>
      </section>
    </main>
  );
}
