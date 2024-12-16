"use client";
import { useState } from "react";
import { registerUser } from "../api/route";


const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignUp = async () => {
    try {
      await registerUser(email, password, name);
      setSuccess("Registration successful!");
      setError("");
    } catch (err) {
      // Renamed to `err` for clarity
      console.error("Registration error:", err); // Log the actual error
      setError("Failed to register. Please try again.");
      setSuccess("");
    }
  };

  return (
    <div>
      <h1>Sign Up</h1>
      <input
        type="name"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUp}>Sign Up</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
};

export default SignUpPage;
