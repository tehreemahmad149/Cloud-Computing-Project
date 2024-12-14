"use client";
import { useAuth } from "@/providers/AuthContext";
import { getUserProfile, logoutFromFirebase } from "./api/route";
import { useEffect, useState } from "react";

interface UserProfile {
  email: string;
  name: string;
  storageUsed: number;
  dailyBandwidthUsed: number;
}

const HomePage = () => {
  const { token, initialized } = useAuth(); // Wait for Firebase to initialize
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    if (token) {
      try {
        const profile = await getUserProfile(token); // Fetch profile from backend
        setUserProfile(profile);
        setError(null); // Clear error if fetching succeeds
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to fetch user profile.");
        setUserProfile(null); // Reset profile state on error
      }
    } else {
      setError("User not logged in.");
      setUserProfile(null); // Reset profile state if no token
    }
    setLoadingProfile(false);
  };

  useEffect(() => {
    if (initialized) {
      fetchProfile(); // Fetch user profile once Firebase is initialized
    }
  }, [initialized, token]); // Re-fetch if token updates

  const handleLogout = async () => {
    try {
      await logoutFromFirebase();
      window.location.href = "/login";
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  if (!initialized) {
    return <p>Loading...</p>; // Show loading while Firebase initializes
  }

  return (
    <div>
      <h1>Welcome to Your App</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loadingProfile ? (
        <p>Loading user profile...</p>
      ) : userProfile ? (
        <div>
          <p>Email: {userProfile.email}</p>
          <p>Name: {userProfile.name}</p>
          <p>Storage Used: {userProfile.storageUsed} bytes</p>
          <p>Daily Bandwidth Used: {userProfile.dailyBandwidthUsed} bytes</p>
        </div>
      ) : (
        <p>No user profile available.</p>
      )}
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
};

export default HomePage;
