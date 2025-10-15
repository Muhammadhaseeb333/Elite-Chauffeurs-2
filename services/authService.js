// authService.js
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
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
        await signOut(auth);
        throw new Error("Please verify your email before logging in.");
      }
  
      return user;
    } catch (error) {
      console.log("ERROR IS", error);
      throw new Error(error.message || "Invalid email or password.");
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
  