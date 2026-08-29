import api from "./axios";

export const getProfile = async () => {
  const { data } = await api.get("/auth/profile");
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put(
    "/auth/profile",
    profileData
  );

  return data;
};