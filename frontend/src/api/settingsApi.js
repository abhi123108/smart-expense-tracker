import api from "./axios";

// =====================================================
// GET PROFILE
// =====================================================

export const getProfile = async () => {
  const { data } = await api.get("/auth/profile");
  return data;
};

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
// DELETE ACCOUNT
// =====================================================

export const deleteAccount = async (password) => {
  const { data } = await api.delete(
    "/auth/account",
    {
      data: {
        password,
      },
    }
  );

  return data;
};