import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView } from "react-native";
import { db } from "@/config/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { Platform } from "react-native";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      return Alert.alert("Error", "Please enter your email.");
    }

    setIsLoading(true);

    try {
      // Check if email exists in Firestore customers collection
      const usersRef = collection(db, "customers");
      const q = query(usersRef, where("email", "==", email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setIsLoading(false);
        return Alert.alert("Account Not Found", "No account found with this email address.");
      }

      // If exists, send Firebase's built-in reset email
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Email Sent", "Password reset link sent to your email.");
      navigation.goBack();

    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "Failed to send reset email. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={handleSendOtp}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1115",
    padding: 20,
    justifyContent: "center"
  },
  title: {
    color: "#b88a44",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center"
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 25,
    textAlign: "center"
  },
  input: {
    backgroundColor: "#1c1e23",
    color: "#fff",
    padding: 14,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
    width: Platform.OS === "ios" ? "90%" : "100%",  // 👈 ADD this
    alignSelf: "center",  // 👈 ADD this
  },
  button: {
    backgroundColor: "#b88a44",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    width: Platform.OS === "ios" ? "90%" : "100%",  // 👈 ADD this
    alignSelf: "center",  // 👈 ADD this
  },
  disabledButton: {
    opacity: 0.7
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  },
  backButton: {
    marginTop: 20,
    alignItems: "center"
  },
  backButtonText: {
    color: "#b88a44",
    fontSize: 14
  }
});
