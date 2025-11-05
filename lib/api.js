import axios from "axios";
import { API_CONFIG, ERROR_MESSAGES } from "@/constants";

// Create axios instance with default config
const api = axios.create({
  baseURL: "/api",
  timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth tokens here if needed
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const errorMessage =
      error.response?.data?.message || error.message || ERROR_MESSAGES.API_ERROR;
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    } else if (error.response?.status === 500) {
      console.error("Server error:", errorMessage);
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
      return Promise.reject(new Error(ERROR_MESSAGES.TIMEOUT_ERROR));
    } else if (!error.response) {
      console.error("Network error");
      return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
    }

    return Promise.reject(error);
  }
);

export default api;

