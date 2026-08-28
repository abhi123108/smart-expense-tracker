import api from './axios';

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();

  formData.append('profilePicture', file);

  const { data } = await api.post(
    '/profile/photo',
    formData
  );

  return data;
};

export const removeProfilePhoto = async () => {
  const { data } = await api.delete(
    '/profile/photo'
  );

  return data;
};