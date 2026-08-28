import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { uploadProfilePhoto } from "../api/profileApi";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "";

export default function Profile() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

    if (picture.startsWith("http")) {
      return picture;
    }

    return `${API_BASE_URL}${picture}`;
  };

  const profileImageUrl =
    previewUrl || getProfileImageUrl();

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG, WEBP or GIF image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const response = await uploadProfilePhoto(
        selectedFile
      );

      const uploadedPicture =
        response?.profilePicture;

      if (uploadedPicture) {
        const fullUrl = uploadedPicture.startsWith("http")
          ? uploadedPicture
          : `${API_BASE_URL}${uploadedPicture}`;

        setPreviewUrl(fullUrl);

        const storedUser =
          JSON.parse(
            localStorage.getItem("userInfo")
          ) || {};

        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            ...storedUser,
            profilePicture: uploadedPicture,
          })
        );
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage(
        "Profile photo updated successfully."
      );
    } catch (err) {
      console.error(
        "Profile photo upload failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to upload profile photo."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-page">

      {/* HEADER */}

      <div className="profile-page-header">
        <div>
          <div className="profile-eyebrow">
            ACCOUNT SETTINGS
          </div>

          <h1>Profile</h1>

          <p>
            Manage your personal information and
            profile photo.
          </p>
        </div>
      </div>

      {/* PROFILE HERO */}

      <section className="profile-card profile-hero-card">

        <div className="profile-hero-left">

          <div className="profile-large-avatar">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={`${userName} profile`}
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

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

      {/* MAIN GRID */}

      <div className="profile-grid">

        {/* PHOTO CARD */}

        <section className="profile-card profile-photo-card">

          <div className="profile-section-heading">
            <div className="section-icon">
              📷
            </div>

            <div>
              <h3>Profile photo</h3>
              <p>
                Personalize your ExpenseAI account.
              </p>
            </div>
          </div>

          <div
            className={`photo-upload-zone ${
              selectedFile
                ? "photo-upload-zone-selected"
                : ""
            }`}
            onClick={handleChoosePhoto}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                handleChoosePhoto();
              }
            }}
          >

            <div className="upload-preview">

              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile preview"
                />
              ) : (
                <span>{initials}</span>
              )}

              <div className="upload-camera">
                📷
              </div>

            </div>

            <div className="upload-copy">

              <strong>
                {selectedFile
                  ? selectedFile.name
                  : "Choose a profile photo"}
              </strong>

              <span>
                JPG, PNG, WEBP or GIF
                <br />
                Maximum file size: 5 MB
              </span>

            </div>

            <button
              type="button"
              className="profile-secondary-button"
              onClick={(event) => {
                event.stopPropagation();
                handleChoosePhoto();
              }}
            >
              Browse
            </button>

          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            hidden
          />

          {selectedFile && (
            <button
              type="button"
              className="profile-upload-button"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Save profile photo"}
            </button>
          )}

          {message && (
            <div className="profile-success">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="profile-error">
              ⚠ {error}
            </div>
          )}

        </section>

        {/* ACCOUNT INFO */}

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

            <div className="account-info-item">
              <span className="info-label">
                Full name
              </span>

              <strong>
                {userName}
              </strong>
            </div>

            <div className="account-info-item">
              <span className="info-label">
                Email address
              </span>

              <strong>
                {userEmail}
              </strong>
            </div>

            <div className="account-info-item">
              <span className="info-label">
                Currency
              </span>

              <strong>
                {user?.currency || "INR"} ₹
              </strong>
            </div>

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

      </div>

      {/* SECURITY NOTE */}

      <section className="profile-security-card">

        <div className="security-icon">
          🔒
        </div>

        <div>
          <strong>
            Your account is secure
          </strong>

          <p>
            Your profile information is protected
            and only accessible to you.
          </p>
        </div>

      </section>

    </div>
  );
}