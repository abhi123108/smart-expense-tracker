import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem("userInfo");

    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);

        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error(
          "Invalid userInfo in localStorage:",
          error
        );

        localStorage.removeItem("userInfo");
      }
    }

    // IMPORTANT:
    // Do not force Content-Type for FormData.
    // Browser will automatically set:
    // multipart/form-data; boundary=...
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auto logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("userInfo");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;