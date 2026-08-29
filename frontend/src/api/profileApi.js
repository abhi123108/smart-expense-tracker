import api from "./axios";

// =====================================================
// UPDATE PROFILE
// =====================================================

export const updateProfile = async (profileData) => {
  const { data } = await api.put(
    "/auth/profile",
    profileData
  );

  return data;
};

// =====================================================
// REQUEST EMAIL CHANGE OTP
// =====================================================

export const requestEmailChangeOtp = async (newEmail) => {
  const { data } = await api.post(
    "/auth/profile/email/request",
    {
      newEmail,
    }
  );

  return data;
};

// =====================================================
// VERIFY EMAIL CHANGE OTP
// =====================================================

export const verifyEmailChangeOtp = async (
  newEmail,
  otp
) => {
  const { data } = await api.post(
    "/auth/profile/email/verify",
    {
      newEmail,
      otp,
    }
  );

  return data;
};

// =====================================================
// UPLOAD PROFILE PHOTO
// =====================================================

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();

  formData.append(
    "profilePicture",
    file
  );

  const { data } = await api.post(
    "/profile/photo",
    formData,
    {
      headers: {
        "Content-Type": undefined,
      },
    }
  );

  return data;
};

// =====================================================
// REMOVE PROFILE PHOTO
// =====================================================

export const removeProfilePhoto = async () => {
  const { data } = await api.delete(
    "/profile/photo"
  );

  return data;
};