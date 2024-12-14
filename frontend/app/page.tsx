"use client";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useAuth,
} from "@clerk/nextjs";
import { useEffect } from "react";
import { loginUser, registerUser } from "./api/route";

const RootPage = () => {
  const { isSignedIn, userId, getToken } = useAuth();

  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (isSignedIn && userId) {
        try {
          const response = await fetch(`/api/clerk-user?userId=${userId}`);
          if (!response.ok) {
            console.error("Failed to fetch user data from Clerk API route");
            return;
          }

          const user = await response.json();
          const { id: clerkUserId, email_addresses, first_name } = user;

          // Sync with backend
          const email = email_addresses[0]?.email_address;

          const isNewUser = await checkIfNewUser(email); // Backend API to check if user exists
          if (isNewUser) {
            await registerUser({
              email,
              password: "placeholder_password", // Replace with proper implementation
              name: first_name || "Unknown User",
              clerkUserId,
            });
            console.log("User registered with backend.");
          } else {
            await loginUser({
              email,
              password: "placeholder_password", // Replace with proper implementation
            });
            console.log("User logged in with backend.");
          }
        } catch (error) {
          console.error("Error syncing user with backend:", error);
        }
      }
    };

    syncUserWithBackend();
  }, [isSignedIn, userId, getToken]);

  return (
    <main className="root-page">
      <h1>Welcome to Your App</h1>
      <p>Explore the features and functionalities.</p>
      <SignedIn>
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </main>
  );
};

const checkIfNewUser = async (email: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/check-user?email=${encodeURIComponent(email)}`
    );
    const { isNewUser } = await response.json();
    return isNewUser;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false;
  }
};

export default RootPage;
