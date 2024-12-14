import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// Define the structure of the backend error response
interface BackendError {
  message: string;
}

// Function to register a user
export const registerUser = async (userData: {
  email: string;
  password: string;
  name: string;
  clerkUserId: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<BackendError>;
    throw new Error(
      axiosError.response?.data?.message || "Registration failed"
    );
  }
};

// Function to log in a user
export const loginUser = async (userData: {
  email: string;
  password: string;
}) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, userData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<BackendError>;
    throw new Error(axiosError.response?.data?.message || "Login failed");
  }
};

// Function to get user profile
export const getUserProfile = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<BackendError>;
    throw new Error(
      axiosError.response?.data?.message || "Failed to fetch profile"
    );
  }
};
