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
      // Handle unauthorized - redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Only redirect if not already on login/register page
        if (!window.location.pathname.includes("/admin/login") && !window.location.pathname.includes("/admin/register")) {
          window.location.href = "/admin/login";
        }
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden - show error message
      console.error("Access forbidden:", errorMessage);
    } else if (error.response?.status === 500) {
      console.error("Server error:", errorMessage);
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
      return Promise.reject(new Error(ERROR_MESSAGES.TIMEOUT_ERROR));
    } else if (!error.response) {
      // Only log network errors when there's truly no response (actual network issue)
      // Don't log for expected errors like 400/404 which have responses
      console.error("Network error:", error.message || "No response from server");
      return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
    }
    
    // For errors with response (400, 404, etc.), pass through the original error
    // so calling code can handle them appropriately
    return Promise.reject(error);
  }
);

export default api;

