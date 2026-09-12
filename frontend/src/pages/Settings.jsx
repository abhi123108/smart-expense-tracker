import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { uploadProfilePhoto } from "../api/profileApi";
import "./Settings.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

// ============================================================
// ICON COMPONENT
// ============================================================

function Icon({ type, size = 20, strokeWidth = 2 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (type) {
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" />
        </svg>
      );

    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v2" />
        </svg>
      );

    case "camera":
      return (
        <svg {...common}>
          <path d="M4 7h3l1.5-2h7L17 7h3v12H4z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 20 6v5c0 5.2-3.2 8.6-8 10-4.8-1.4-8-4.8-8-10V6z" />
          <path d="m8.5 12 2.2 2.2 4.8-5" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "eye-off":
      return (
        <svg {...common}>
          <path d="m3 3 18 18" />
          <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a16.7 16.7 0 0 1-3 3.8" />
          <path d="M6.2 6.2C3.9 7.8 2.5 12 2.5 12s3.5 7 9.5 7a9.8 9.8 0 0 0 3-.5" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.9-3" />
          <path d="M4 4v4h4" />
          <path d="M4 13a8 8 0 0 0 14.9 3" />
          <path d="M20 20v-4h-4" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      );

    case "key":
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="m11 12 9-9" />
          <path d="m17 6 2 2" />
          <path d="m14 9 2 2" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

// ============================================================
// HELPERS
// ============================================================

function getUserName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.username ||
    "User"
  );
}

function getInitials(name) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U"
  );
}

function getProfileImage(user) {
  if (!user?.profilePicture) {
    return null;
  }

  if (
    user.profilePicture.startsWith("http://") ||
    user.profilePicture.startsWith("https://")
  ) {
    return user.profilePicture;
  }

  return `${API_BASE_URL}${user.profilePicture}`;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}

// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  disabled = false,
}) {
  return (
    <div className="settings-field">
      <label className="settings-label">
        {label}
      </label>

      <div className="settings-input-wrapper">
        <input
          className="settings-input"
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="new-password"
        />

        <button
          type="button"
          className="settings-input-icon"
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          <Icon
            type={visible ? "eye-off" : "eye"}
            size={18}
          />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SETTINGS COMPONENT
// ============================================================

export default function Settings() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  // ----------------------------------------------------------
  // PROFILE
  // ----------------------------------------------------------

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: "INR",
    monthlyIncome: 0,
  });

  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // ----------------------------------------------------------
  // PASSWORD
  // ----------------------------------------------------------

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [changingPassword, setChangingPassword] =
    useState(false);

  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------

  const [showEmailModal, setShowEmailModal] =
    useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailStep, setEmailStep] = useState("email");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // ----------------------------------------------------------
  // DELETE ACCOUNT
  // ----------------------------------------------------------

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deletePassword, setDeletePassword] =
    useState("");

  const [showDeletePassword, setShowDeletePassword] =
    useState(false);

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  // ----------------------------------------------------------
  // MESSAGES
  // ----------------------------------------------------------

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        const { data } =
          await api.get("/auth/profile");

        if (!mounted) return;

        setProfile({
          name: data?.name || "",
          email: data?.email || "",
          currency: data?.currency || "INR",
          monthlyIncome:
            data?.monthlyIncome ?? 0,
        });

        setProfileImage(
          getProfileImage(data)
        );
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error
        );

        if (!mounted) return;

        setProfile({
          name: getUserName(user),
          email: user?.email || "",
          currency: user?.currency || "INR",
          monthlyIncome:
            user?.monthlyIncome ?? 0,
        });

        setProfileImage(
          getProfileImage(user)
        );

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load your profile."
          )
        );
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  // ==========================================================
  // CLEAR MESSAGES
  // ==========================================================

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ==========================================================
  // PROFILE INPUT
  // ==========================================================

  const handleProfileChange = (field, value) => {
    clearMessages();

    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    clearMessages();

    const name = profile.name.trim();

    if (!name) {
      setErrorMessage(
        "Please enter your full name."
      );
      return;
    }

    const income = Number(
      profile.monthlyIncome
    );

    if (
      Number.isNaN(income) ||
      income < 0
    ) {
      setErrorMessage(
        "Please enter a valid monthly income."
      );
      return;
    }

    try {
      setSavingProfile(true);

      const { data } =
        await api.put("/auth/profile", {
          name,
          currency: profile.currency,
          monthlyIncome: income,
        });

      const updatedUser = {
        ...(JSON.parse(
          localStorage.getItem("userInfo")
        ) || {}),
        ...data,
      };

      localStorage.setItem(
        "userInfo",
        JSON.stringify(updatedUser)
      );

      setProfile({
        name: data?.name || name,
        email:
          data?.email ||
          profile.email,
        currency:
          data?.currency ||
          profile.currency,
        monthlyIncome:
          data?.monthlyIncome ??
          income,
      });

      setSuccessMessage(
        "Your profile information has been updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile update failed:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to save your profile."
        )
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ==========================================================
  // RESET PROFILE FORM
  // ==========================================================

  const handleResetProfile = () => {
    clearMessages();

    setProfile({
      name: getUserName(user),
      email: user?.email || "",
      currency: user?.currency || "INR",
      monthlyIncome:
        user?.monthlyIncome ?? 0,
    });

    setPreviewUrl(null);
    setSelectedFile(null);
  };

  // ==========================================================
  // SELECT PROFILE PHOTO
  // ==========================================================

  const handleChoosePhoto = () => {
    clearMessages();
    fileInputRef.current?.click();
  };

  // ==========================================================
  // PHOTO SELECT
  // ==========================================================

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    clearMessages();

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Please select a JPG, PNG, WEBP or GIF image."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const objectUrl =
      URL.createObjectURL(file);

    setPreviewUrl(objectUrl);
  };

  // ==========================================================
  // UPLOAD PHOTO
  // ==========================================================

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      handleChoosePhoto();
      return;
    }

    clearMessages();

    try {
      setUploadingPhoto(true);

      const response =
        await uploadProfilePhoto(
          selectedFile
        );

      const uploadedPicture =
        response?.profilePicture;

      if (uploadedPicture) {
        const fullUrl =
          uploadedPicture.startsWith("http")
            ? uploadedPicture
            : `${API_BASE_URL}${uploadedPicture}`;

        setProfileImage(fullUrl);
        setPreviewUrl(fullUrl);

        const storedUser =
          JSON.parse(
            localStorage.getItem(
              "userInfo"
            )
          ) || {};

        localStorage.setItem(
          "userInfo",
          JSON.stringify({
            ...storedUser,
            profilePicture:
              uploadedPicture,
          })
        );
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccessMessage(
        "Profile photo updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile photo upload failed:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to upload profile photo."
        )
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ==========================================================
  // PASSWORD CHANGE
  // ==========================================================

  const handleChangePassword = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!currentPassword) {
      setErrorMessage(
        "Enter your current password first."
      );
      return;
    }

    if (!newPassword) {
      setErrorMessage(
        "Enter your new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "New password and confirmation do not match."
      );
      return;
    }

    if (
      currentPassword === newPassword
    ) {
      setErrorMessage(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      // Backend route is PUT /auth/change-password
      const { data } =
        await api.put(
          "/auth/change-password",
          {
            oldPassword: currentPassword,
            newPassword,
            confirmPassword,
          }
        );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        data?.message ||
          "Password changed successfully."
      );
    } catch (error) {
      console.error(
        "Password change failed:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to change password. Please make sure your current password is correct."
        )
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ==========================================================
  // OPEN EMAIL MODAL
  // ==========================================================

  const handleOpenEmailModal = () => {
    clearMessages();

    setNewEmail("");
    setOtp("");
    setEmailStep("email");

    setShowEmailModal(true);
  };

  // ==========================================================
  // CLOSE EMAIL MODAL
  // ==========================================================

  const handleCloseEmailModal = () => {
    if (
      sendingOtp ||
      verifyingOtp
    ) {
      return;
    }

    setShowEmailModal(false);
    setNewEmail("");
    setOtp("");
    setEmailStep("email");
  };

  // ==========================================================
  // SEND EMAIL OTP
  // ==========================================================

  const handleSendEmailOtp = async (
    event
  ) => {
    event.preventDefault();

    clearMessages();

    const normalizedEmail =
      newEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage(
        "Please enter your new email address."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setErrorMessage(
        "Please enter a valid email address."
      );
      return;
    }

    if (
      normalizedEmail ===
      profile.email.toLowerCase()
    ) {
      setErrorMessage(
        "New email must be different from your current email."
      );
      return;
    }

    try {
      setSendingOtp(true);

      const { data } =
        await api.post(
          "/auth/email-change/request",
          {
            newEmail:
              normalizedEmail,
          }
        );

      setEmailStep("otp");

      setSuccessMessage(
        data?.message ||
          "Verification OTP has been sent to your new email address."
      );
    } catch (error) {
      console.error(
        "Email OTP request failed:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to send verification OTP."
        )
      );
    } finally {
      setSendingOtp(false);
    }
  };

  // ==========================================================
  // VERIFY EMAIL OTP
  // ==========================================================

  const handleVerifyEmailOtp = async (
    event
  ) => {
    event.preventDefault();

    clearMessages();

    const cleanOtp =
      otp.replace(/\D/g, "");

    if (cleanOtp.length !== 6) {
      setErrorMessage(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    try {
      setVerifyingOtp(true);

      const { data } =
        await api.post(
          "/auth/email-change/verify",
          {
            otp: cleanOtp,
          }
        );

      const updatedEmail =
        data?.email ||
        newEmail.trim().toLowerCase();

      setProfile((prev) => ({
        ...prev,
        email: updatedEmail,
      }));

      const storedUser =
        JSON.parse(
          localStorage.getItem("userInfo")
        ) || {};

      localStorage.setItem(
        "userInfo",
        JSON.stringify({
          ...storedUser,
          email: updatedEmail,
        })
      );

      setShowEmailModal(false);
      setNewEmail("");
      setOtp("");
      setEmailStep("email");

      setSuccessMessage(
        data?.message ||
          "Email address changed successfully."
      );
    } catch (error) {
      console.error(
        "Email OTP verification failed:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Invalid or expired verification code."
        )
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!deletePassword) {
      setErrorMessage(
        "Please enter your password."
      );
      return;
    }

    try {
      setDeletingAccount(true);

      const { data } =
        await api.delete(
          "/auth/account",
          {
            data: {
              password:
                deletePassword,
            },
          }
        );

      // Remove stored authentication data
      localStorage.removeItem("userInfo");

      // Close modal and clear password
      setShowDeleteModal(false);
      setDeletePassword("");

      setSuccessMessage(
        data?.message ||
          "Account and all associated data deleted successfully."
      );

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error(
        "Account deletion failed:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to delete your account. Please check your password and try again."
        )
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  // ==========================================================
  // PROFILE DISPLAY
  // ==========================================================

  const displayImage =
    previewUrl ||
    profileImage ||
    getProfileImage(user);

  const displayName =
    profile.name ||
    getUserName(user);

  const initials =
    getInitials(displayName);

  const isGoogleAccount =
    user?.authProvider === "google";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="settings-page">
      <div className="settings-container">

        {/* ================================================== */}
        {/* PAGE HEADER */}
        {/* ================================================== */}

        <header className="settings-header">

          <div className="settings-header-left">

            <p className="settings-eyebrow">
              ACCOUNT SETTINGS
            </p>

            <h1 className="settings-title">
              Settings
            </h1>

            <p className="settings-subtitle">
              Manage your account, security and
              personal preferences.
            </p>

          </div>

          <div className="settings-security-badge">

            <div className="settings-security-icon">
              <Icon
                type="shield"
                size={22}
              />
            </div>

            <div className="settings-security-text">

              <strong className="settings-security-title">
                Your data is secure
              </strong>

              <span className="settings-security-subtitle">
                We never share your personal data
              </span>

            </div>

          </div>

        </header>

        {/* ================================================== */}
        {/* GLOBAL MESSAGE */}
        {/* ================================================== */}

        {(successMessage ||
          errorMessage) && (
          <div
            className={
              successMessage
                ? "settings-alert success"
                : "settings-alert error"
            }
          >

            <div className="settings-alert-icon">
              <Icon
                type={
                  successMessage
                    ? "check"
                    : "info"
                }
                size={18}
              />
            </div>

            <div className="settings-alert-content">

              <strong>
                {successMessage
                  ? "Success"
                  : "Something went wrong"}
              </strong>

              <span>
                {successMessage ||
                  errorMessage}
              </span>

            </div>

            <button
              type="button"
              className="settings-alert-close"
              onClick={clearMessages}
            >
              <Icon
                type="x"
                size={16}
              />
            </button>

          </div>
        )}

        {/* ================================================== */}
        {/* PROFILE INFORMATION */}
        {/* ================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Icon
                type="user"
                size={23}
              />
            </div>

            <div className="settings-card-heading">

              <h2 className="settings-card-title">
                Profile information
              </h2>

              <p className="settings-card-description">
                Update your profile photo, name,
                currency and monthly income.
              </p>

            </div>

          </div>

          <form
            onSubmit={handleSaveProfile}
          >

            <div className="profile-settings-layout">

              {/* PHOTO */}

              <div className="profile-photo-section">

                <div className="profile-photo-wrapper">

                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt="Profile"
                      className="profile-photo"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div className="profile-photo-fallback">
                      {initials}
                    </div>
                  )}

                  <button
                    type="button"
                    className="profile-camera-button"
                    onClick={
                      handleChoosePhoto
                    }
                    aria-label="Change profile photo"
                  >
                    <Icon
                      type="camera"
                      size={17}
                    />
                  </button>

                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={
                    handleFileChange
                  }
                  style={{
                    display: "none",
                  }}
                />

                <button
                  type="button"
                  className="profile-photo-button"
                  onClick={
                    selectedFile
                      ? handleUploadPhoto
                      : handleChoosePhoto
                  }
                  disabled={
                    uploadingPhoto
                  }
                >
                  {uploadingPhoto
                    ? "Uploading..."
                    : selectedFile
                    ? "Upload photo"
                    : "Change photo"}
                </button>

                <p className="profile-photo-hint">
                  JPG, PNG up to 5MB
                </p>

              </div>

              {/* FORM */}

              <div className="settings-form-grid">

                {/* NAME */}

                <div className="settings-field">

                  <label
                    className="settings-label"
                    htmlFor="settings-name"
                  >
                    Full name
                  </label>

                  <input
                    id="settings-name"
                    className="settings-input"
                    type="text"
                    value={
                      profile.name
                    }
                    onChange={(e) =>
                      handleProfileChange(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Enter your full name"
                    disabled={
                      loadingProfile ||
                      savingProfile
                    }
                  />

                </div>

                {/* CURRENT EMAIL */}

                <div className="settings-field">

                  <label className="settings-label">
                    Current email
                  </label>

                  <input
                    className="settings-input"
                    type="email"
                    value={
                      profile.email
                    }
                    disabled
                    readOnly
                  />

                  <p className="settings-help">
                    Use the Email address section
                    below to change your email.
                  </p>

                </div>

                {/* CURRENCY */}

                <div className="settings-field">

                  <label
                    className="settings-label"
                    htmlFor="settings-currency"
                  >
                    Currency
                  </label>

                  <select
                    id="settings-currency"
                    className="settings-select"
                    value={
                      profile.currency
                    }
                    onChange={(e) =>
                      handleProfileChange(
                        "currency",
                        e.target.value
                      )
                    }
                    disabled={
                      loadingProfile ||
                      savingProfile
                    }
                  >

                    <option value="INR">
                      INR — Indian Rupee (₹)
                    </option>

                    <option value="USD">
                      USD — US Dollar ($)
                    </option>

                    <option value="EUR">
                      EUR — Euro (€)
                    </option>

                    <option value="GBP">
                      GBP — British Pound (£)
                    </option>

                  </select>

                </div>

                {/* INCOME */}

                <div className="settings-field">

                  <label
                    className="settings-label"
                    htmlFor="settings-income"
                  >
                    Monthly income
                  </label>

                  <div className="settings-input-prefix">

                    <span>
                      {profile.currency ===
                      "USD"
                        ? "$"
                        : profile.currency ===
                          "EUR"
                        ? "€"
                        : profile.currency ===
                          "GBP"
                        ? "£"
                        : "₹"}
                    </span>

                    <input
                      id="settings-income"
                      className="settings-input"
                      type="number"
                      min="0"
                      step="1"
                      value={
                        profile.monthlyIncome
                      }
                      onChange={(e) =>
                        handleProfileChange(
                          "monthlyIncome",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      disabled={
                        loadingProfile ||
                        savingProfile
                      }
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* PROFILE ACTIONS */}

            <div className="settings-actions">

              <button
                type="button"
                className="settings-button secondary"
                onClick={
                  handleResetProfile
                }
                disabled={
                  savingProfile
                }
              >
                <Icon
                  type="refresh"
                  size={16}
                />

                <span>
                  Reset
                </span>
              </button>

              <button
                type="submit"
                className="settings-button primary"
                disabled={
                  savingProfile ||
                  loadingProfile
                }
              >
                {savingProfile
                  ? "Saving..."
                  : "Save changes"}
              </button>

            </div>

          </form>

        </section>

        {/* ================================================== */}
        {/* EMAIL ADDRESS */}
        {/* ================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Icon
                type="mail"
                size={23}
              />
            </div>

            <div className="settings-card-heading">

              <h2 className="settings-card-title">
                Email address
              </h2>

              <p className="settings-card-description">
                A verification OTP will be sent
                to your new email address.
              </p>

            </div>

          </div>

          <div className="email-row">

            <div className="email-current-box">

              <span>
                {profile.email ||
                  "No email address"}
              </span>

              <span className="email-status">
                <Icon
                  type="check"
                  size={12}
                />

                Verified
              </span>

            </div>

            <button
              type="button"
              className="settings-button outline"
              onClick={
                handleOpenEmailModal
              }
            >
              Change email
            </button>

          </div>

        </section>

        {/* ================================================== */}
        {/* CHANGE PASSWORD */}
        {/* ================================================== */}

        <section className="settings-card">

          <div className="settings-card-header">

            <div className="settings-card-icon">
              <Icon
                type="lock"
                size={23}
              />
            </div>

            <div className="settings-card-heading">

              <h2 className="settings-card-title">
                Change password
              </h2>

              <p className="settings-card-description">
                Enter your current password before
                choosing a new one.
              </p>

            </div>

          </div>

          {isGoogleAccount ? (

            <div className="settings-info-box">

              <div className="settings-info-icon">
                <Icon
                  type="info"
                  size={19}
                />
              </div>

              <div>

                <strong>
                  Google account
                </strong>

                <p>
                  Your account uses Google
                  authentication. Password changes
                  are managed through Google.
                </p>

              </div>

            </div>

          ) : (

            <form
              onSubmit={
                handleChangePassword
              }
            >

              <div className="password-grid">

                <PasswordField
                  label="Current password"
                  value={
                    currentPassword
                  }
                  onChange={
                    setCurrentPassword
                  }
                  placeholder="Enter current password"
                  visible={
                    showCurrentPassword
                  }
                  onToggle={() =>
                    setShowCurrentPassword(
                      (value) => !value
                    )
                  }
                  disabled={
                    changingPassword
                  }
                />

                <PasswordField
                  label="New password"
                  value={
                    newPassword
                  }
                  onChange={
                    setNewPassword
                  }
                  placeholder="Enter new password"
                  visible={
                    showNewPassword
                  }
                  onToggle={() =>
                    setShowNewPassword(
                      (value) => !value
                    )
                  }
                  disabled={
                    changingPassword
                  }
                />

                <PasswordField
                  label="Confirm new password"
                  value={
                    confirmPassword
                  }
                  onChange={
                    setConfirmPassword
                  }
                  placeholder="Confirm new password"
                  visible={
                    showConfirmPassword
                  }
                  onToggle={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  disabled={
                    changingPassword
                  }
                />

              </div>

              <div className="password-bottom">

                <p className="password-requirement">
                  Minimum 6 characters
                </p>

                <button
                  type="submit"
                  className="settings-button outline"
                  disabled={
                    changingPassword
                  }
                >
                  {changingPassword
                    ? "Updating..."
                    : "Update password"}
                </button>

              </div>

            </form>

          )}

        </section>

        {/* ================================================== */}
        {/* DELETE ACCOUNT */}
        {/* ================================================== */}

        <section className="settings-card danger-card">

          <div className="settings-card-header">

            <div className="settings-card-icon danger-icon">
              <Icon
                type="x"
                size={23}
              />
            </div>

            <div className="settings-card-heading">

              <h2 className="settings-card-title">
                Delete account
              </h2>

              <p className="settings-card-description">
                Permanently delete your account and
                all associated expenses and budgets.
              </p>

            </div>

          </div>

          <div className="delete-account-content">

            <div className="delete-account-warning">

              <Icon
                type="info"
                size={18}
              />

              <div>

                <strong>
                  This action cannot be undone.
                </strong>

                <p>
                  Your profile, expenses and budgets
                  will be permanently deleted.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="settings-button danger-button"
              onClick={() => {
                clearMessages();
                setDeletePassword("");
                setShowDeletePassword(false);
                setShowDeleteModal(true);
              }}
            >
              Delete account
            </button>

          </div>

        </section>

        {/* ================================================== */}
        {/* SECURITY FOOTER */}
        {/* ================================================== */}

        <div className="settings-success">

          <div className="settings-success-icon">
            <Icon
              type="shield"
              size={21}
            />
          </div>

          <div>

            <p className="settings-success-title">
              Keep your account secure
            </p>

            <p className="settings-success-text">
              Never share your password or email
              verification codes with anyone.
            </p>

          </div>

        </div>

      </div>

      {/* ==================================================== */}
      {/* EMAIL CHANGE MODAL */}
      {/* ==================================================== */}

      {showEmailModal && (

        <div
          className="settings-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseEmailModal();
            }
          }}
        >

          <div className="settings-modal">

            <div className="settings-modal-header">

              <div className="settings-modal-icon">
                <Icon
                  type={
                    emailStep === "otp"
                      ? "shield"
                      : "mail"
                  }
                  size={23}
                />
              </div>

              <button
                type="button"
                className="settings-modal-close"
                onClick={
                  handleCloseEmailModal
                }
                disabled={
                  sendingOtp ||
                  verifyingOtp
                }
              >
                <Icon
                  type="x"
                  size={19}
                />
              </button>

            </div>

            {emailStep === "email" ? (

              <>
                <h3 className="settings-modal-title">
                  Change email address
                </h3>

                <p className="settings-modal-description">
                  Enter your new email address.
                  We'll send a 6-digit verification
                  code to it.
                </p>

                <form
                  onSubmit={
                    handleSendEmailOtp
                  }
                >

                  <div className="settings-field">

                    <label
                      className="settings-label"
                      htmlFor="new-email"
                    >
                      New email address
                    </label>

                    <input
                      id="new-email"
                      className="settings-input"
                      type="email"
                      value={newEmail}
                      onChange={(e) =>
                        setNewEmail(
                          e.target.value
                        )
                      }
                      placeholder="you@example.com"
                      autoFocus
                      disabled={
                        sendingOtp
                      }
                    />

                  </div>

                  <div className="settings-modal-actions">

                    <button
                      type="button"
                      className="settings-button secondary"
                      onClick={
                        handleCloseEmailModal
                      }
                      disabled={
                        sendingOtp
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="settings-button primary"
                      disabled={
                        sendingOtp
                      }
                    >
                      {sendingOtp
                        ? "Sending..."
                        : "Send OTP"}
                    </button>

                  </div>

                </form>
              </>

            ) : (

              <>
                <h3 className="settings-modal-title">
                  Verify your new email
                </h3>

                <p className="settings-modal-description">
                  Enter the 6-digit OTP sent to
                  <strong>
                    {" "}
                    {newEmail}
                  </strong>
                  .
                </p>

                <form
                  onSubmit={
                    handleVerifyEmailOtp
                  }
                >

                  <div className="settings-field">

                    <label
                      className="settings-label"
                      htmlFor="email-otp"
                    >
                      Verification code
                    </label>

                    <input
                      id="email-otp"
                      className="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(0, 6)
                        )
                      }
                      placeholder="000000"
                      autoFocus
                    />

                  </div>

                  <div className="otp-hint">

                    <Icon
                      type="info"
                      size={15}
                    />

                    <span>
                      The verification code
                      expires after 10 minutes.
                    </span>

                  </div>

                  <div className="settings-modal-actions">

                    <button
                      type="button"
                      className="settings-button secondary"
                      onClick={() =>
                        setEmailStep(
                          "email"
                        )
                      }
                      disabled={
                        verifyingOtp
                      }
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="settings-button primary"
                      disabled={
                        verifyingOtp
                      }
                    >
                      {verifyingOtp
                        ? "Verifying..."
                        : "Verify & change"}
                    </button>

                  </div>

                </form>
              </>

            )}

          </div>

        </div>

      )}

      {/* ==================================================== */}
      {/* DELETE ACCOUNT MODAL */}
      {/* ==================================================== */}

      {showDeleteModal && (

        <div
          className="settings-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !deletingAccount
            ) {
              setShowDeleteModal(false);
            }
          }}
        >

          <div className="settings-modal delete-modal">

            <div className="settings-modal-header">

              <div className="settings-modal-icon danger-modal-icon">
                <Icon
                  type="info"
                  size={23}
                />
              </div>

              <button
                type="button"
                className="settings-modal-close"
                onClick={() =>
                  setShowDeleteModal(false)
                }
                disabled={
                  deletingAccount
                }
              >
                <Icon
                  type="x"
                  size={19}
                />
              </button>

            </div>

            <h3 className="settings-modal-title">
              Delete your account?
            </h3>

            <p className="settings-modal-description">
              This will permanently delete your
              account, expenses and budgets.
              <strong>
                {" "}
                This action cannot be undone.
              </strong>
            </p>

            <form
              onSubmit={
                handleDeleteAccount
              }
            >

              <PasswordField
                label="Enter your password to confirm"
                value={deletePassword}
                onChange={setDeletePassword}
                placeholder="Enter your password"
                visible={
                  showDeletePassword
                }
                onToggle={() =>
                  setShowDeletePassword(
                    (value) => !value
                  )
                }
                disabled={
                  deletingAccount
                }
              />

              <div className="settings-modal-actions">

                <button
                  type="button"
                  className="settings-button secondary"
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                  disabled={
                    deletingAccount
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="settings-button danger-button"
                  disabled={
                    deletingAccount ||
                    !deletePassword
                  }
                >
                  {deletingAccount
                    ? "Deleting..."
                    : "Delete permanently"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}