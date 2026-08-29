import React from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "";

export default function Profile() {
  const { user } = useAuth();

  const userName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "User";

  const userEmail =
    user?.email ||
    "ExpenseAI User";

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U";

  const getProfileImageUrl = () => {
    if (!user?.profilePicture) {
      return null;
    }

    const picture = user.profilePicture;

    if (
      picture.startsWith("http://") ||
      picture.startsWith("https://")
    ) {
      return picture;
    }

    return `${API_BASE_URL}${picture}`;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <div className="profile-page">

      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <div className="profile-page-header">
        <div>
          <div className="profile-eyebrow">
            ACCOUNT
          </div>

          <h1>Profile</h1>

          <p>
            View your personal information and
            ExpenseAI account details.
          </p>
        </div>
      </div>

      {/* ================================================= */}
      {/* PROFILE HERO */}
      {/* ================================================= */}

      <section className="profile-card profile-hero-card">

        <div className="profile-hero-left">

          {/* PROFILE AVATAR */}

          <div className="profile-large-avatar">

            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${userName} profile`}
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";

                  const fallback =
                    event.currentTarget
                      .nextElementSibling;

                  if (fallback) {
                    fallback.style.display = "flex";
                  }
                }}
              />
            ) : null}

            <span
              style={{
                display: profileImageUrl
                  ? "none"
                  : "flex",
              }}
            >
              {initials}
            </span>

          </div>

          {/* IDENTITY */}

          <div className="profile-identity">

            <div className="profile-name-row">

              <h2>{userName}</h2>

              <span className="profile-status">
                <span className="status-dot" />
                Active
              </span>

            </div>

            <p>{userEmail}</p>

            <div className="profile-provider">

              {user?.authProvider === "google" ? (
                <>
                  <span className="provider-icon">
                    G
                  </span>

                  Signed in with Google
                </>
              ) : (
                <>
                  <span className="provider-icon">
                    ✓
                  </span>

                  ExpenseAI account
                </>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* ACCOUNT INFORMATION */}
      {/* ================================================= */}

      <section className="profile-card account-info-card">

        <div className="profile-section-heading">

          <div className="section-icon">
            👤
          </div>

          <div>
            <h3>Account information</h3>

            <p>
              Your current ExpenseAI account details.
            </p>
          </div>

        </div>

        <div className="account-info-list">

          {/* FULL NAME */}

          <div className="account-info-item">

            <span className="info-label">
              Full name
            </span>

            <strong>
              {userName}
            </strong>

          </div>

          {/* EMAIL */}

          <div className="account-info-item">

            <span className="info-label">
              Email address
            </span>

            <strong>
              {userEmail}
            </strong>

          </div>

          {/* CURRENCY */}

          <div className="account-info-item">

            <span className="info-label">
              Currency
            </span>

            <strong>
              {user?.currency || "INR"} ₹
            </strong>

          </div>

          {/* MONTHLY INCOME */}

          <div className="account-info-item">

            <span className="info-label">
              Monthly income
            </span>

            <strong>
              ₹
              {Number(
                user?.monthlyIncome || 0
              ).toLocaleString("en-IN")}
            </strong>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* PROFILE PHOTO NOTE */}
      {/* ================================================= */}

      <section className="profile-security-card">

        <div className="security-icon">
          ⚙
        </div>

        <div>

          <strong>
            Manage your profile photo
          </strong>

          <p>
            You can change your profile photo from
            Settings → Profile information.
          </p>

        </div>

      </section>

    </div>
  );
}