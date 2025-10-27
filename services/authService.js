// authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/config/firebaseConfig";

// Register a new user
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Log in a user (with email verification check)
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (!user.emailVerified) {
      // Instead of signing out, we'll throw a specific error
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    return user;
  } catch (error) {
    console.log("ERROR IS", error);
    
    // If it's our custom error for unverified email, re-throw it
    if (error.message === "EMAIL_NOT_VERIFIED") {
      throw error;
    }
    
    // For other errors, throw the original message
    throw new Error(error.message || "Invalid email or password.");
  }
};

// Send email verification
export const sendVerificationEmail = async (user) => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error) {
    throw new Error(error.message || "Failed to send verification email.");
  }
};

// Log out the user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error("Logout failed.");
  }
};

// Listen for authentication state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};